import express from "express";
import axios from "axios";
import userModel from "../model/userModel";
import { tokenGenerator } from "../utilities/jwt";
import {
  generateUniqueId,
  GOOGLE_DECODE_TOKEN_API,
  Messages,
  StatusCodes,
} from "../config";
import roleModel from "../model/roleModel";
import { comparePasswords, hashPassword } from "../utilities/password";
import { sendEmail } from "../utilities/mailer";

interface TokenResponse {
  access_token: string;
}

var otp: string = "";

const verifyGoogleToken = async (tokenResponse: TokenResponse) => {
  try {
    const result = await axios.get(`${GOOGLE_DECODE_TOKEN_API}`, {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });
    return result.data || null;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null; // Return null if there's an error
  }
};

const sendLoginResponse = async (
  response: express.Response,
  user: any,
  googleToken?: string
) => {
  const roleDetails = await roleModel.findOne({ id: user.roleId });

  const result = {
    name: `${user.firstName} ${user.lastName}`,
    userId: user.id,
    email: user.email,
    contactNumber: user.contactNumber,
    profileImg: user.profileImg,
    role: roleDetails?.name || "Not mentioned",
  };

  const payload = {
    name: `${user.firstName} ${user.lastName}`,
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: roleDetails ? roleDetails.name : "Not mentioned",
    googleToken: googleToken ? googleToken : "",
    isActive: user.isActive,
  };

  const token = tokenGenerator(payload);
  return response.status(StatusCodes.CREATED).json({
    userData: result,
    token: token,
    message: "Login Successful!",
  });
};

export const loginController = async (
  request: express.Request,
  response: express.Response
) => {
  try {
    const { tokenResponse, email, password } = request.body;

    if (tokenResponse?.access_token) {
      const decodedToken = await verifyGoogleToken(tokenResponse);

      if (!decodedToken) {
        return response.status(StatusCodes.UNAUTHORIZED).json({
          message: "Invalid Google token!",
        });
      }

      const { given_name, family_name = "", picture, email: googleEmail, email_verified } = decodedToken;

      console.log("decodedToken ==> ", decodedToken)
      console.log("family_name ==> ", family_name)
      if (!email_verified) {
        return response.status(StatusCodes.BAD_REQUEST).json({ message: Messages.GOOGLE_AUTHENTICATION_FAILED });
      }

      let user = await userModel.findOne({ email: googleEmail });
      if (!user) {
        return response.status(StatusCodes.NOT_FOUND).json({
          message: Messages.USER_NOT_FOUND,
        });
      }

      user.email = googleEmail;
      user.firstName = given_name;
      user.lastName = family_name;
      user.profileImg = picture;
      await user.save();
      return sendLoginResponse(response, user, tokenResponse.access_token);
    }

    if (email && password) {
      const existingUser = await userModel.findOne({ email: email });
      console.log("existingUser : ", existingUser);

      if (!existingUser) {
        return response
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Invalid credentials" });
      }

      if (existingUser.password === null || existingUser.password === undefined || existingUser.password === "") {
        const hashedPassword = await hashPassword(password);
        existingUser.password = hashedPassword;
        await existingUser.save();
        console.log("Password updated successfully");
        return sendLoginResponse(response, existingUser);
      };

      const isPasswordValid = await comparePasswords(password, existingUser.password);
      if (!isPasswordValid) {
        return response
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Invalid credentials" });
      }
      return sendLoginResponse(response, existingUser);
    }

    return response
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Either Google token or email/password required" });

  } catch (error) {
    console.error(error);
    return response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.SOMETHING_WENT_WRONG });
  }
};

export const forgotPasswordController = async (
  request: express.Request,
  response: express.Response
) => {
  try {
    const { email } = request.body;
    const existinguser = await userModel.findOne({ email: email });
    if (!existinguser) {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User not found with specified Email !" });
    } else {
      otp = "";
      var data = request.body;
      for (let i = 1; i <= 6; i++) {
        otp += Math.floor(Math.random() * 10);
      }
      console.log("6", otp);

      const mailOptions = {
        from: 'vishnitin51@gmail.com',
        to: data.email,
        subject: 'VSA CRM Portal Password Reset OTP',
        text: `This is your OTP for signing up on the Vector Skill Academy CRM Portal.
Your One-Time Password is: ${otp}

Please do not share this OTP with anyone.
– Vector Skill Academy Support Team`
      };

      const { success } = await sendEmail(mailOptions);

      response.status(StatusCodes.OK).json({
        message: success ? "OTP sent successfully" : "Failed to send OTP",
      });
    }
  }
  catch (err) {
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.SOMETHING_WENT_WRONG });
  }
};

export const verifyOTPController = async (
  request: express.Request,
  response: express.Response
) => {
  try {
    const { email, otp: userOtp } = request.body;

    if (!email || !userOtp) {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email and OTP are required" });
    }

    if (otp === userOtp) {
      return response.status(StatusCodes.OK).json({
        success: true,
        message: "OTP verified successfully",
      });
    } else {
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid OTP" });
    }
  } catch (error: any) {
    console.error("Error in verifyOTPController:", error.message);
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.SOMETHING_WENT_WRONG });
  }
}

export const resetPasswordController = async (
  request: express.Request,
  response: express.Response
) => {
  try {
    const { email, newPassword } = request.body;

    if (!email || !newPassword) {
      return response
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email and new password are required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return response
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    otp = "";
    response.status(StatusCodes.OK).json({
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("Error in resetPasswordController:", error.message);
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: Messages.SOMETHING_WENT_WRONG });
  }
};


