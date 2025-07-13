import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  weekStart: z
    .enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
    .optional()
    .default("monday"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const switchOrganizationSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).default("EMPLOYEE"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE", "OWNER", "PLACEHOLDER"]),
  billableRate: z.number().optional(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]),
  timeFormat: z.enum(["12h", "24h"]),
  intervalFormat: z.enum(["12h", "decimal"]),
  numberFormat: z.enum(["1,000.00", "1.000,00", "1000.00", "1000,00"]),
  billableRates: z.number().optional(),
  employeesCanSeeBillableRates: z.boolean(),
});

export   const createProjectSchema = z
  .object({
    name: z.string().min(1),
    color: z.string().min(1),
    billable: z.boolean(),
    billableRate: z.number().optional(),
    estimatedTime: z.number().optional(),
    clientId: z.string().optional(),
  })
  .refine(
    (data) => {
      // billableRate is required if billable is true
      if (
        data.billable &&
        (data.billableRate === undefined || data.billableRate === null)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "billableRate is required when billable is true",
      path: ["billableRate"],
    }
  );
