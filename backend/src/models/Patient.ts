import mongoose, { Schema, Document } from "mongoose";

export interface IPatient extends Document {
  firstName: string;
  lastName: string;
  dryWeight: number; // in kg
  createdAt: Date;
}

const PatientSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dryWeight: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPatient>("Patient", PatientSchema);
