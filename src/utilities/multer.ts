import multer from 'multer';
import path from 'path';
import fs from 'fs';
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY_ID, AWS_BUCKET_NAME, AWS_REGION, AWS_SECRET_KEY } from "../config";

export const s3 = new S3Client({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_KEY!,
  },
  region: AWS_REGION!,
});

const createS3Storage = (bucketName: string, subfolder: string) => {
  return multerS3({
    s3: s3,
    bucket: bucketName, // Use only the bucket name
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const sanitizedFilename = file.originalname.replace(/\s+/g, '');
      const uniqueName = `${Date.now()}-${sanitizedFilename}`;
      cb(null, uniqueName); // Add subfolder path here
    },
  });
};


const fileFilter = (allowedTypes: string[]) => {
  return (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!file) {
      return cb(null, true);
    }
    const isValid = allowedTypes.some((type) => file.mimetype.includes(type));
    if (!isValid) {
      return cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`));
    }
    cb(null, true);
  };
};

export const uploadAttachmentMiddleware = multer({
  storage: createS3Storage(AWS_BUCKET_NAME!, "attachments"),
  fileFilter: fileFilter(["image", "pdf"]),
}).array("attachment");
// // Define the destination directory
// const uploadDirectory = path.resolve(__dirname, '..', 'uploads', 'attachments');

// // Check if the directory exists, and create it if it doesn't
// if (!fs.existsSync(uploadDirectory)) {
//   fs.mkdirSync(uploadDirectory, { recursive: true });
//   console.log("Directory created:", uploadDirectory);
// }

// // Define multer storage configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDirectory);
//   },
//   filename: (req, file, cb) => {
//     const fileExtension = path.extname(file.originalname);
//     const fileName = file.originalname.split('.')[0];
//     // cb(null, ${fileName}${fileExtension});
//     cb(null, ${Date.now()}${fileName}${fileExtension});
//   },
// });

// const uploadAttachment = multer({
//   storage,
//   limits: { fileSize: 4 * 1024 * 1024 },
// });

// // This is to handle the file uploads for the route handler
// export const uploadAttachmentMiddleware = uploadAttachment.array('attachments'); // Handle multiple files uploaded under the 'files' field