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
    // NEW: who actually created this record. "alc" = normal self check-in from
    // the mobile app. "dcu" = the DCU entered this on the ALC's behalf because
    // the ALC forgot to submit it (see /dcu/add-missing-data). alcUser above is
    // always still the ALC/Intern this check-in belongs to either way.
    submittedVia: {
      type: String,
      enum: ["alc", "dcu"],
      default: "alc",
      index: true,
    },
    addedByDcuUser: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default models.CheckIn || model("CheckIn", CheckInSchema);