import mongoose, { Schema, models, model } from "mongoose";

// Unified user model for ALC, Mentor, DCU, MRCU, SuperAdmin
const UserSchema = new Schema(
  {
    fullName: String,
    email: { type: String, index: true },
    phone: String,
    username: { type: String, unique: true, sparse: true, index: true },
    password: { type: String, required: true }, // hashed
    role: {
      type: String,
      enum: ["ALC", "Intern", "Mentor", "DCU", "MRCU", "SuperAdmin"],
      required: true,
    },
    district: { type: String, index: true }, // required for ALC, Mentor, DCU
    alcCenterCode: String,
    alcCenterName: String,
    bankAccountHolderName: String,
    bankAccountNumber: String,
    bankName: String,
    ifscCode: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectReason: String,
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);