import express from "express";
import cors from "cors";
import { connectDB } from "./db";
import patientRoutes from "./routes/patientRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log("DEBUG: Initializing Backend...");
console.log("DEBUG: MONGO_URI present:", !!process.env.MONGO_URI);
console.log("DEBUG: FRONTEND_URL:", process.env.FRONTEND_URL);

// Robust CORS to handle trailing slashes automatically
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = frontendUrl 
  ? [frontendUrl, frontendUrl.replace(/\/$/, "")] 
  : ["*"];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      console.log("CORS Blocked for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/patients", patientRoutes);
app.use("/api/sessions", sessionRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Initialize DB connection immediately for serverless
connectDB();

// Export app for testing & Vercel
export { app };

if (process.env.NODE_ENV !== "test" && process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
