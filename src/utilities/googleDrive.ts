import fs from "fs";
import path from "path";
import { google, drive_v3 } from "googleapis";
import nodemailer from "nodemailer";
import { EMAIL_PASSWORD, EMAIL_SERVICE, EMAIL_USERNAME } from "../config";

let driveClient: drive_v3.Drive | null = null;
let mailTransporter: nodemailer.Transporter | null = null;
let initialized = false;

const loadCredentials = (): Record<string, string> | null => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  const filePath = path.resolve(
    process.cwd(),
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "service-account.json"
  );

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const initGoogleDriveServices = () => {
  if (initialized) return;
  initialized = true;

  try {
    const credentials = loadCredentials();
    if (!credentials) {
      console.warn(
        "Google Drive: service account not configured (optional). Manage Access / Notes Drive features disabled."
      );
      return;
    }

    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ["https://www.googleapis.com/auth/drive"]
    );

    driveClient = google.drive({ version: "v3", auth });
  } catch (error) {
    console.warn("Google Drive initialization failed:", (error as Error).message);
  }

  if (EMAIL_USERNAME && EMAIL_PASSWORD) {
    mailTransporter = nodemailer.createTransport({
      service: EMAIL_SERVICE || "gmail",
      auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD,
      },
    });
  }
};

export const isGoogleDriveConfigured = (): boolean => {
  initGoogleDriveServices();
  return driveClient !== null;
};

export const getDriveClient = (): drive_v3.Drive => {
  initGoogleDriveServices();
  if (!driveClient) {
    throw new Error("Google Drive is not configured on this server");
  }
  return driveClient;
};

export const getMailTransporter = (): nodemailer.Transporter | null => {
  initGoogleDriveServices();
  return mailTransporter;
};
