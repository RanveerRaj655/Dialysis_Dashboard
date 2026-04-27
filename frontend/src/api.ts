import axios from "axios";

// Default to backend on port 5000 in dev
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
});

export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dryWeight: number;
}

export interface Session {
  _id: string;
  patientId: string;
  startTime: string;
  endTime: string | null;
  preWeight: number;
  postWeight: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  machineId: string;
  nurseNotes: string;
  anomalies: string[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface ScheduleItem {
  patient: Patient;
  session: Session | null;
}

export const fetchSchedule = async (date?: string): Promise<ScheduleItem[]> => {
  const { data } = await api.get("/sessions/schedule", {
    params: { date }
  });
  return data;
};

export const createSession = async (sessionData: Partial<Session>) => {
  console.log("API CALL: creating session with data:", sessionData);
  const { data } = await api.post("/sessions", sessionData);
  return data;
};

export const updateSession = async (id: string, sessionData: Partial<Session>) => {
  console.log(`API CALL → PATCH /sessions/${id}`, sessionData);
  const { data } = await api.patch(`/sessions/${id}`, sessionData);
  console.log(`API CALL ← Response:`, data);
  return data;
};

export const registerPatient = async (patientData: Partial<Patient>) => {
  const { data } = await api.post("/patients", patientData);
  return data;
};

export const deletePatient = async (id: string) => {
  const { data } = await api.delete(`/patients/${id}`);
  return data;
};
