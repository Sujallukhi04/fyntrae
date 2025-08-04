import { z } from "zod";
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
  billableRate: z.number().nonnegative().nullable(),
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
