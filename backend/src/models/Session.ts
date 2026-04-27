import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  patientId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date | null;
  preWeight: number; // in kg
  postWeight: number | null; // in kg
  systolicBp: number | null;
  diastolicBp: number | null;
  machineId: string;
  nurseNotes: string;
  anomalies: string[]; // e.g. ["HIGH_WEIGHT_GAIN", "HIGH_POST_BP", "SHORT_DURATION"]
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

const SessionSchema: Schema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  preWeight: { type: Number, required: true },
  postWeight: { type: Number, default: null },
  systolicBp: { type: Number, default: null },
  diastolicBp: { type: Number, default: null },
  machineId: { type: String, required: true },
  nurseNotes: { type: String, default: "" },
  anomalies: { type: [String], default: [] },
  status: { type: String, enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"], default: "IN_PROGRESS" }
});

export default mongoose.model<ISession>("Session", SessionSchema);
