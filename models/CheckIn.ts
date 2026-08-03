import { Schema, models, model } from "mongoose";

const CheckInSchema = new Schema(
  {
    alcUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    district: { type: String, required: true, index: true },
    alcCenterCode: String,
    alcCenterName: String,
    instituteName: { type: String, index: true },
    photoUrl: String,
    gps: {
      lat: Number,
      lng: Number,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectReason: String,
  },
  { timestamps: true }
);

export default models.CheckIn || model("CheckIn", CheckInSchema);
