import { CustomRequest, generateUniqueId, Messages, StatusCodes } from "../config";
import { Request, Response } from "express";
import queryModel from "../model/queryModel";
import { uploadAttachmentAssureMiddleware, saveAttachment, deleteAttachment } from "../utilities/fileupload";

// -----------------------------
// Handle Adding / Deleting Attachments
// -----------------------------
export const handleFileAttachmentController = async (
  request: CustomRequest,
  response: Response
) => {
  try {
    if (!request.payload) {
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Payload missing or invalid." });
    }

    const { queryId, action } = request.params;
    const { filename } = request.body;

    if (!queryId) {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "QueryId is required." });
    }

    const query = await queryModel.findOne({ id: queryId });
    if (!query) {
      return response
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Query not found." });
    }

    query.attachments = query.attachments || [];

    // New attachments
    if (action === "newAttachment") {
      if (!request.files || !Array.isArray(request.files)) {
        return response
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "No files uploaded." });
      }

      if (request.files.length > 3) {
        return response
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "You can only attach up to 3 files at a time." });
      }

      const newAttachments: string[] = [];
      for (const file of request.files) {
        const url = await saveAttachment(file);
        newAttachments.push(url);
      }

      if (query.attachments.length + newAttachments.length > 6) {
        return response
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Total attachments cannot exceed 6 files." });
      }

      query.attachments.push(...newAttachments);
    }

    // Delete attachment
    else if (action === "deleteAttachment") {
      if (!filename) {
        return response
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Filename is required." });
      }

      await deleteAttachment(filename);
      query.attachments = query.attachments.filter((att) => att !== filename);
    }

    else {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid action." });
    }

    const updatedQuery = await query.save();

    return response.status(StatusCodes.OK).json({
      message:
        action === "newAttachment"
          ? "Attachments have been successfully added."
          : "Attachment has been successfully deleted.",
      attachments: updatedQuery.attachments,
    });
  } catch (error) {
    console.error("Error in handleFileAttachmentController:", error);
    return response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to process the file attachments." });
  }
};

// -----------------------------
// Add Response with Attachments
// -----------------------------
export const HandleQueryResponseController = async (
  request: CustomRequest,
  response: Response
) => {
  try {
    const payload = request.payload;
    if (!payload) {
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: Messages.PAYLOAD_MISSING_OR_INVALID });
    }

    const { userId, roleId } = payload;
    const { queryId } = request.params;
    const { text } = request.body;

    if (!queryId || !text) {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: `QueryId and Message ${Messages.REQUIRED}` });
    }

    const query = await queryModel.findOne({ id: queryId });
    if (!query) {
      return response
        .status(StatusCodes.NOT_FOUND)
        .json({ message: `Query ${Messages.DATA_NOT_FOUND}` });
    }

    if (!["Open", "in-progress"].includes(query.status)) {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Query has been closed by the user!" });
    }

    // Handle new attachments
    const files = request.files as Express.Multer.File[] | undefined;
    const attachments: { originalname: string; filename: string; location: string }[] = [];

    if (files?.length) {
      for (const file of files) {
        if (!file || !file.buffer) continue;
        const location = await saveAttachment(file);
        attachments.push({
          originalname: file.originalname,
          filename: file.originalname,
          location,
        });
      }
    }

    // Add response
    query.conversation.push({
      sender: userId,
      roleId,
      message: text,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (attachments.length > 0) {
      query.attachments.push(...attachments.map((a) => a.location));
    }

    await query.save();

    return response.status(StatusCodes.CREATED).json({
      message: "Your response has been sent to the inquirer successfully!",
      attachments,
    });
  } catch (error) {
    console.error("Error in HandleQueryResponseController:", error);
    return response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Failed to process the query." });
  }
};

// -----------------------------
// Get Query Data
// -----------------------------
export const getQueryDataController = async (
  request: CustomRequest,
  response: Response
) => {
  try {
    if (!request.payload) {
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: Messages.PAYLOAD_MISSING_OR_INVALID });
    }

    const { roleName: currentRole } = request.payload;
    const { queryId } = request.params;

    const result = await queryModel.aggregate([
      { $match: { id: queryId } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      { $unwind: "$conversation" },
      {
        $lookup: {
          from: "users",
          localField: "conversation.sender",
          foreignField: "id",
          as: "senderDetails",
        },
      },
      {
        $unwind: {
          path: "$senderDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "roleMaster",
          localField: "conversation.roleId",
          foreignField: "id",
          as: "roleDetails",
        },
      },
      {
        $unwind: {
          path: "$roleDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: 1,
          userId: 1,
          subject: 1,
          message: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          attachments: 1,
          userName: {
            $concat: [
              "$userDetails.firstName",
              {
                $cond: {
                  if: { $ne: ["$userDetails.lastName", null] },
                  then: " ",
                  else: "",
                },
              },
              { $ifNull: ["$userDetails.lastName", ""] },
            ],
          },
          userEmail: { $ifNull: ["$userEmail", "$userDetails.email"] },
          userRole: { $ifNull: ["$userRole", ""] },
          conversation: {
            sender: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$roleDetails.name", "Admin"] },
                    { $ne: [currentRole, "Admin"] },
                  ],
                },
                then: "Support Admin",
                else: {
                  $concat: [
                    "$senderDetails.firstName",
                    {
                      $cond: {
                        if: { $ne: ["$senderDetails.lastName", null] },
                        then: " ",
                        else: "",
                      },
                    },
                    { $ifNull: ["$senderDetails.lastName", ""] },
                  ],
                },
              },
            },
            senderId: "$conversation.sender",
            message: "$conversation.message",
            senderRole: "$roleDetails.name",
            timestamp: "$conversation.timestamp",
          },
        },
      },
      {
        $group: {
          _id: null,
          userId: { $first: "$userId" },
          subject: { $first: "$subject" },
          message: { $first: "$message" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          userName: { $first: "$userName" },
          userEmail: { $first: "$userEmail" },
          userRole: { $first: "$userRole" },
          attachments: { $first: "$attachments" },
          conversation: { $push: "$conversation" },
        },
      },
      { $set: { id: queryId } },
      { $limit: 1 },
    ]);

    if (result.length > 0) {
      const queryData = result[0];
      return response.status(StatusCodes.OK).json({
        queryData,
        message: "Query has been fetched successfully!",
      });
    } else {
      return response
        .status(StatusCodes.NOT_FOUND)
        .json({ queryData: null, message: "Query not found!" });
    }
  } catch (error) {
    console.error("Error while fetching query data", error);
    return response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong ..!" });
  }
};

