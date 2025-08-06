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
