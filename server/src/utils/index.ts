import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(1, "Name cannot be empty"),
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long"),
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
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long"),
});

export const switchOrganizationSchema = z.object({
  organizationId: z
    .string({ required_error: "Organization ID is required" })
    .min(1, "Organization ID cannot be empty"),
});

export const inviteUserSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),
  role: z
    .enum(["ADMIN", "MANAGER", "EMPLOYEE"], {
      errorMap: () => ({
        message: "Role must be one of: Admin, Manager, or Employee",
      }),
    })
    .default("EMPLOYEE"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE", "OWNER", "PLACEHOLDER"], {
    errorMap: () => ({ message: "Invalid member role" }),
  }),
  billableRate: z.number().nullable(),
});

export const createOrganizationSchema = z.object({
  name: z
    .string({ required_error: "Organization name is required" })
    .min(1, "Organization name cannot be empty"),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string({ required_error: "Organization name is required" })
    .min(1, "Organization name cannot be empty"),
  currency: z.enum(["INR", "USD", "EUR", "GBP"], {
    errorMap: () => ({ message: "Currency must be INR, USD, EUR, or GBP" }),
  }),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"], {
    errorMap: () => ({ message: "Invalid date format" }),
  }),
  timeFormat: z.enum(["12h", "24h"], {
    errorMap: () => ({ message: "Invalid time format" }),
  }),
  intervalFormat: z.enum(["12h", "decimal"], {
    errorMap: () => ({ message: "Invalid interval format" }),
  }),
  numberFormat: z.enum(["1,000.00", "1.000,00", "1 000.00"], {
    errorMap: () => ({ message: "Invalid number format" }),
  }),
  billableRates: z.number().optional(),
  employeesCanSeeBillableRates: z.boolean({
    required_error: "Please specify if employees can see billable rates",
  }),
});
