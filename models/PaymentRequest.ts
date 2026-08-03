import { Schema, models, model } from "mongoose";

const PaymentRequestSchema = new Schema(
  {
    alcUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    district: { type: String, index: true },

    // Which block of completed schools this tranche covers, e.g. schools 1-2,
    // or 3-4 for the next one, and so on.
    schoolsFrom: { type: Number, required: true },
    schoolsTo: { type: Number, required: true },
    amount: { type: Number, required: true }, // ₹1500 per block of 2 schools

    status: {
      type: String,
      enum: ["sent", "filled", "paid"],
      default: "sent",
      index: true,
    },

    // Bank details filled in by the ALC/Intern (not mandatory — some
    // districts never collected these at signup).
    bankAccountHolderName: String,
    bankAccountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String,
    chequeImageUrl: String,
    filledAt: Date,
  },
  { timestamps: true }
);

export default models.PaymentRequest || model("PaymentRequest", PaymentRequestSchema);