// -----------------------------
// Manage Query Status
// -----------------------------
export const manageQueryStatusController = async (
  request: CustomRequest,
  response: Response
) => {
  try {
    const roleName = request.payload?.roleName;
    const { queryId, status } = request.params;
    const { userEmail } = request.body;

    if (!queryId || !status) {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: `QueryId or Status ${Messages.MISSING_OR_INVALID}` });
    }

    const statusToUpdate = status.toLowerCase();
    const validStatuses = ["in-progress", "closed"];
    if (!validStatuses.includes(statusToUpdate)) {
      return response.status(StatusCodes.BAD_REQUEST).json({
        message: `Status must be one of the following: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    const query = await queryModel.findOne({ id: queryId, userEmail });
    if (!query) {
      return response
        .status(StatusCodes.NOT_FOUND)
        .json({ message: `Query ${Messages.DATA_NOT_FOUND}` });
    }

    if (query.status.toLowerCase() === "closed") {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: Messages.ALREADY_CLOSED });
    }

    if (roleName === "Student" && statusToUpdate !== "closed") {
      return response
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Students can only close the query." });
    }

    query.status = statusToUpdate;
    await query.save();

    return response
      .status(StatusCodes.CREATED)
      .json({ message: "Query status updated successfully!" });
  } catch (error) {
    console.error("Error while updating query status:", error);
    return response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to update query status." });
  }
};

// -----------------------------
// Create New Query
// -----------------------------
export const createQueryController = async (
  request: CustomRequest,
  response: Response
) => {
  try {
    const { email, roleName, userId, roleId } = request.payload || {};
    const { subject, message } = request.body;

    const existing = await queryModel.findOne({
      userEmail: email,
      userRole: roleName,
      subject,
      message,
    });
    if (existing) {
      return response
        .status(StatusCodes.ALREADY_EXIST)
        .json({ message: "A similar query already exists!" });
    }

    const queryId = await generateUniqueId(queryModel, "QUERY");

    const attachments: string[] = [];
    if (request.files && Array.isArray(request.files)) {
      for (const file of request.files) {
        const url = await saveAttachment(file);
        attachments.push(url);
      }
    }

    await queryModel.create({
      id: queryId,
      userId,
      userEmail: email,
      userRole: roleName,
      subject,
      message,
      conversation: [
        {
          sender: userId,
          message,
          roleId,
          timestamp: new Date(),
        },
      ],
      attachments,
    });

    return response
      .status(StatusCodes.OK)
      .json({ message: "Your query has been successfully published ..!" });
  } catch (error) {
    console.error("Error in createQueryController:", error);
    return response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to create query" });
  }
};

// -----------------------------
// View My Queries
// -----------------------------
export const viewMyQueriesController = async (
  request: CustomRequest,
  response: Response
) => {
  try {
    const { userId } = request.payload || {};
    const myQueries = await queryModel.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $lookup: {
          from: "roleMaster",
          localField: "userDetails.roleId",
          foreignField: "id",
          as: "roleDetails",
        },
      },
      { $unwind: "$roleDetails" },
      {
        $project: {
          _id: 0,
          id: "$id",
          subject: "$subject",
          message: "$message",
          userRole: "$roleDetails.name",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          userName: {
            $concat: [
              "$userDetails.firstName",
              {
                $cond: {
                  if: { $ne: ["$userDetails.lastName", null] },
                  then: " ",
                  else: "",
                },
              },
              { $ifNull: ["$userDetails.lastName", ""] },
            ],
          },
          userEmail: "$userDetails.email",
          status: "$status",
        },
      },
      { $sort: { updatedAt: -1, createdAt: -1 } },
    ]);

    if (myQueries) {
      return response.status(StatusCodes.OK).json({
        myQueries,
        message: "These are the recently raised queries by you ..!",
      });
    } else {
      return response
        .status(StatusCodes.NOT_FOUND)
        .json({ myQueries: null, message: "No queries found." });
    }
  } catch (error) {
    console.error("Error in viewMyQueriesController:", error);
    return response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong ..!" });
  }
};
