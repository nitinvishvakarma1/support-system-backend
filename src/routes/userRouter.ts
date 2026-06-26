import express from "express";
import {
  updateContactNumberController,
  viewProfileController,
} from "../controller/profileController";
import {
  forgotPasswordController,
  loginController,
  resetPasswordController,
  verifyOTPController,
} from "../controller/loginController";
import {
  authenticateJWT,
  authenticationController,
} from "../controller/authController";
import {
  createQueryController,
  getQueryDataController,
  handleFileAttachmentController,
  HandleQueryResponseController,
  manageQueryStatusController,
  viewMyQueriesController,
} from "../controller/queryController";
import { getEnrolledCoursesController } from "../controller/enrollmentController";
import { uploadAttachmentAssureMiddleware } from "../utilities/fileupload";

const userRouter = express.Router();

// -----------------------------
// Public Routes (No JWT)
// -----------------------------
userRouter.post("/userLogin", loginController);
userRouter.get("/userAuthentication", authenticationController);

userRouter.post("/auth/forgot-password", forgotPasswordController);
userRouter.post("/auth/verify-otp", verifyOTPController);
userRouter.post("/auth/reset-password", resetPasswordController);

// -----------------------------
// Protected Routes (JWT Required)
// -----------------------------
userRouter.use(authenticateJWT);

// Profile
userRouter.get("/viewProfile", viewProfileController);
userRouter.get("/enrolledCourses/:userId", getEnrolledCoursesController);

// Queries
userRouter.get("/userViewMyQueries", viewMyQueriesController);
userRouter.get("/userGetQueryData/:queryId", getQueryDataController);

// Contact
userRouter.post("/userAddContactNumber", updateContactNumberController);

// Raise New Query (with attachments)
userRouter.post(
  "/userRaiseQuery",
  uploadAttachmentAssureMiddleware,
  createQueryController
);

// Manage Query Status
userRouter.post(
  "/userManageQueryStatus/:queryId/:status",
  manageQueryStatusController
);

// Add Comment/Response to Query (with attachments)
userRouter.post(
  "/userAddCommentToQuery/:queryId",
  uploadAttachmentAssureMiddleware,
  HandleQueryResponseController
);

// Handle File Attachments (add/delete)
userRouter.put(
  "/attachment/:queryId/:action",
  uploadAttachmentAssureMiddleware,
  handleFileAttachmentController
);

export default userRouter;
