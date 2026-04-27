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
  preWeight: z.preprocess((arg) => (arg === "" ? undefined : Number(arg)), z.number().positive()),
  postWeight: z.preprocess((arg) => (arg === "" || arg === null ? null : Number(arg)), z.number().positive().nullable().optional()),
  systolicBp: z.preprocess((arg) => (arg === "" || arg === null ? null : Number(arg)), z.number().positive().nullable().optional()),
  diastolicBp: z.preprocess((arg) => (arg === "" || arg === null ? null : Number(arg)), z.number().positive().nullable().optional()),
  machineId: z.string().min(1, "Machine ID is required"),
  nurseNotes: z.string().optional().default(""),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS")
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
  console.log("BACKEND: Request Payload:", JSON.stringify(req.body, null, 2));
  try {
    console.log("BACKEND: Raw body:", req.body);
    const validatedData = SessionUpdateSchema.parse(req.body);
    console.log("BACKEND: Validated (Zod) data:", validatedData);
    
    // 1. Get existing session
    const existingSession = await Session.findById(req.params.id);
    if (!existingSession) {
      return res.status(404).json({ error: "Session not found" });
    }

    // 2. Fetch the patient instance correctly to run the rules engine
    const patient = await Patient.findById(existingSession.patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient context not found" });
    }

    // 3. Re-run Anomaly detection combining existing logic overrides
    const combinedSessionData = {
      preWeight: validatedData.preWeight ?? existingSession.preWeight,
      postWeight: validatedData.postWeight !== undefined ? validatedData.postWeight : existingSession.postWeight,
      systolicBp: validatedData.systolicBp !== undefined ? validatedData.systolicBp : existingSession.systolicBp,
      startTime: validatedData.startTime ?? existingSession.startTime,
      endTime: validatedData.endTime !== undefined ? validatedData.endTime : existingSession.endTime,
    };

    console.log("BACKEND: Combined for anomalies:", combinedSessionData);
    const newAnomalies = detectAnomalies(patient, combinedSessionData);
    console.log("BACKEND: Calculated anomalies:", newAnomalies);

    // Update fields manually for .save()
    Object.assign(existingSession, validatedData);
    existingSession.anomalies = newAnomalies;

    const savedSession = await existingSession.save();
    const sessionToUpdate = await savedSession.populate("patientId");

    console.log("BACKEND: Successfully saved to MongoDB:", sessionToUpdate);
    res.status(200).json(sessionToUpdate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: "Server error updating session" });
  }
});

    // Support historical records via ?date=YYYY-MM-DD
    const queryDate = req.query.date ? new Date(req.query.date as string) : new Date();
    
    // Set up the time window for the requested date
    const startOfRange = new Date(queryDate);
    startOfRange.setHours(0, 0, 0, 0);
    
    const endOfRange = new Date(queryDate);
    endOfRange.setHours(23, 59, 59, 999);

    const patients = await Patient.find().lean();
    
    const sessionsToday = await Session.find({
      startTime: { $gte: startOfRange, $lte: endOfRange }
    }).sort({ startTime: 1 }).lean();

    // Map sessions to patients with extremely robust ID and Case matching
    const schedule = patients.map((patient) => {
      const patientIdStr = patient._id.toString();
      
      // Find sessions that match this patient, ignoring potential ID casing or type issues
      const patientSessions = sessionsToday.filter(
        (s) => {
          const sPid = s.patientId || (s as any).patientid;
          return sPid && sPid.toString() === patientIdStr;
        }
      );

      const rawSession = patientSessions.length > 0 ? patientSessions[patientSessions.length - 1] : null;
      
      // Force normalize the session object before sending to UI to fix any lowercase field issues
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
