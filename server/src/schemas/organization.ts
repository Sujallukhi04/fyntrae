import { z } from "zod";

export const switchOrganizationSchema = z.object({
  organizationId: z.string().cuid("Invalid organization ID format"),
});

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z
    .enum(["ADMIN", "MANAGER", "EMPLOYEE"], {
      errorMap: () => ({
        message: "Invalid role.",
      }),
    })
    .default("EMPLOYEE"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE", "OWNER"], {
    errorMap: () => ({ message: "Invalid member role" }),
  }),
  billableRate: z.number().nullable(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name cannot be empty"),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name cannot be empty"),
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
  numberFormat: z.enum(["1,000.00", "1.000,00", "1 000.00", "1,00,000.00"], {
    errorMap: () => ({ message: "Invalid number format" }),
  }),
  billableRates: z.number().optional(),
  employeesCanSeeBillableRates: z.boolean({
    required_error: "Employees can see billable rates is required",
    invalid_type_error: "Employees can see billable rates must be a boolean",
  }),
});
