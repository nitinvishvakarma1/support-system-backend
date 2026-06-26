import jwt from "jsonwebtoken";
import {
  ADMIN_SECRET_KEY,
  COUNSELLOR_SECRET_KEY,
  STUDENT_SECRET_KEY,
} from "../config";

interface Payload {
  name: string;
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
  googleToken: string;
  isActive: boolean;
}

const getSecretKey = (roleName: string): string | undefined => {
  switch (roleName) {
    case "Admin": return ADMIN_SECRET_KEY;
    case "Counsellor": return COUNSELLOR_SECRET_KEY;
    case "Student": return STUDENT_SECRET_KEY;
    default: return undefined;
  }
};

export const tokenGenerator = (data: Payload) => {
  const { roleName } = data;
  const secretKey = getSecretKey(roleName);
  if (!secretKey) {
    throw new Error(`Secret key for role ${roleName} not found`);
  }
  const token = jwt.sign(data, secretKey, { expiresIn: "365d" });
  console.log("Generated Token ==> ", token);
  return token;
};


export const tokenVerifier = (token: string, secretKey: string) => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    const tokenPayload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = tokenPayload.exp * 1000;

    if (Date.now() >= expirationTime) {
      throw new Error('Token has expired');
    }
    const payload = jwt.verify(token, secretKey);
    return payload;
  } catch (error: any) {
    console.error("Token verification failed:", error.message);
    throw new Error(error.message);  
  }
};

const isTokenExpired = (): boolean => {

  return true;
};