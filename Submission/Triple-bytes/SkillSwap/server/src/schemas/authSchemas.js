import { z } from "zod";

const email = z
  .string("Email is required.")
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254, "Email is too long.");

const skill = z.string().trim().min(1, "Skills cannot be empty.").max(30, "Each skill can be at most 30 characters.");

export const signupSchema = z.object({
  name: z.string("Name is required.").trim().min(2, "Name must be 2-80 characters.").max(80, "Name must be 2-80 characters."),
  email,
  password: z
    .string("Password is required.")
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters."),
  major: z.string("Major is required.").trim().min(2, "Major must be 2-80 characters.").max(80, "Major must be 2-80 characters."),
  semester: z
    .number("Semester is required.")
    .int("Semester must be a whole number.")
    .min(1, "Semester must be between 1 and 12.")
    .max(12, "Semester must be between 1 and 12."),
  bio: z.string().trim().max(300, "Bio can be at most 300 characters.").nullable().optional(),
  skills: z.array(skill).max(10, "Add at most 10 skills.").optional(),
}).strict();

export const loginSchema = z.object({
  email: z.string("Email is required.").trim().toLowerCase().min(1, "Email is required."),
  password: z.string("Password is required.").min(1, "Password is required."),
}).strict();
