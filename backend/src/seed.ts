import mongoose from "mongoose";
import dotenv from "dotenv";
import Patient from "./models/Patient";
import Session from "./models/Session";
import { connectDB } from "./db";

dotenv.config();

const seedDB = async () => {
  await connectDB();

  console.log("Clearing existing data...");
  await Patient.deleteMany({});
  await Session.deleteMany({});

  console.log("Adding mock patients...");
  const patients = await Patient.insertMany([
    { firstName: "John", lastName: "Doe", dryWeight: 70 },
    { firstName: "Jane", lastName: "Smith", dryWeight: 65 },
    { firstName: "Alice", lastName: "Johnson", dryWeight: 80 }
  ]);

  console.log("Successfully seeded", patients.length, "patients.");
  process.exit();
};

seedDB().catch((err) => {
  console.error("Error seeding db", err);
  process.exit(1);
});
