import express from "express";
import {
  adminManageStudentStatusController,
  adminViewRaisedQueryListController,
  adminViewUserListController,
  registerUserController,
} from "../controller/adminController";
import { updateContactNumberController, viewProfileController } from "../controller/profileController";
import { authenticateJWT, authenticationController } from "../controller/authController";
import { createQueryController, getQueryDataController, HandleQueryResponseController, manageQueryStatusController } from "../controller/queryController";

import { uploadAttachmentAssureMiddleware } from '../utilities/fileupload';

import { google } from "googleapis";

const adminRouter = express.Router();
adminRouter.get("/adminAuthentication", authenticationController);

adminRouter.use(authenticateJWT);

adminRouter.get("/adminViewProfile", viewProfileController);
adminRouter.get("/adminViewRaisedQueries", adminViewRaisedQueryListController);
adminRouter.get('/adminGetQueryData/:queryId', getQueryDataController);

adminRouter.get("/adminViewUserList", adminViewUserListController);

adminRouter.post('/adminManageQueryStatus/:queryId/:status', manageQueryStatusController);
adminRouter.post('/adminManageStudentStatus', adminManageStudentStatusController);

adminRouter.post("/adminRaiseQuery", createQueryController);
// adminRouter.post("/adminAddResponseToQuery/:queryId", uploadAttachmentMiddleware, HandleQueryResponseController);
adminRouter.post(
  "/adminAddResponseToQuery/:queryId",
  uploadAttachmentAssureMiddleware,
  HandleQueryResponseController
);
adminRouter.post("/registerUser", registerUserController);
adminRouter.post("/adminAddContactNumber", updateContactNumberController);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_SECRET,
  process.env.REDIRECT_URI

);

adminRouter.get("/folders", async (req, res) => {
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder'", // Only fetch folders
      fields: "files(id, name)",
    });

    const folders = response.data.files?.map((file: any) => ({
      id: file.id!,
      name: file.name!,
    }));

    res.status(201).json(folders || []);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).send("Failed to fetch folders");
  }
});

adminRouter.post("/grant-access", async (req, res) => {
  const { folderId, studentEmail } = req.body;

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "reader", // or "writer"
        type: "user",
        emailAddress: studentEmail,
      },
    });
    res.status(200).send("Access granted successfully!");
  } catch (error) {
    console.error("Error granting access:", error);
    res.status(500).send("Failed to grant access");
  }
});

// Remove Access Endpoint
adminRouter.post("/remove-access", async (req, res) => {
  const { folderId, studentEmail } = req.body;

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const permissions = await drive.permissions.list({
      fileId: folderId,
      fields: "permissions(id,emailAddress)",
    });

    // Check if permissions.data.permissions exists
    if (!permissions.data.permissions) {
      return res.status(404).send("No permissions found for this folder.");
    }

    // Find the permission ID for the student email
    const permission = permissions.data.permissions.find(
      (p: any) => p.emailAddress === studentEmail
    );

    if (permission?.id) {
      await drive.permissions.delete({
        fileId: folderId,
        permissionId: permission.id,
      });
      res.status(200).send("Access removed successfully!");
    } else {
      res.status(404).send("Permission not found for the specified student.");
    }
  } catch (error) {
    console.error("Error removing access:", error);
    res.status(500).send("Failed to remove access");
  }
});




export default adminRouter;