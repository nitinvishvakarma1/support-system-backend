import { Request } from "express";
import dotenv from "dotenv";
import queryModel from "./model/queryModel";
dotenv.config();

export const CONNECTION_STRING: string = process.env.CONNECTION_STRING as string;
export const PORT: string = process.env.PORT as string;
export const COUNSELLOR_SECRET_KEY: string = process.env.COUNSELLOR_SECRET_KEY as string;
export const STUDENT_SECRET_KEY: string = process.env.STUDENT_SECRET_KEY as string;
export const ADMIN_SECRET_KEY: string = process.env.ADMIN_SECRET_KEY as string;
export const GOOGLE_DECODE_TOKEN_API: string = process.env.GOOGLE_DECODE_TOKEN_API as string;
export const NODE_ENV: string = process.env.NODE_ENV as string;
if (NODE_ENV === "production") {
    console.log = () => {}; 
}
export const ALLOWED_ORIGIN: string = (NODE_ENV === "production" ) ? process.env.PRODUCTION_ORIGIN as string : process.env.LOCAL_ORIGIN as string;
export const VSA_CRM_ORIGIN: string = (NODE_ENV === "production" ) ? process.env.CRM_PRODUCTION_ORIGIN as string : process.env.CRM_LOCAL_ORIGIN as string;

export const AWS_BUCKET_NAME: string = process.env.AWS_BUCKET_NAME as string;
export const AWS_ACCESS_KEY_ID: string = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_KEY: string = process.env.AWS_SECRET_KEY as string;
export const AWS_REGION: string = process.env.AWS_REGION as string;
export const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING as string;


export const EMAIL_USERNAME: string = process.env.EMAIL_USER as string;
export const EMAIL_PASSWORD: string = process.env.EMAIL_PASS as string;

export const StatusCodes = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    ALREADY_EXIST: 409,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};


export const Messages = {
    ALREADY_EXIST: "Already Exist!",
    ACCOUNT_DEACTIVATED: "Account Deactivated!",
    GOOGLE_AUTHENTICATION_FAILED: "Google Authentication Failed!",
    AUTHORIZATION_TOKEN_MISSING: "Authorization Token is Missing or Invalid!",
    AUTHENTICATION_SUCCESS: "Authentication Successfull!",
    FETCHED_SUCCESSFULLY: "Fetched Successfully.",
    CREATED_SUCCESSFULLY: "Created SuccessFully.",
    UPDATED_SUCCESSFULLY: "Updated SuccessFully.",
    REGISTERED_SUCCESSFULLY: "Registered SuccessFully.",
    REGISTRATION_FAILED: "Registration Failed!",
    CREATION_FAILED: "Creation Failed!",
    UPDATION_FAILED: "Updation Failed!",
    SOMETHING_WENT_WRONG: "Something Went Wrong!",
    ERROR_OCCURED: "Error Occured in ",
    UNEXPECTED_ERROR: "Unexpected Error Occured!",
    INVALID_OR_EXPIRED_TOKEN: "Invalid or Expired Token!",
    PAYLOAD_MISSING_OR_INVALID: "User Payload is Missing or Invalid!",
    MISSING_OR_INVALID: "is Missing or Invalid!",
    DATA_NOT_FOUND: "Not Found!",
    ALREADY_CLOSED: "Query has been already closed and cannot be updated.!",
    THIS_NOT_FOUND: "Not Found or Inactive!",
    USER_NOT_FOUND: "User Not Found or Inactive!",
    ROLE_NOT_RECOGNIZED: "Role Not Recognized!",
    REQUIRED: "Required!",
    MISSING_REQUIRED_FIELD: "Missing Required Fields"
}

interface UserPayload {
    userId: string;
    name: string;
    email: string;
    roleId: string;
    roleName: string;
}

export default UserPayload;

export interface CustomRequest extends Request {
    params: {
        userId?: string;
        queryId?: string;
        status?: string;
        email?: string;
        action?: string;
    };
    payload?: UserPayload;
    files?: any;
}

export const generateUniqueId = async (
    model: any,
    prefix: string
): Promise<string> => {
    try {
        const lastEntry = await model.findOne().sort({ _id: -1 });

        let newUniqueId: string;
        // console.log("inside generateUniqueId")
        if (lastEntry && lastEntry.id) {
            // console.log("inside generateUniqueId lastEntry")

            const lastNumericPart = parseInt(lastEntry.id.replace(prefix, ""), 10);

            const nextId = lastNumericPart + 1;

            newUniqueId = `${prefix}${String(nextId).padStart(4, "0")}`;
        } else {
            newUniqueId = `${prefix}0001`;
        }
        // console.log("new query id ",newUniqueId);

        return newUniqueId;
    } catch (error) {
        console.error(`Error generating unique ID for ${prefix}:`, error);
        throw error;
    }
};

export const EMAIL_SERVICE: string = process.env.EMAIL_SERVICE as string;
export const EMAIL_USER: string = process.env.EMAIL_USER as string;
export const EMAIL_PASS: string = process.env.EMAIL_PASS as string;
