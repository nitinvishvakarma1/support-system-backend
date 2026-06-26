import multer from "multer";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";
import stream from "stream";
import { AZURE_STORAGE_CONNECTION_STRING, NODE_ENV, PORT } from "../config";

const CONTAINER_NAME = "uploads";
const PREFIX = "attachments/";
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads", "attachments");
const useLocalStorage = NODE_ENV !== "production";

if (useLocalStorage) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

const blobServiceClient = AZURE_STORAGE_CONNECTION_STRING
  ? BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
  : null;

export const containerClient = blobServiceClient
  ? blobServiceClient.getContainerClient(CONTAINER_NAME)
  : null;

const storage = multer.memoryStorage();

export const uploadAttachmentAssureMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "attachment"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("attachment", 3);

const getLocalFileUrl = (fileName: string) =>
  `http://localhost:${PORT}/uploads/attachments/${fileName}`;

const saveAttachmentLocally = async (
  file: Express.Multer.File
): Promise<string> => {
  const fileName = `${uuid()}${path.extname(file.originalname)}`;
  const filePath = path.join(LOCAL_UPLOAD_DIR, fileName);
  await fs.promises.writeFile(filePath, file.buffer);
  return getLocalFileUrl(fileName);
};

export const saveAttachmentToAzure = async (
  file: Express.Multer.File
): Promise<string> => {
  if (!file?.buffer) {
    throw new Error("Invalid or missing file");
  }

  if (!containerClient) {
    throw new Error("Azure storage is not configured");
  }

  const blobName = `${PREFIX}${uuid()}${path.extname(file.originalname)}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const bufferStream = new stream.PassThrough();
  bufferStream.end(file.buffer);

  await blockBlobClient.uploadStream(bufferStream, 4 * 1024 * 1024, 5, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return blockBlobClient.url;
};

export const saveAttachment = async (
  file: Express.Multer.File
): Promise<string> => {
  if (useLocalStorage) {
    return saveAttachmentLocally(file);
  }

  try {
    return await saveAttachmentToAzure(file);
  } catch (error) {
    console.error("Azure upload failed, falling back to local storage:", error);
    return saveAttachmentLocally(file);
  }
};

export const deleteAttachment = async (fileUrl: string): Promise<void> => {
  if (fileUrl.includes("/uploads/attachments/")) {
    const fileName = fileUrl.split("/uploads/attachments/").pop();
    if (!fileName) return;

    const filePath = path.join(LOCAL_UPLOAD_DIR, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return;
  }

  if (!containerClient) return;

  const blobName = fileUrl.split("/").slice(-2).join("/");
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
};
