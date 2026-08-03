import { Schema, models, model } from "mongoose";

const QuerySchema = new Schema(
  {
    alcUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    district: { type: String, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open", index: true },
    response: String,
  },
  { timestamps: true }
);

export default models.Query || model("Query", QuerySchema);
