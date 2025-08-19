import { z } from "zod";

// Schema for inviting users (no password required)
export const addUserFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email address")
    .min(5, "Email must be at least 5 characters long")
    .max(254, "Email must be at most 254 characters long"),
  role: z.enum(["admin", "user", "owner"]),
  phone: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const updateUserFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  phone: z.string(),
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
});

export const updateOrganizationFormSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  businessName: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

export type addUserFormSchema = z.infer<typeof addUserFormSchema>;
export type updateUserFormSchema = z.infer<typeof updateUserFormSchema>;
export type updateOrganizationFormSchema = z.infer<
  typeof updateOrganizationFormSchema
>;
