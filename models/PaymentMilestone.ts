import { Schema, models, model } from "mongoose";

const PaymentMilestoneSchema = new Schema(
  {
    alcUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    // Cumulative number of completed schools that have already been
    // "cashed in" to a payment tranche via /api/dcu/payments/notify.
    schoolsAlreadyPaidFor: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.PaymentMilestone || model("PaymentMilestone", PaymentMilestoneSchema);
