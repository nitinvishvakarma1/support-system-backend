// This is Admin Controller
import express from "express";
import { CustomRequest, generateUniqueId, Messages, StatusCodes } from "../config";
import queryModel from "../model/queryModel";
import userModel from "../model/userModel";
import { Request, Response } from "express";
import roleModel from "../model/roleModel";
export const adminViewRaisedQueryListController = async (
  request: express.Request,
  response: express.Response
) => {
  try {
    const raisedQueries = await queryModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "id",
          as: "userDetails"
        }
      },
      {
        $unwind: {
          path: "$userDetails",
        }
      },
      {
        $lookup: {
          from: "roleMaster",
          localField: "userDetails.roleId",
          foreignField: "id",
          as: "roleDetails"
        }
      },
      {
        $unwind: {
          path: "$roleDetails",
        }
      },
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
              { $cond: { if: { $ne: ["$userDetails.lastName", null] }, then: " ", else: "" } },
              { $ifNull: ["$userDetails.lastName", ""] }
            ]
          },
          userEmail: "$userDetails.email",
          status: "$status"
        }
      },
      {
        $sort: {
          updatedAt: -1,
          createdAt: -1
        }
      }
    ]);

    if (raisedQueries) {
      response.status(StatusCodes.OK).json({
        raisedQueries: raisedQueries,
        message: "These are the recently raised queries ..!",
      });
    } else {
      response.status(StatusCodes.NOT_FOUND).json({
        raisedQueries: null,
        message: "No Query has been raise by the user yet ..!",
      });
    }
  } catch (error) {
    console.log("Error occure in userRaiseQueryController : ", error);
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong ..!" });
  }
};

export const adminViewUserListController = async (
  request: express.Request,
  response: express.Response
) => {
  try {
    console.log("Hello from adminViewUserListController")
    const userList = await userModel.aggregate([
      {
        $project: {
          _id: 0,
          id: 1,
          name: {
            $cond: {
              if: { $or: [{ $eq: ["$lastName", ""] }, { $eq: ["$lastName", null] }] }, // Check if lastName is empty or null
              then: "$firstName", // Assign name to firstName if lastName is empty or null
              else: { $concat: ["$firstName", " ", "$lastName"] }, // Otherwise, concatenate firstName and lastName
            },
          },
          email: 1,
          contactNumber: 1,
          roleId: 1,
          profileImg: 1,
          isActive: 1,
        },
      },
      {
        $lookup: {
          from: 'roleMaster',
          localField: 'roleId',
          foreignField: 'id',
          as: 'roleDetails',
        },
      },
      {
        $unwind: {
          path: '$roleDetails',
        },
      },
      {
        $project: {
          id: 1,
          name: 1,
          email: 1,
          contactNumber: 1,
          role: '$roleDetails.name',
          profileImg: 1,
          isActive: 1,
        },
      },
      {
        $sort: { updatedAt: -1, createdAt: -1 },
      },
    ]);

    console.log("userList from adminViewUserListController", userList)

    if (userList && userList.length > 0) {
      response.status(StatusCodes.OK).json({
        userList: userList,
        message: "Registered user fetched successfully  ..!",
      });
    } else {
      response
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User list not found ..!" });
    }
  } catch (error) {
    console.log("Error occure in adminViewUserListController : ", error);
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong ..!" });
  }
};


export const adminManageStudentStatusController = async (
  request: CustomRequest,
  response: express.Response
) => {
  try {
    const { email, role, status } = request.body;
    if (!email || (status !== false && status !== true)) {
      return response.status(StatusCodes.BAD_REQUEST).json({ mesage: Messages.MISSING_OR_INVALID });
    }

    // Convert status to boolean
    const statusToUpdate = status;
    console.log("status to update ", statusToUpdate)

    if (role === "Admin") {
      return response.status(StatusCodes.FORBIDDEN).json({ message: Messages.UPDATION_FAILED });
    }
    console.log("status to update ", statusToUpdate)
    const result = await userModel.updateOne(
      { email: email },
      { $set: { isActive: statusToUpdate } }
    );

    console.log("result ", result)

    if (result?.acknowledged) {
      console.log("User status updated successfully ..!");
      return response
        .status(StatusCodes.OK)
        .json({ message: "User status updated successfully ..!" });
    } else {
      return response
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found or update failed" });
    }
  } catch (error) {
    console.error("Error updating user status:", error);
    return response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Something went wrong" });
  }
};

export const adminAddContactNumberController = async (
  request: CustomRequest,
  response: Response
) => {
  try {
    const { email, roleName } = request.payload || {};
    const { contactNumber } = request.body;
    console.log("Hello from adminAddContactNumberController ..!");
    if (!email || !roleName) {
      response.status(StatusCodes.NOT_FOUND).json({ message: Messages.PAYLOAD_MISSING_OR_INVALID });
    } else {
      const result = await userModel.updateOne(
        { email, roleName },
        { $set: { contactNumber: contactNumber } }
      );
      if (result?.acknowledged) {
        console.log("Contact Number added successfully ..!");
        response
          .status(StatusCodes.OK)
          .json({ message: "Contact number updated successfully!" });
      } else {
        response
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "Something went wrong ..!" });
      }
    }
  } catch (error) {
    console.log(error);
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong ..!" });
  }
};

export const registerUserController = async (request: CustomRequest, response: Response) => {
  try {
    // console.log("Before request.payload ..!")
    const { roleId: adminRoleId, userId: adminId } = request.payload || {};
    const { name, email, contactNumber, role } = request.body;
    // console.log(`User Data to Register`, request.body)

    if (!name || !email || !role) {
      return response.status(StatusCodes.BAD_REQUEST).json({
        message: "Missing required fields: name, email, and role are required.",
      });
    }
    const [firstName, lastName] = name.split(" ");
    // console.log(`after name spliting`)

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      const authHeader = request.headers["authorization"];
      if (authHeader === "VSA-Sales-Team") {
        console.log("VSA-Sales-Team authorization detected, bypassing authentication.");
        response.status(StatusCodes.OK).json({
          message: "User Already Exists on Support Portal !",
        });
      }
      return response.status(StatusCodes.ALREADY_EXIST).json({
        message: Messages.ALREADY_EXIST,
      });
    }
    // console.log(`after existingUser checking `)

    const roleDetails = await roleModel.findOne({ name: role });
    if (!roleDetails) {
      return response.status(StatusCodes.FORBIDDEN).json({
        message: `The Role You Provided is Unknown or Invalid, ${Messages.CREATION_FAILED}`,
      });
    }
    // console.log(`after roleDetails checking `)

    const userId = await generateUniqueId(userModel, "USER")
    const userData = await userModel.create({
      id: userId,
      firstName,
      lastName,
      email,
      contactNumber,
      roleId: roleDetails?.id,
      isActive: true,
      createdBy: adminId || "VSA-CRM-Portal",
      updatedBy: adminId || "VSA-CRM-Portal",
      createrRole: adminRoleId || "ROLE0003", // counsellor
      updaterRole: adminRoleId || "ROLE0003", // counsellor
    });

    if (!userData) {
      response.status(StatusCodes.NO_CONTENT).json({
        message: Messages.CREATION_FAILED,
      });
    }
    response.status(StatusCodes.CREATED).json({
      message: "User registered successfully!",
      user: {
        name: userData.firstName + userData.lastName,
        email: userData.email,
        contactNumber: userData.contactNumber,
        role: userData.roleId,
        isActive: userData.isActive,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while registering the user.",
    });
  }
};



