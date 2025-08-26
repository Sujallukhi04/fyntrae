import { z } from "zod";

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
  })
  .refine((data) => data.end <= new Date(), {
    message: "End time cannot be in the future",
    path: ["end"],
  });

export const updatesTimeEntrySchema = z
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
    projectId: z.string().cuid().nullable(),
    taskId: z.string().cuid().nullable(),
    tagIds: z.array(z.string().cuid()).optional().default([]),
  })
  .refine((data) => data.end > data.start, {
    message: "End time must be after start time",
    path: ["end"],
  })
  .refine((data) => data.start <= new Date(Date.now() + 5 * 60 * 1000), {
    message: "Start time cannot be more than 5 minutes in the future",
    path: ["start"],
  })
  .refine((data) => data.end <= new Date(), {
    message: "End time cannot be in the future",
    path: ["end"],
  });

export const startTimerSchema = z.object({
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .default(""),

  projectId: z.string().cuid("Invalid project ID format").optional().nullable(),

  taskId: z.string().cuid("Invalid task ID format").optional().nullable(),

  tagIds: z
    .array(z.string().cuid("Invalid tag ID format"))
    .optional()
    .default([]),

  billable: z.boolean().optional().default(false),
});

export const bulkUpdateTimeEntriesSchema = z.object({
  timeEntryIds: z
    .array(z.string().cuid("Invalid time entry ID format"))
    .min(1, "At least one time entry ID is required"),
  updates: z.object({
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .default(""),
    billable: z.boolean().default(false),
    projectId: z.string().cuid("Invalid project ID format").nullable(),
    taskId: z.string().cuid("Invalid task ID format").nullable(),
    tagIds: z
      .array(z.string().cuid("Invalid tag ID format"))
      .optional()
      .default([]),
  }),
});

export const bulkDeleteTimeEntriesSchema = z.object({
  timeEntryIds: z
    .array(z.string().cuid("Invalid time entry ID format"))
    .min(1, "At least one time entry ID is required"),
});

const allowedGroupFields = [
  "members",
  "projects",
  "clients",
  "tasks",
  "billable",
];

export const exportTimeSummarySchema = z
  .object({
    projects: z.string().optional().nullable(),
    tasks: z.string().optional().nullable(),
    tags: z.string().optional().nullable(),
    clients: z.string().optional().nullable(),
    billable: z
      .string()
      .optional()
      .refine((val) => val === undefined || val === "true" || val === "false", {
        message: "Billable must be 'true' or 'false'",
      })
      .transform((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      }),

    members: z.string().optional().nullable(),
    groups: z
      .string()
      .min(1, "At least one group field is required")
      .refine(
        (val) => {
          const parts = val.split(",").map((s) => s.trim());
          return parts.length > 0 && parts.length <= 2;
        },
        {
          message: "You can only group by at most two fields",
        }
      )
      .refine(
        (val) => {
          const parts = val.split(",").map((s) => s.trim());
          const uniqueParts = new Set(parts);
          return (
            parts.every(
              (field) =>
                allowedGroupFields.includes(field) && !field.includes(".")
            ) && uniqueParts.size === parts.length
          );
        },
        {
          message: "Group fields not valid",
        }
      ),

    startDate: z
      .string()
      .nonempty("Start date is required")
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "Start date must be in format yyyy-MM-dd",
      })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Start date must be a valid date",
      }),

    endDate: z
      .string()
      .nonempty("End date is required")
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "End date must be in format yyyy-MM-dd",
      })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "End date must be a valid date",
      }),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endTime"],
  })
  .refine(
    (data) => new Date(data.startDate) <= new Date(Date.now() + 5 * 60 * 1000),
    {
      message: "Start date cannot be more than 5 minutes in the future",
      path: ["startTime"],
    }
  )
  .refine(
    (data) => {
      const end = new Date(data.endDate);
      const today = new Date();

      end.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      return end <= today;
    },
    {
      message: "End date cannot be in the future",
      path: ["endDate"],
    }
  );
