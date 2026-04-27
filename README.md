# Dialysis Tracker

A full-stack application (Express + React/Vite + MongoDB) designed specifically for tracking dialysis patient sessions and automatically detecting potentially unsafe clinical anomalies.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on default port 27017 or use a `.env` in `backend/` with `MONGO_URI`)

### Backend Setup
1. `cd backend`
2. `npm install`
3. `npm run seed` (Seeds the database with three mock patients)
4. `npm run dev` (Runs on `http://localhost:5000`)

### Frontend Setup
1. Open a new terminal.
2. `cd frontend`
3. `npm install`
4. `npm run dev` (Runs on Vite default, usually `http://localhost:5173`)

---

## 📌 Clinical Assumptions & Trade-offs

I made several intentional decisions regarding what constitutes an "anomaly." To prevent scattered "magic numbers," these thresholds are localized functionally in `backend/config/thresholds.ts`.

1. **Excess Interdialytic Weight Gain (IDWG) -> >5% of Dry Weight**
   - *Assumption*: A standard clinical guideline considers weight gain between treatments dangerous if it exceeds 5% of their prescribed dry weight, risking fluid overload on the heart.
   - *Logic*: `((preWeight - dryWeight) / dryWeight) * 100 > 5`

2. **High Post-Dialysis Systolic BP -> >160 mmHg**
   - *Assumption*: Dialysis inherently removes fluid, which usually immediately *lowers* blood pressure. If a patient is leaving the clinic with a systolic BP greater than 160 mmHg, it indicates inadequate fluid removal or hypertension that must be treated.

3. **Abnormal Session Duration -> <180 mins OR >300 mins**
   - *Assumption*: A standard hemodialysis session typically lasts 4 hours (240 mins). Variations of +/- 1 hour were deemed abnormal. A session shorter than 3 hours risks inadequate toxin clearance, while longer than 5 hours indicates complications or highly resistant fluid removal.

## 🏗 Modeling & Architecture

### Entities & Contracts
The code uses strict schema adherence via **Zod** middleware in Express and **Mongoose** for MongoDB schemas:
- **Patient**: Represents static demographic/clinical state (notably `dryWeight`).
- **Session**: Represents a discrete event linked `1:Many` to a Patient. It tracks temporal start/end bounds, pre/post vitals, and arrays of dynamically calculated `anomalies`.

### Separation of Concerns
- **Frontend** is completely decoupled. UI State is handled Reactively. Data points are strictly fetched dynamically.
- **Anomaly Detection Module**: (`backend/src/utils/anomalyDetector.ts`). Anomalies are strictly evaluated at the boundary *before* insertion into the database. This allows other engineers to easily replace or augment the ruleset without digging into route-handling logic.

### Failure Modes & Resiliency
- **Input Validation**: All incoming REST traffic is parsed via Zod. Missing or out-of-bounds parameters will instantly drop the request and return a standard `HTTP 400` describing the specific field error.
- **Empty States**: The Frontend renders specific zero-content states ("No patients match the current view", "Not Started").
- **API Errors**: Surfaced to nurses via non-intrusive UI alerts, allowing them to explicitly "Try Again" without losing unsaved form states where applicable.
