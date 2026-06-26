import { Response, Request } from "express";
import userModel from "../model/userModel";
import { CustomRequest, Messages, StatusCodes } from "../config";

export const viewProfileController = async (
  request: CustomRequest,
  response: Response
) => {
  try {
    let userId = request.payload?.userId;
    if (!userId) {
      return response.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.PAYLOAD_MISSING_OR_INVALID });
    }
    const result = await userModel.findOne({ id: userId });
    if (!result) {
      return response.status(StatusCodes.NOT_FOUND).json({ message: "Account " + Messages.THIS_NOT_FOUND });
    } else if (result?.isActive) {
      const userData = {
        userId: result.id,
        name: `${result.firstName} ${result.lastName}`.trim(),
        email: result.email,
        contactNumber: result.contactNumber,
        profileImg: result.profileImg,
        role: request.payload?.roleName,
        enrollmentNumber: result.id,
        enrollmentDate: result.createdAt
          ? new Date(result.createdAt).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        isActive: result.isActive,
      };
      return response.status(StatusCodes.OK).json({
        userData,
        message: "Userdata " + Messages.FETCHED_SUCCESSFULLY,
      });
    }

    return response
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: Messages.ACCOUNT_DEACTIVATED });
  } catch (error) {
    console.log(error);
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.SOMETHING_WENT_WRONG });
  }
};

export const updateContactNumberController = async (request: CustomRequest, response: Response) => {
  try {
      const userEmail = request.payload?.email;
      const { contactNumber } = request.body;
      if (!userEmail) {
          response.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.PAYLOAD_MISSING_OR_INVALID });
      } else {
          const result = await userModel.updateOne(
              { email: userEmail },
              { $set: { contactNumber: contactNumber } },
          );
          console.log('ContactNumber updated ', result)

          if (result?.acknowledged) {
              response.status(StatusCodes.OK).json({ message: "Contact number updated successfully ..!" });
          } else {
              response.status(StatusCodes.UNAUTHORIZED).json({ message: "The account you are trying to access has been deactivated!" });
          }
      }
  } catch (error) {
      console.log(error);
      response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong ..!" });

  }
}

// export const UpdateProfileController = async (
//   request: CustomRequest,
//   response: Response
// ) => {
//   try {
//     const { email, roleName } = request.payload || {};
//     if (!email || !roleName) {
//       return response
//         .status(StatusCodes.UNAUTHORIZED)
//         .json({ message: Messages.PAYLOAD_MISSING_OR_INVALID });
//     }
//     const { userId } = request.params;
//     const user = await userModel.findOne({ id: userId });
//     if (!user) {
//       return response
//         .status(StatusCodes.NOT_FOUND)
//         .json({ message: Messages.USER_NOT_FOUND });
//     }
//     const { firstName, lastName, userEmail, contactNumber, roleId, isActive } = request.body;
//     if (firstName && firstName !== user.firstName) {
//       user.firstName = firstName;
//     }
//     if (lastName && lastName !== user.lastName) {
//       user.lastName = lastName;
//     }
//     if (userEmail && userEmail !== user.email) {
//       user.email = userEmail;
//     }
//     if (contactNumber && contactNumber !== user.contactNumber) {
//       user.contactNumber = contactNumber;
//     }
//     if (roleId && roleId !== user.roleId) {
//       user.roleId = roleId;
//     }
//     if (typeof isActive !== "undefined" && isActive !== user.isActive) {
//       user.isActive = isActive;
//     }
//     user.updatedBy = email!;
//     user.updaterRole = roleName!;
//     const updatedUser = await user.save();

//     return response.status(StatusCodes.OK).json({
//       message: "Profile " + Messages.UPDATED_SUCCESSFULLY,
//       updatedUser,
//     });
//   } catch (error) {
//     console.error("Error in UpdateProfile:", error);
//     return response
//       .status(StatusCodes.INTERNAL_SERVER_ERROR)
//       .json({ message: Messages.SOMETHING_WENT_WRONG });
//   }
// };