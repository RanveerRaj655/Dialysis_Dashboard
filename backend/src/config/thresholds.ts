export const CLINICAL_THRESHOLDS = {
  // A weight gain is considered excessive if the preWeight is more than X% above the dryWeight.
  // Configuration: 5% is a standard clinical marker for potentially dangerous fluid overload.
  MAX_WEIGHT_GAIN_PERCENTAGE: 5,

  // A post-dialysis systolic blood pressure above this threshold is considered high.
  HIGH_POST_SYSTOLIC_BP: 160,

  // Session duration standards (minutes)
  // Standard target is often 240 mins (4 hours).
  SESSION_MIN_DURATION_MINS: 180,
  SESSION_MAX_DURATION_MINS: 300,
};
