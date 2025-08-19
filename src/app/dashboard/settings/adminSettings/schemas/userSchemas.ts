import { z } from "zod";

// Schema for inviting new users
export const inviteUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  role: z.enum(["user", "admin", "owner"], {
    required_error: "Role is required",
  }),
  phone: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

// Schema for updating user information
export const updateUserInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  phone: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

// Schema for updating organization information
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  businessName: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

// Schema for transferring ownership
export const transferOwnershipSchema = z.object({
  targetUserId: z.string().min(1, "Target user is required"),
});

// Schema for changing user role
export const changeUserRoleSchema = z.object({
  role: z.enum(["user", "admin", "owner"]),
});

// Type exports
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
export type UpdateUserInfoFormValues = z.infer<typeof updateUserInfoSchema>;
export type UpdateOrganizationFormValues = z.infer<
  typeof updateOrganizationSchema
>;
export type TransferOwnershipFormValues = z.infer<
  typeof transferOwnershipSchema
>;
export type ChangeUserRoleFormValues = z.infer<typeof changeUserRoleSchema>;
