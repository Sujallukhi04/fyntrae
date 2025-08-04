import { z } from "zod";

const allowedGroupFields = [
  "members",
  "projects",
  "clients",
  "tasks",
  "billable",
];

export const createReportSchema = z
  .object({
    name: z.string().min(1, "Report name cannot be empty"),

    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .default(""),
    isPublic: z.boolean().default(false),
    projects: z.string().optional().nullable(),
    tasks: z.string().optional().nullable(),
    tags: z.string().optional().nullable(),
    clients: z.string().optional().nullable(),
    billable: z
      .string()
      .optional()
      .refine((val) => val === "true" || val === "false", {
        message: "Billable must be 'true' or 'false'",
      })
      .transform((val) => val === "true"),
    publicUntil: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: "Public until must be in format yyyy-MM-dd",
      })
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Public until must be a valid date",
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
  .refine((data) => new Date(data.endDate) <= new Date(), {
    message: "End date cannot be in the future",
    path: ["endTime"],
  });
