import NodeClam from "clamscan";
import { env } from "../config/env.js";

let clamClient: NodeClam | null = null;

async function getClamClient(): Promise<NodeClam | null> {
  if (!env.CLAMAV_ENABLED) {
    return null;
  }

  if (clamClient) {
    return clamClient;
  }

  let clamscan: any;
  try {
    clamscan = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      scanLog: undefined,
      debugMode: false,
      clamdscan: {
        socket: false,
        host: env.CLAMAV_HOST,
        port: env.CLAMAV_PORT,
        timeout: 20000,
        localFallback: false,
        path: undefined,
        configFile: undefined,
        multiscan: false,
        reloadDb: false,
        active: true,
        bypassTest: true
      },
      preference: "clamdscan"
    });
  } catch (error) {
    console.warn("ClamAV unavailable; skipping malware scan:", (error as Error).message);
    return null;
  }

  clamClient = clamscan as unknown as NodeClam;
  return clamClient;
}

export async function ensureBufferIsClean(buffer: Buffer): Promise<void> {
  const client = await getClamClient();
  if (!client) {
    return;
  }

  const scanner = (client as any).scanBuffer;
  if (typeof scanner !== "function") {
    console.warn("ClamAV scanBuffer not available in current client; skipping malware scan");
    return;
  }

  try {
    const result = await scanner.call(client, buffer);
    if (result?.isInfected) {
      const viruses = result.viruses?.join(", ") ?? "Unknown malware";
      throw new Error(`Upload rejected by ClamAV: ${viruses}`);
    }
  } catch (error) {
    console.warn("ClamAV scan failed; allowing upload:", (error as Error).message);
  }
}
