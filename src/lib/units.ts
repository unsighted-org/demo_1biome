// Unit conversion functions
export const inchesToCm = (inches: number): number => {
  return Math.round(inches * 2.54);
};

export const cmToInches = (cm: number): number => {
  return Math.round(cm / 2.54 * 10) / 10;
};

export const lbsToKg = (lbs: number): number => {
  return Math.round(lbs * 0.45359237);
};

export const kgToLbs = (kg: number): number => {
  return Math.round(kg / 0.45359237 * 10) / 10;
};
