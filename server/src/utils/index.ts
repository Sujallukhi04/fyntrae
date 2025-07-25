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
  numberFormat: z.enum(["1,000.00", "1.000,00", "1 000. 00"], {
    errorMap: () => ({ message: "Invalid number format" }),
  }),
  billableRates: z.number().optional(),
  employeesCanSeeBillableRates: z.boolean({
    required_error: "Please specify if employees can see billable rates",
  }),
});

export const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: "Project name is required" })
      .min(1, "Project name cannot be empty"),
    color: z
      .string({ required_error: "Project color is required" })
      .min(1, "Project color cannot be empty"),
    billable: z.boolean({
      required_error: "Please specify if the project is billable",
    }),
    billableRate: z
      .number({ invalid_type_error: "Billable rate must be a number" })
      .nullable(),
    estimatedTime: z
      .number({ invalid_type_error: "Estimated time must be a number" })
      .optional(),
    clientId: z
      .string({ invalid_type_error: "Client ID must be a string" })
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      !data.billable ||
      data.billableRate === null ||
      (typeof data.billableRate === "number" && data.billableRate >= 0),
    {
      message:
        "When billable, the rate must be null or a number greater than or equal to 0.",
      path: ["billableRate"],
    }
  );

export const addProjectMemberSchema = z.object({
  memberId: z
    .string({ required_error: "Member ID is required" })
    .min(1, "Member ID cannot be empty"),
  billableRate: z.number().nullable().optional(),
});

export const createProjectTaskSchema = z.object({
  name: z
    .string({ required_error: "Task name is required" })
    .min(1, "Task name cannot be empty"),
  estimatedTime: z
    .number()
    .optional()
    .refine((val) => val === undefined || val >= 0, {
      message: "Estimated time must be a non-negative number",
    }),
});

export const updateProjectMemberSchema = z.object({
  billableRate: z.number().nullable().optional(),
});

export const updateTaskSchema = z.object({
  name: z
    .string({ required_error: "Task name is required" })
    .min(1, "Task name cannot be empty"),
  estimatedTime: z.number().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DONE"], {
    errorMap: () => ({ message: "Status must be either Active or Done" }),
  }),
});

export const createTimeEntrySchema = z
  .object({
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .default(""),
    start: z
      .string({ required_error: "Start time is required" })
      .nonempty("Start time cannot be empty")
      .refine(
        (val) => val.endsWith("Z"),
        "Start time must be in UTC (ends with 'Z')"
      )
      .refine(
        (val) => !isNaN(Date.parse(val)),
        "Start time must be a valid ISO date"
      )
      .transform((val) => new Date(val)),

    end: z
      .string({ required_error: "End time is required" })
      .nonempty("End time cannot be empty")
      .refine(
        (val) => val.endsWith("Z"),
        "End time must be in UTC (ends with 'Z')"
      )
      .refine(
        (val) => !isNaN(Date.parse(val)),
        "End time must be a valid ISO date"
      )
      .transform((val) => new Date(val)),

    billable: z.boolean().default(false),
    projectId: z.string().cuid().nullable().optional(),
    taskId: z.string().cuid().nullable().optional(),
    tagIds: z.array(z.string().cuid()).optional().default([]),
  })
  .refine((data) => data.end > data.start, {
    message: "End time must be after start time",
    path: ["end"],
  })
  .refine((data) => data.start <= new Date(Date.now() + 5 * 60 * 1000), {
    message: "Start time cannot be more than 5 minutes in the future",
    path: ["start"],
  });

export const updateTimeEntrySchema = z.object({
  startTime: z
    .date()
    .optional()
    .refine((date) => date === undefined || date <= new Date(), {
      message: "Start time cannot be in the future",
    }),
  endTime: z
    .date()
    .optional()
    .refine((date) => date === undefined || date > new Date(), {
      message: "End time must be after start time",
    }),
  description: z.string().optional(),
});

export const startTimerSchema = z.object({
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .default(""),

  projectId: z.string().cuid().optional().nullable(),

  taskId: z.string().cuid().optional().nullable(),

  tagIds: z.array(z.string().cuid()).optional().default([]),

  billable: z.boolean().optional().default(false),
});

export const bulkUpdateTimeEntriesSchema = z.object({
  timeEntryIds: z
    .array(z.string().cuid())
    .min(1, "At least one time entry ID is required"),
  updates: z.object({
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .default(""),
    billable: z.boolean().default(false),
    projectId: z.string().cuid().optional().nullable(),
    taskId: z.string().cuid().nullable().optional(),
    tagIds: z.array(z.string().cuid()).optional().default([]),
  }),
});

export const bulkDeleteTimeEntriesSchema = z.object({
  timeEntryIds: z
    .array(z.string().cuid())
    .min(1, "At least one time entry ID is required"),
});

export const getTimeEntriesSchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
  projectId: z.string().cuid().optional(),
  taskId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  billable: z.enum(["true", "false"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["start", "end", "description", "createdAt"])
    .optional()
    .default("start"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
