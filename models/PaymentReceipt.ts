import { Schema, models, model } from "mongoose";

const PaymentReceiptSchema = new Schema(
  {
    dcuUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    alcUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    district: { type: String, required: true, index: true },
    receiptImageUrl: { type: String, required: true },
    note: String,
  },
  { timestamps: true }
);

export default models.PaymentReceipt || model("PaymentReceipt", PaymentReceiptSchema);