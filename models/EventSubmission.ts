import { Schema, models, model } from "mongoose";

const VideoSchema = new Schema(
  {
    url: { type: String, required: true },
    gps: {
      lat: Number,
      lng: Number,
      accuracy: Number,
    },
    capturedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Event video submissions: Student Session, Parent Meeting, Teacher Orientation
const EventSubmissionSchema = new Schema(
  {
    alcUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    district: { type: String, required: true, index: true },
    alcCenterCode: String,
    alcCenterName: String,
    eventType: {
      type: String,
      enum: ["student-session", "parent-meeting", "teacher-orientation"],
      required: true,
      index: true,
    },
    classOfStudents: String, // e.g. "8th Class" / "9th Class" / "10th Class" / "Combine" — only for student-session
    instituteName: { type: String, required: true, index: true },
    presentCount: { type: Number, required: true },
    video: { type: VideoSchema, required: true },
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

export default models.EventSubmission ||
  model("EventSubmission", EventSubmissionSchema);