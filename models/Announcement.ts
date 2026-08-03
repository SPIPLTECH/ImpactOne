import { Schema, models, model } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    kind: { type: String, enum: ["notification", "news", "notice"], required: true, index: true },
    district: { type: String, index: true },
    audience: { type: String, enum: ["all", "single"], required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true },
    message: { type: String, required: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // Used only when kind === "notification" and this notification is a
    // payment-eligibility alert — lets the ALC/Intern app deep-link straight
    // to the bank-details form for this specific PaymentRequest.
    paymentRequestId: { type: Schema.Types.ObjectId, ref: "PaymentRequest", default: null },
  },
  { timestamps: true }
);

export default models.Announcement || model("Announcement", AnnouncementSchema);