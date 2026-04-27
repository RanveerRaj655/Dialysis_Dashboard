import express from "express";
import { z } from "zod";
import mongoose from "mongoose";
import Patient from "../models/Patient";

const router = express.Router();

const PatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dryWeight: z.number().positive("Dry weight must be a positive number"),
});

// Register a new patient
router.post("/", async (req, res) => {
  try {
    const validatedData = PatientSchema.parse(req.body);
    const newPatient = new Patient(validatedData);
    await newPatient.save();
    res.status(201).json(newPatient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    res.status(500).json({ error: "Server error registering patient" });
  }
});

// Get all patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ lastName: 1 });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: "Server error fetching patients" });
  }
});

// Delete a patient
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`BACKEND: Attempting to delete patient with ID: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`BACKEND: Invalid ObjectId format: ${id}`);
      return res.status(400).json({ error: "Invalid patient ID format" });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      console.log(`BACKEND: Patient not found in DB: ${id}`);
      return res.status(404).json({ error: "Patient not found" });
    }
    
    await Patient.findByIdAndDelete(id);
    console.log(`BACKEND: Successfully deleted patient: ${id}`);
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("BACKEND: Delete error:", error);
    res.status(500).json({ error: "Server error deleting patient" });
  }
});

export default router;
