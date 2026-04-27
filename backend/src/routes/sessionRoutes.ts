import express from "express";
import { z } from "zod";
import Session from "../models/Session";
import Patient from "../models/Patient";
import { detectAnomalies } from "../utils/anomalyDetector";
import mongoose from "mongoose";

const router = express.Router();

const SessionInputSchema = z.object({
  patientId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid patientId"),
  startTime: z.preprocess((arg) => (typeof arg === "string" ? new Date(arg) : arg), z.date()),
  endTime: z.preprocess((arg) => (arg === "" || arg === null ? null : typeof arg === "string" ? new Date(arg) : arg), z.date().nullable().optional()),
  preWeight: z.preprocess((arg: any, ctx) => {
    const val = arg ?? ctx.data?.preweight;
    return val === "" ? undefined : Number(val);
  }, z.number().positive()),
  postWeight: z.preprocess((arg: any, ctx) => {
    const val = arg ?? ctx.data?.postweight;
    return (val === "" || val === null) ? null : Number(val);
  }, z.number().positive().nullable().optional()),
  systolicBp: z.preprocess((arg: any, ctx) => {
    const val = arg ?? ctx.data?.systolicbp;
    return (val === "" || val === null) ? null : Number(val);
  }, z.number().positive().nullable().optional()),
  diastolicBp: z.preprocess((arg: any, ctx) => {
    const val = arg ?? ctx.data?.diastolicbp;
    return (val === "" || val === null) ? null : Number(val);
  }, z.number().positive().nullable().optional()),
  machineId: z.preprocess((arg: any, ctx) => arg ?? ctx.data?.machineid, z.string().min(1, "Machine ID is required")),
  nurseNotes: z.preprocess((arg: any, ctx) => arg ?? ctx.data?.nursenotes, z.string().optional().default("")),
  status: z.preprocess((arg: any, ctx) => arg ?? ctx.data?.status, z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS"))
});

const SessionUpdateSchema = SessionInputSchema.partial();

// Record a session
router.post("/", async (req, res) => {
  try {
    const validatedData = SessionInputSchema.parse(req.body);
    
    // Check patient exists
    const patient = await Patient.findById(validatedData.patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Detect anomalies
    const anomalies = detectAnomalies(patient, validatedData);

    const newSession = new Session({
      ...validatedData,
      anomalies
    });

    await newSession.save();
    // Return populated session
    await newSession.populate("patientId");
    
    res.status(201).json(newSession);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: "Server error recording session" });
  }
});

// Update a session fundamentally
router.patch("/:id", async (req, res) => {
  console.log(`\n=== BACKEND: Received PATCH on /api/sessions/${req.params.id} ===`);
  try {
    const validatedData = SessionUpdateSchema.parse(req.body);
    
    const existingSession = await Session.findById(req.params.id);
    if (!existingSession) {
      return res.status(404).json({ error: "Session not found" });
    }

    const patient = await Patient.findById(existingSession.patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient context not found" });
    }

    const combinedSessionData = {
      preWeight: validatedData.preWeight ?? existingSession.preWeight,
      postWeight: validatedData.postWeight !== undefined ? validatedData.postWeight : existingSession.postWeight,
      systolicBp: validatedData.systolicBp !== undefined ? validatedData.systolicBp : existingSession.systolicBp,
      startTime: validatedData.startTime ?? existingSession.startTime,
      endTime: validatedData.endTime !== undefined ? validatedData.endTime : existingSession.endTime,
    };

    const newAnomalies = detectAnomalies(patient, combinedSessionData);

    Object.assign(existingSession, validatedData);
    existingSession.anomalies = newAnomalies;

    const savedSession = await existingSession.save();
    const sessionToUpdate = await savedSession.populate("patientId");

    res.status(200).json(sessionToUpdate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: "Server error updating session" });
  }
});

// Get schedule and sessions for a date
router.get("/schedule", async (req, res) => {
  try {
    const queryDateStr = req.query.date as string;
    const queryDate = queryDateStr ? new Date(queryDateStr) : new Date();
    
    const startOfRange = new Date(queryDate);
    startOfRange.setHours(0, 0, 0, 0);
    
    const endOfRange = new Date(queryDate);
    endOfRange.setHours(23, 59, 59, 999);

    // Find patients registered on this day OR who have sessions on this day
    const patientsRegisteredToday = await Patient.find({
      createdAt: { $gte: startOfRange, $lte: endOfRange }
    }).lean();

    const sessionsInRange = await Session.find({
      startTime: { $gte: startOfRange, $lte: endOfRange }
    }).sort({ startTime: 1 }).lean();

    const patientIdsWithSessions = sessionsInRange.map(s => s.patientId.toString());
    
    // Get all patients who either were registered today OR have a session today
    const patientsWithSessions = await Patient.find({
      _id: { $in: patientIdsWithSessions }
    }).lean();

    // Union of both lists, unique by ID
    const patientsMap = new Map();
    patientsRegisteredToday.forEach(p => patientsMap.set(p._id.toString(), p));
    patientsWithSessions.forEach(p => patientsMap.set(p._id.toString(), p));
    
    const patients = Array.from(patientsMap.values());

    const schedule = patients.map((patient) => {
      const patientIdStr = patient._id.toString();
      const patientSessions = sessionsInRange.filter(
        (s) => s.patientId.toString() === patientIdStr
      );

      const rawSession = patientSessions.length > 0 ? patientSessions[patientSessions.length - 1] : null;
      
      let normalizedSession = null;
      if (rawSession) {
        const rs = rawSession as any;
        normalizedSession = {
          ...rawSession,
          preWeight: rs.preWeight ?? rs.preweight,
          postWeight: rs.postWeight ?? rs.postweight,
          systolicBp: rs.systolicBp ?? rs.systolicbp,
          diastolicBp: rs.diastolicBp ?? rs.diastolicbp,
          machineId: rs.machineId ?? rs.machineid,
          nurseNotes: rs.nurseNotes ?? rs.nursenotes,
          startTime: rs.startTime || rs.starttime,
          status: rs.status || "IN_PROGRESS"
        };
      }

      return {
        patient,
        session: normalizedSession,
      };
    });

    res.status(200).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching schedule" });
  }
});

export default router;
