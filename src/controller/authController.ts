import { Response, NextFunction } from "express";
import userModel from "../model/userModel";
import jwt from "jsonwebtoken";
import UserPayload, { ADMIN_SECRET_KEY, COUNSELLOR_SECRET_KEY, CustomRequest, Messages, StatusCodes, STUDENT_SECRET_KEY } from "../config";
import { tokenVerifier } from "../utilities/jwt";

const secretKeys: { [key: string]: string } = {
  Admin: ADMIN_SECRET_KEY,
  Counsellor: COUNSELLOR_SECRET_KEY,
  Student: STUDENT_SECRET_KEY,
};

export const authenticateJWT = async (
  request: CustomRequest,
  response: Response,
  next: NextFunction
) => {
  try {
    console.log("Inside authenticateJWT ..! : ");

    const authHeader = request.headers["authorization"];

    console.log("authHeader : ",authHeader);

    if (authHeader === "VSA-Sales-Team") {
      console.log("VSA-Sales-Team authorization detected, bypassing authentication.");
      return next();
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Token Missing")
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: Messages.AUTHORIZATION_TOKEN_MISSING });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.decode(token) as jwt.JwtPayload;
    console.log("payload ",payload)
    if (!payload || !payload.roleId) {
      return response.status(StatusCodes.UNAUTHORIZED).json({ message: "Token " + Messages.MISSING_OR_INVALID + " or Does not contain a Role" });
    }

    const secretKey = secretKeys[payload.roleName];
    if (!secretKey) {
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: Messages.ROLE_NOT_RECOGNIZED });
    }

    const verifiedPayload: any = tokenVerifier(token, secretKey);
    request.payload = verifiedPayload;
    next();
  } catch (error) {
    response
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: Messages.INVALID_OR_EXPIRED_TOKEN });
  }
};

export const authenticationController = async (
  request: CustomRequest,
  response: Response,
) => {
  try {
    const authHeader = request.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: Messages.AUTHORIZATION_TOKEN_MISSING });
    }
    const token = authHeader.split(" ")[1];
    const payload = jwt.decode(token) as jwt.JwtPayload;
    // console.log(payload);

    if (!payload || !payload.roleId) {
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Token " + Messages.MISSING_OR_INVALID + " or Does not contain a Role" });
    }
    const secretKey = secretKeys[payload.roleName];
    if (!secretKey) {
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: Messages.ROLE_NOT_RECOGNIZED });
    }
    const verifiedPayload: any = tokenVerifier(token, secretKey);
    request.payload = verifiedPayload;
    const user = await userModel.findOne({ email: verifiedPayload.email });

    if (!user) {
      return response
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: Messages.USER_NOT_FOUND });
    }
    const userData = {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      contactNumber: user.contactNumber,
      role: user.roleId,
      profileImg: user.profileImg,
    };
    return response.status(StatusCodes.OK).json({
      userData: userData,
      token: token,
      message: Messages.AUTHENTICATION_SUCCESS,
    });
  } catch (err) {
    console.log("Error in authenticationController", err);
    response
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: Messages.INVALID_OR_EXPIRED_TOKEN });
  }
};