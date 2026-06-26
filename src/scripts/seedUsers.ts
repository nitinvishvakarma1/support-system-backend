import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { CONNECTION_STRING } from "../config";
import roleModel from "../model/roleModel";
import userModel from "../model/userModel";

const roles = [
  {
    id: "ROLE0001",
    name: "Admin",
    access: ["all"],
    isActive: true,
    createdBy: "SYSTEM",
    updatedBy: "SYSTEM",
    createrRole: "SYSTEM",
    updaterRole: "SYSTEM",
  },
  {
    id: "ROLE0002",
    name: "Student",
    access: ["queries", "profile", "courses"],
    isActive: true,
    createdBy: "SYSTEM",
    updatedBy: "SYSTEM",
    createrRole: "SYSTEM",
    updaterRole: "SYSTEM",
  },
  {
    id: "ROLE0003",
    name: "Counsellor",
    access: ["queries", "profile", "manage"],
    isActive: true,
    createdBy: "SYSTEM",
    updatedBy: "SYSTEM",
    createrRole: "SYSTEM",
    updaterRole: "SYSTEM",
  },
];

const users = [
  {
    id: "USER0001",
    firstName: "Nitin",
    lastName: "Vishvakarma",
    email: "nitinkvishvakarma@gmail.com",
    roleId: "ROLE0001",
  },
  {
    id: "USER0002",
    firstName: "Vish",
    lastName: "Nitin",
    email: "vishnitin51@gmail.com",
    roleId: "ROLE0002",
  },
  {
    id: "USER0003",
    firstName: "Kamlesh",
    lastName: "Vishwakarma",
    email: "vishwakarmakamlesh610@gmail.com",
    roleId: "ROLE0003",
  },
];

const seed = async () => {
  await mongoose.connect(CONNECTION_STRING);
  console.log("Connected to database");

  for (const role of roles) {
    await roleModel.findOneAndUpdate({ id: role.id }, role, { upsert: true, new: true });
    console.log(`Role seeded: ${role.name}`);
  }

  for (const user of users) {
    await userModel.findOneAndUpdate(
      { email: user.email },
      {
        ...user,
        contactNumber: "",
        profileImg: "",
        isActive: true,
        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
        createrRole: "ROLE0001",
        updaterRole: "ROLE0001",
      },
      { upsert: true, new: true }
    );
    console.log(`User seeded: ${user.email}`);
  }

  await mongoose.disconnect();
  console.log("Seed completed successfully");
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
