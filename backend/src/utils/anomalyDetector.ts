import { ISession } from "../models/Session";
import { CLINICAL_THRESHOLDS } from "../config/thresholds";
import { IPatient } from "../models/Patient";

export const detectAnomalies = (
  patient: IPatient,
  sessionInput: { preWeight: number; postWeight?: number | null; systolicBp?: number | null; startTime: Date; endTime?: Date | null }
): string[] => {
  const anomalies: string[] = [];

  // 1. Check excessive weight gain
  // Formula: ((preWeight - dryWeight) / dryWeight) * 100 > THRESHOLD
  if (patient.dryWeight > 0) {
    const weightGain = sessionInput.preWeight - patient.dryWeight;
    const percentageOver = (weightGain / patient.dryWeight) * 100;
    if (percentageOver > CLINICAL_THRESHOLDS.MAX_WEIGHT_GAIN_PERCENTAGE) {
      anomalies.push("HIGH_WEIGHT_GAIN");
    }
  }

  // 2. High Post-Dialysis Systolic BP
  if (sessionInput.systolicBp && sessionInput.systolicBp > CLINICAL_THRESHOLDS.HIGH_POST_SYSTOLIC_BP) {
    anomalies.push("HIGH_POST_SYSTOLIC_BP");
  }

  // 3. Abnormal Session Duration
  if (sessionInput.endTime) {
    const diffMs = sessionInput.endTime.getTime() - sessionInput.startTime.getTime();
    const durationMins = diffMs / (1000 * 60);

    if (durationMins < CLINICAL_THRESHOLDS.SESSION_MIN_DURATION_MINS) {
      anomalies.push("SHORT_DURATION");
    } else if (durationMins > CLINICAL_THRESHOLDS.SESSION_MAX_DURATION_MINS) {
      anomalies.push("LONG_DURATION");
    }
  }

  return anomalies;
};
