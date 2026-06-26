import { Response } from "express";
import enrollmentModel from "../model/enrollmentModel";
import { CustomRequest, Messages, StatusCodes } from "../config";

export const getEnrolledCoursesController = async (
  request: CustomRequest,
  response: Response
) => {
  try {
    const { userId } = request.params;
    const requesterId = request.payload?.userId;
    const roleName = request.payload?.roleName;

    if (!userId) {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User id is required." });
    }

    if (roleName !== "Admin" && requesterId !== userId) {
      return response
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "You can only view your own enrollments." });
    }

    const orders = await enrollmentModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return response.status(StatusCodes.OK).json({
      userData: {
        id: userId,
        orders,
      },
      message: Messages.FETCHED_SUCCESSFULLY,
    });
  } catch (error) {
    console.error("Error in getEnrolledCoursesController:", error);
    return response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.SOMETHING_WENT_WRONG });
  }
};
