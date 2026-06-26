import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  contactNumber: string;
  roleId: string;
  profileImg: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createrRole: string;
  updaterRole: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<User>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
    },
    contactNumber: {
      type: String,
      default: "",
    },
    roleId: {
      type: String,
      required: true,
      ref: "roleMaster",
    },
    profileImg: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "",
      ref: "User",
    },
    updatedBy: {
      type: String,
      default: "",
      ref: "User",
    },
    createrRole: {
      type: String,
      default: "",
      ref: "roleMaster",
    },
    updaterRole: {
      type: String,
      default: "",
      ref: "roleMaster",
    },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model<User>("User", UserSchema, "users");
