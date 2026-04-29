import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

let initialized = false;

function resolveServiceAccountFromFile() {
  const configuredPath = process.env.FCM_SERVICE_ACCOUNT_FILE;
  if (!configuredPath) {
    // Try to auto-discover a service account file in project root matching common Firebase SDK pattern
    try {
      const files = fs.readdirSync(process.cwd());
      const match = files.find((f) => f.includes("firebase-adminsdk") && f.endsWith(".json"));
      if (match) {
        const raw = fs.readFileSync(path.resolve(process.cwd(), match), "utf8");
        const parsed = JSON.parse(raw);
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: String(parsed.private_key || "").replace(/\\n/g, "\n")
        };
      }
    } catch (e) {
      // ignore and fallthrough to null
    }
    return null;
  }

  try {
    const absolutePath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);
    const raw = fs.readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: String(parsed.private_key || "").replace(/\\n/g, "\n")
    };
  } catch (error) {
    console.warn("Firebase service-account file load failed:", (error as Error).message);
    return null;
  }
}

export function initFirebase() {
  if (initialized) {
    return;
  }

  const fromFile = resolveServiceAccountFromFile();
  const projectId = (fromFile?.projectId ?? process.env.FCM_PROJECT_ID)?.toString().trim();
  const clientEmail = (fromFile?.clientEmail ?? process.env.FCM_CLIENT_EMAIL)?.toString().trim();
  let privateKeyRaw = fromFile?.privateKey ?? process.env.FCM_PRIVATE_KEY;
  if (typeof privateKeyRaw === "string") {
    privateKeyRaw = privateKeyRaw.replace(/\\n/g, "\n").trim();
  }

  if (!projectId || !clientEmail || !privateKeyRaw) {
    console.warn("Firebase credentials not found or incomplete. To enable push, set FCM_SERVICE_ACCOUNT_FILE or FCM_PROJECT_ID/FCM_CLIENT_EMAIL/FCM_PRIVATE_KEY env vars.");
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKeyRaw as string
      })
    });

    initialized = true;
  } catch (error) {
    // Allow local/dev startup even when FCM credentials are not configured correctly.
    console.warn("Firebase initialization skipped:", (error as Error).message);
  }
}

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
  urgent = false
) {
  if (!initialized || tokens.length === 0) {
    return;
  }

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
    android: { priority: urgent ? "high" : "normal" },
    apns: {
      headers: {
        "apns-priority": urgent ? "10" : "5"
      }
    }
  });
}
