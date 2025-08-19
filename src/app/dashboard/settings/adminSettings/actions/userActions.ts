"use server";

import { revalidatePath } from "next/cache";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { profilesTable, type Profile } from "@/db/app.schema";
import { invitation } from "@/db/auth.schema";

import { requireBetterAuthPermission } from "../actions";
import {
  changeUserRoleSchema,
  inviteUserSchema,
  updateUserInfoSchema,
  type ChangeUserRoleFormValues,
  type InviteUserFormValues,
  type UpdateUserInfoFormValues,
} from "../schemas/userSchemas";

export async function getOrganizationUsers(): Promise<Profile[]> {
  const context = await requireBetterAuthPermission("admin");

  const users = await db.query.profilesTable.findMany({
    where: and(
      eq(profilesTable.organization, context.organizationId),
      isNull(profilesTable.deletedAt),
    ),
    orderBy: [profilesTable.firstName, profilesTable.lastName],
  });

  return users;
}

export async function getUserById(userId: string): Promise<Profile | null> {
  const context = await requireBetterAuthPermission("admin");

  const user = await db.query.profilesTable.findFirst({
    where: and(
      eq(profilesTable.id, userId),
      eq(profilesTable.organization, context.organizationId),
      isNull(profilesTable.deletedAt),
    ),
  });

  return user || null;
}

export async function inviteUser(
  data: InviteUserFormValues,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("admin");

    // Validate input
    const result = inviteUserSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    // Check if user is already invited or is a member
    const existingUser = await db.query.profilesTable.findFirst({
      where: and(
        eq(profilesTable.username, result.data.email),
        eq(profilesTable.organization, context.organizationId),
        isNull(profilesTable.deletedAt),
      ),
    });

    if (existingUser) {
      return {
        success: false,
        error: "User is already a member of this organization",
      };
    }

    const existingInvitation = await db.query.invitation.findFirst({
      where: and(
        eq(invitation.email, result.data.email),
        eq(invitation.organizationId, context.organizationId),
        eq(invitation.status, "pending"),
      ),
    });

    if (existingInvitation) {
      return {
        success: false,
        error: "User has already been invited",
      };
    }

    // Create invitation record
    const invitationId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    await db.insert(invitation).values({
      id: invitationId,
      organizationId: context.organizationId,
      email: result.data.email,
      role: result.data.role,
      status: "pending",
      expiresAt,
      inviterId: context.userId,
    });

    // TODO: Send actual invitation email
    console.log("Invitation created:", {
      email: result.data.email,
      role: result.data.role,
      invitationId,
      expiresAt,
      profileData: {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
      },
    });

    revalidatePath("/dashboard/settings/adminSettings/manageUsers");

    return { success: true };
  } catch (error) {
    console.error("Error inviting user:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send invitation",
    };
  }
}

export async function updateUserInfo(
  userId: string,
  data: UpdateUserInfoFormValues,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("admin");

    // Validate input
    const result = updateUserInfoSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    await db
      .update(profilesTable)
      .set({
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        username: result.data.username,
        phone: result.data.phone,
        streetAddress: result.data.streetAddress,
        city: result.data.city,
        state: result.data.state,
        zipCode: result.data.zipCode,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(profilesTable.id, userId),
          eq(profilesTable.organization, context.organizationId),
          isNull(profilesTable.deletedAt),
        ),
      );

    revalidatePath(`/dashboard/settings/adminSettings/manageUsers/${userId}`);
    revalidatePath("/dashboard/settings/adminSettings/manageUsers");

    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

export async function changeUserRole(
  userId: string,
  data: ChangeUserRoleFormValues,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("admin");

    // Validate input
    const result = changeUserRoleSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: "Invalid role",
      };
    }

    await db
      .update(profilesTable)
      .set({
        role: result.data.role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(profilesTable.id, userId),
          eq(profilesTable.organization, context.organizationId),
          isNull(profilesTable.deletedAt),
        ),
      );

    revalidatePath(`/dashboard/settings/adminSettings/manageUsers/${userId}`);
    revalidatePath("/dashboard/settings/adminSettings/manageUsers");

    return { success: true };
  } catch (error) {
    console.error("Error changing user role:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to change user role",
    };
  }
}

export async function deleteUser(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("admin");

    await db
      .update(profilesTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(profilesTable.id, userId),
          eq(profilesTable.organization, context.organizationId),
          isNull(profilesTable.deletedAt),
        ),
      );

    revalidatePath("/dashboard/settings/adminSettings/manageUsers");

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}
