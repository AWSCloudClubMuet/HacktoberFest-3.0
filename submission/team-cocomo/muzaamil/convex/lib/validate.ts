import { ConvexError } from "convex/values";

export function cleanText(value: string, label: string, max = 80) {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) throw new ConvexError(`${label} is required`);
  if (text.length > max) {
    throw new ConvexError(`${label} must be ${max} characters or fewer`);
  }
  return text;
}

export function wholeNumber(
  value: number,
  label: string,
  { min = 0 }: { min?: number } = {},
) {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new ConvexError(`${label} must be a whole number`);
  }
  if (value < min) {
    throw new ConvexError(
      min === 0 ? `${label} can't be negative` : `${label} must be at least ${min}`,
    );
  }
  return value;
}
