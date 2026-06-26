import mongoose, { Schema, Document } from "mongoose";

export interface ProductItem {
  productId: string;
  productName: string;
  category: string;
  price: number;
  description: string;
}

export interface Enrollment extends Document {
  orderId: string;
  userId: string;
  amount: number;
  dueAmount: number;
  dueDate: Date | null;
  products: ProductItem[];
}

const ProductSchema = new Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const EnrollmentSchema = new Schema<Enrollment>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: "User" },
    amount: { type: Number, required: true },
    dueAmount: { type: Number, required: true },
    dueDate: { type: Date, default: null },
    products: { type: [ProductSchema], required: true },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model<Enrollment>(
  "Enrollment",
  EnrollmentSchema,
  "enrollments"
);
