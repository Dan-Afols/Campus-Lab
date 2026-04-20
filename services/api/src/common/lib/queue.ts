import { Queue, Worker, JobsOptions } from "bullmq";
import axios from "axios";
import * as cheerio from "cheerio";
import pdfParse from "pdf-parse";
import robotsParser from "robots-parser";
import { env } from "../config/env.js";
import { redis } from "./redis.js";
import { prisma } from "./prisma.js";
import { sendEmailOtp } from "../utils/emailer.js";

const connection = { host: redis.options.host, port: redis.options.port };
const parseRobots = ((robotsParser as any).default ?? robotsParser) as (url: string, txt: string) => any;

async function canFetchUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
    const robotsTxt = await axios.get(robotsUrl, { timeout: 8000 });
    const robots = parseRobots(robotsUrl, robotsTxt.data);
    return robots.isAllowed(url, "CampusLabBot") ?? false;
  } catch {
    return false;
  }
}

function uniquePdfLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const out = new Set<string>();

  $("a[href]").each((_idx, el) => {
    const href = $(el).attr("href");
    if (!href) {
      return;
    }

    const absolute = new URL(href, baseUrl).toString();
    if (absolute.toLowerCase().includes(".pdf")) {
      out.add(absolute);
    }
  });

  return Array.from(out);
}

async function fetchAndExtractPdf(pdfUrl: string): Promise<string | null> {
  try {
    const response = await axios.get<ArrayBuffer>(pdfUrl, {
      responseType: "arraybuffer",
      timeout: 20000
    });
    const parsed = await pdfParse(Buffer.from(response.data));
    return parsed.text?.slice(0, 15000) ?? null;
  } catch {
    return null;
  }
}

async function findExternalPdfCandidates(courseName: string, departmentName: string): Promise<Array<{ source: string; url: string }>> {
  const query = `${courseName} ${departmentName}`.trim().replace(/\s+/g, "+");
  const candidates = [
    `https://openstax.org/search?query=${query}`,
    `https://ocw.mit.edu/search/?q=${query}`,
    `https://open.umn.edu/opentextbooks/textbooks?term=${query}`
  ];

  const links: Array<{ source: string; url: string }> = [];

  for (const pageUrl of candidates) {
    const allowed = await canFetchUrl(pageUrl);
    if (!allowed) {
      continue;
    }

    try {
      const page = await axios.get<string>(pageUrl, { timeout: 12000 });
      const pdfLinks = uniquePdfLinks(page.data, pageUrl).slice(0, env.SCRAPE_MAX_LINKS);
      for (const pdf of pdfLinks) {
        links.push({ source: new URL(pageUrl).host, url: pdf });
      }
    } catch {
      continue;
    }
  }

  return links;
}

export const emailQueue = new Queue("email", {
  connection,
  prefix: env.QUEUE_PREFIX,
  skipVersionCheck: true,
  defaultJobOptions: { removeOnComplete: true, attempts: 3 }
});

export const summaryQueue = new Queue("summary", {
  connection,
  prefix: env.QUEUE_PREFIX,
  skipVersionCheck: true,
  defaultJobOptions: { removeOnComplete: true, attempts: 2 }
});

export const scrapeQueue = new Queue("scrape", {
  connection,
  prefix: env.QUEUE_PREFIX,
  skipVersionCheck: true,
  defaultJobOptions: { removeOnComplete: true, attempts: 2 }
});

export async function enqueueEmailOtp(to: string, code: string, purpose: string, opts?: JobsOptions) {
  try {
    await emailQueue.add("send-otp", { to, code, purpose }, opts);
  } catch (error) {
    // Keep auth flows functional in local/dev when queue backend is temporarily unavailable.
    console.warn("Email queue unavailable, falling back to direct send:", (error as Error).message);
    await sendEmailOtp(to, code, purpose);
  }
}

export async function enqueueMaterialSummary(materialId: string, text: string) {
  await summaryQueue.add("summarize-material", { materialId, text });
}

export async function enqueueScrapeFallback(
  courseName: string,
  departmentName: string,
  departmentId: string,
  departmentLevelId: string
) {
  await scrapeQueue.add("scrape-fallback", { courseName, departmentName, departmentId, departmentLevelId });
}

export function startQueueWorkers() {
  new Worker(
    "email",
    async (job) => {
      if (job.name === "send-otp") {
        await sendEmailOtp(job.data.to, job.data.code, job.data.purpose);
      }
    },
    { connection, prefix: env.QUEUE_PREFIX, skipVersionCheck: true }
  );

  new Worker(
    "summary",
    async (job) => {
      if (job.name !== "summarize-material") {
        return;
      }

      const summary = await axios.post(`${env.AI_SERVER_BASE_URL}/ai/summarize`, {
        text: String(job.data.text).slice(0, 20000)
      });

      await prisma.material.update({
        where: { id: job.data.materialId },
        data: { aiSummary: summary.data.summary }
      });
    },
    { connection, prefix: env.QUEUE_PREFIX, concurrency: 2, skipVersionCheck: true }
  );

  new Worker(
    "scrape",
    async (job) => {
      if (job.name !== "scrape-fallback") {
        return;
      }

      const course = String(job.data.courseName);
      const department = String(job.data.departmentName);
      const departmentId = String(job.data.departmentId);
      const departmentLevelId = String(job.data.departmentLevelId);

      const courseRecord = await prisma.course.findFirst({
        where: {
          departmentId,
          OR: [{ title: { contains: course, mode: "insensitive" } }, { code: { contains: course, mode: "insensitive" } }]
        }
      });

      if (!courseRecord) {
        return;
      }

      const candidates = await findExternalPdfCandidates(course, department);
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
      if (!admin) {
        return;
      }

      for (const candidate of candidates) {
        const text = await fetchAndExtractPdf(candidate.url);
        if (!text) {
          continue;
        }

        const summary = await axios.post(`${env.AI_SERVER_BASE_URL}/ai/summarize`, {
          text
        });

        await prisma.material.create({
          data: {
            title: `${courseRecord.code} external material`,
            description: `Scraped from ${candidate.source}`,
            type: "PDF",
            courseId: courseRecord.id,
            departmentId,
            departmentLevelId,
            uploadedById: admin.id,
            fileUrl: candidate.url,
            externalSourceUrl: candidate.url,
            aiSummary: summary.data.summary,
            isExternal: true,
            approvedByAdmin: false
          }
        });
      }
    },
    { connection, prefix: env.QUEUE_PREFIX, concurrency: 1, skipVersionCheck: true }
  );
}
