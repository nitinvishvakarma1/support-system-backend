import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { CONNECTION_STRING } from "../config";
import roleModel from "../model/roleModel";
import userModel from "../model/userModel";
import queryModel from "../model/queryModel";
import enrollmentModel from "../model/enrollmentModel";

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

const courseCatalog = [
  {
    productId: "CRS001",
    productName: "Full Stack Web Development",
    category: "Development",
    price: 45000,
    description: "MERN stack bootcamp with live projects",
  },
  {
    productId: "CRS002",
    productName: "Data Science Fundamentals",
    category: "Data",
    price: 38000,
    description: "Python, statistics, and ML foundations",
  },
  {
    productId: "CRS003",
    productName: "Python Programming",
    category: "Development",
    price: 22000,
    description: "Core Python for automation and apps",
  },
  {
    productId: "CRS004",
    productName: "Java Spring Boot",
    category: "Development",
    price: 35000,
    description: "Enterprise Java backend development",
  },
  {
    productId: "CRS005",
    productName: "DevOps Engineering",
    category: "Cloud",
    price: 42000,
    description: "CI/CD, Docker, Kubernetes essentials",
  },
  {
    productId: "CRS006",
    productName: "AWS Cloud Practitioner",
    category: "Cloud",
    price: 28000,
    description: "Cloud fundamentals and AWS services",
  },
  {
    productId: "CRS007",
    productName: "React.js Mastery",
    category: "Development",
    price: 25000,
    description: "Advanced React patterns and state management",
  },
  {
    productId: "CRS008",
    productName: "Machine Learning Basics",
    category: "Data",
    price: 40000,
    description: "Supervised learning and model deployment",
  },
];

const users = [
  { id: "USER0001", firstName: "Nitin", lastName: "Vishvakarma", email: "nitinkvishvakarma@gmail.com", roleId: "ROLE0001", contactNumber: "9876543210" },
  { id: "USER0002", firstName: "Vish", lastName: "Nitin", email: "vishnitin51@gmail.com", roleId: "ROLE0002", contactNumber: "9876543211" },
  { id: "USER0003", firstName: "Kamlesh", lastName: "Vishwakarma", email: "vishwakarmakamlesh610@gmail.com", roleId: "ROLE0003", contactNumber: "9876543212" },
  { id: "USER0004", firstName: "Aarav", lastName: "Sharma", email: "aarav.sharma@student.test", roleId: "ROLE0002", contactNumber: "9000000004" },
  { id: "USER0005", firstName: "Isha", lastName: "Patel", email: "isha.patel@student.test", roleId: "ROLE0002", contactNumber: "9000000005" },
  { id: "USER0006", firstName: "Rohan", lastName: "Mehta", email: "rohan.mehta@student.test", roleId: "ROLE0002", contactNumber: "9000000006" },
  { id: "USER0007", firstName: "Sneha", lastName: "Gupta", email: "sneha.gupta@student.test", roleId: "ROLE0002", contactNumber: "9000000007" },
  { id: "USER0008", firstName: "Karan", lastName: "Singh", email: "karan.singh@student.test", roleId: "ROLE0002", contactNumber: "9000000008" },
  { id: "USER0009", firstName: "Priya", lastName: "Reddy", email: "priya.reddy@student.test", roleId: "ROLE0002", contactNumber: "9000000009" },
  { id: "USER0010", firstName: "Arjun", lastName: "Nair", email: "arjun.nair@student.test", roleId: "ROLE0002", contactNumber: "9000000010" },
  { id: "USER0011", firstName: "Meera", lastName: "Joshi", email: "meera.joshi@student.test", roleId: "ROLE0002", contactNumber: "9000000011" },
  { id: "USER0012", firstName: "Vikram", lastName: "Rao", email: "vikram.rao@student.test", roleId: "ROLE0002", contactNumber: "9000000012" },
  { id: "USER0013", firstName: "Ananya", lastName: "Iyer", email: "ananya.iyer@student.test", roleId: "ROLE0002", contactNumber: "9000000013" },
  { id: "USER0014", firstName: "Rahul", lastName: "Desai", email: "rahul.desai@student.test", roleId: "ROLE0002", contactNumber: "9000000014" },
];

const querySubjects = [
  "Unable to access course videos",
  "Payment receipt not received",
  "Assignment deadline extension",
  "Login issue on portal",
  "Certificate download problem",
  "Batch schedule change request",
  "Mentor session reschedule",
  "Course material missing",
  "Refund status inquiry",
  "Project review feedback",
];

const queryStatuses = ["Open", "in-progress", "closed"];

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

  await enrollmentModel.deleteMany({});
  const studentUsers = users.filter((user) => user.roleId === "ROLE0002");
  let orderCounter = 1;

  for (const student of studentUsers) {
    const primaryCourse = courseCatalog[(orderCounter - 1) % courseCatalog.length];
    const secondaryCourse = courseCatalog[(orderCounter + 2) % courseCatalog.length];
    const coursesForStudent =
      orderCounter % 3 === 0 ? [primaryCourse, secondaryCourse] : [primaryCourse];

    for (const course of coursesForStudent) {
      const amount = course.price;
      const dueAmount = orderCounter % 4 === 0 ? 0 : Math.floor(amount * 0.25);
      const orderId = `ORD${String(orderCounter).padStart(4, "0")}`;

      await enrollmentModel.create({
        orderId,
        userId: student.id,
        amount,
        dueAmount,
        dueDate: dueAmount > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        products: [course],
      });

      orderCounter += 1;
    }
  }
  console.log(`Enrollments seeded: ${orderCounter - 1}`);

  await queryModel.deleteMany({});
  const studentIds = studentUsers.map((student) => student.id);

  for (let index = 1; index <= 30; index += 1) {
    const student = studentUsers[(index - 1) % studentUsers.length];
    const subject = querySubjects[(index - 1) % querySubjects.length];
    const status = queryStatuses[(index - 1) % queryStatuses.length];
    const queryId = `QUERY${String(index).padStart(4, "0")}`;
    const message = `Support request #${index}: ${subject}. Please assist at the earliest.`;

    await queryModel.create({
      id: queryId,
      userId: student.id,
      userEmail: student.email,
      userRole: "Student",
      subject: `${subject} (#${index})`,
      message,
      status,
      attachments: [],
      conversation: [
        {
          sender: student.id,
          roleId: "ROLE0002",
          message,
          timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        },
      ],
    });
  }
  console.log("Queries seeded: 30");

  await mongoose.disconnect();
  console.log("Seed completed successfully");
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
