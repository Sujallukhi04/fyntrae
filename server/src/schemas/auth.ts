import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  weekStart: z
    .enum(
      [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      { errorMap: () => ({ message: "Invalid week start day" }) }
    )
    .optional()
    .default("monday"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: "Current password is required" }),

  newPassword: z
    .string()
    .min(8, { message: "New password must be at least 8 characters" }),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, { message: "Current password is required" }),
});

export const resetpassword = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetpasswordWithToken = z.object({
  password: z.string().min(1, { message: "new password is required" }),
});
