"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { profilesTable, type Profile } from "@/db/app.schema";
import { invitation, member, organization } from "@/db/auth.schema";
import { auth } from "@/lib/auth";
import { isLastOwner, type Role } from "@/lib/authz";

import {
  addUserFormSchema,
  updateOrganizationFormSchema,
  updateUserFormSchema,
} from "./schema";

// Better Auth authorization helper
export async function requireBetterAuthPermission(
  minRole: "admin" | "owner" = "admin",
) {
  const activeMember = await auth.api.getActiveMember({
    headers: await headers(),
  });

  if (!activeMember?.role) {
    throw new Error("Unauthorized: No organization membership found");
  }

  const memberRole = Array.isArray(activeMember.role)
    ? activeMember.role[0]
    : activeMember.role;

  const userRole = memberRole as Role;

  // Check if user has required permissions
  const hasPermission =
    userRole === "owner" || (minRole === "admin" && userRole === "admin");

  if (!hasPermission) {
    throw new Error(`Unauthorized: ${minRole} role required`);
  }

  return {
    userId: activeMember.userId,
    userRole,
    organizationId: activeMember.organizationId,
  };
}

// User Management Actions

export async function getOrganizationUsers(): Promise<Profile[]> {
  const context = await requireBetterAuthPermission("admin");

  // Get users from database
  const users = await db.query.profilesTable.findMany({
    where: and(
      eq(profilesTable.organization, context.organizationId),
      isNull(profilesTable.deletedAt),
    ),
  });

  // Get Better Auth organization members from database to get the correct roles
  const members = await db.query.member.findMany({
    where: eq(member.organizationId, context.organizationId),
  });

  // Merge Better Auth member roles with database user data
  const usersWithBetterAuthRoles = users.map((user) => {
    const memberRecord = members.find((m) => m.userId === user.id);
    const memberRole = memberRecord?.role;

    // Use Better Auth member role if available, fallback to database role
    const correctRole = memberRole
      ? Array.isArray(memberRole)
        ? memberRole[0]
        : memberRole
      : user.role;

    return {
      ...user,
      role: correctRole as Role,
    };
  });

  return usersWithBetterAuthRoles;
}

export async function getUserById(userId: string): Promise<Profile | null> {
  const context = await requireBetterAuthPermission("admin");

  // Get user from database
  const user = await db.query.profilesTable.findFirst({
    where: and(
      eq(profilesTable.id, userId),
      eq(profilesTable.organization, context.organizationId),
      isNull(profilesTable.deletedAt),
    ),
  });

  if (!user) {
    return null;
  }

  // Get Better Auth organization member role for this specific user
  const memberRecord = await db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, context.organizationId),
    ),
  });

  // Use Better Auth member role if available, fallback to database role
  const correctRole = memberRecord?.role
    ? Array.isArray(memberRecord.role)
      ? memberRecord.role[0]
      : memberRecord.role
    : user.role;

  return {
    ...user,
    role: correctRole as Role,
  };
}

export async function updateUser(
  userId: string,
  data: z.infer<typeof updateUserFormSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check Better Auth permissions for user updates
    await requireBetterAuthPermission("admin");

    // Verify user exists
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Update user
    await db
      .update(profilesTable)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        phone: data.phone,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      })
      .where(eq(profilesTable.id, userId));

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
  newRole: Role,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("admin");

    // Get current user data
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Prevent demoting the last owner
    if (currentUser.role === "owner" && newRole !== "owner") {
      const isLast = await isLastOwner(userId, context.organizationId);
      if (isLast) {
        return {
          success: false,
          error: "Cannot demote the last owner. Transfer ownership first.",
        };
      }
    }

    // Update role
    await db
      .update(profilesTable)
      .set({ role: newRole })
      .where(eq(profilesTable.id, userId));

    revalidatePath(`/dashboard/settings/adminSettings/manageUsers/${userId}`);
    revalidatePath("/dashboard/settings/adminSettings/manageUsers");

    return { success: true };
  } catch (error) {
    console.error("Error changing user role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change role",
    };
  }
}

export async function deleteUser(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("admin");

    // Prevent self-deletion
    if (userId === context.userId) {
      return { success: false, error: "Cannot delete your own account" };
    }

    // Verify user exists
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Prevent deleting the last owner
    if (currentUser.role === "owner") {
      const isLast = await isLastOwner(userId, context.organizationId);
      if (isLast) {
        return {
          success: false,
          error: "Cannot delete the last owner. Transfer ownership first.",
        };
      }
    }

    // Soft delete user
    await db
      .update(profilesTable)
      .set({ deletedAt: new Date() })
      .where(eq(profilesTable.id, userId));

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

export async function addUser(
  data: z.infer<typeof addUserFormSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("admin");

    // Check if user is already invited or is a member
    const existingUser = await db.query.profilesTable.findFirst({
      where: and(
        eq(profilesTable.username, data.email),
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
        eq(invitation.email, data.email),
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
      email: data.email,
      role: data.role,
      status: "pending",
      expiresAt,
      inviterId: context.userId,
    });

    // TODO: Send actual invitation email
    console.log("Invitation created:", {
      email: data.email,
      role: data.role,
      invitationId,
      expiresAt,
    });

    revalidatePath("/dashboard/settings/adminSettings/manageUsers");

    return { success: true };
  } catch (error) {
    console.error("Error adding user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add user",
    };
  }
}

// Organization Management Actions

export async function getOrganization() {
  const context = await requireBetterAuthPermission("admin");

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, context.organizationId),
  });

  return org;
}

export async function updateOrganization(
  data: z.infer<typeof updateOrganizationFormSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("admin");

    // Verify organization exists
    const currentOrg = await getOrganization();
    if (!currentOrg) {
      return { success: false, error: "Organization not found" };
    }

    // Update organization
    await db
      .update(organization)
      .set({
        name: data.name,
        businessName: data.businessName,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        website: data.website,
      })
      .where(eq(organization.id, context.organizationId));

    revalidatePath("/dashboard/settings/adminSettings/organization");

    return { success: true };
  } catch (error) {
    console.error("Error updating organization:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update organization",
    };
  }
}

export async function transferOwnership(
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("owner");

    // Get target user
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return { success: false, error: "Target user not found" };
    }

    // Update both users' roles
    await db.transaction(async (tx) => {
      // Demote current owner to admin
      await tx
        .update(profilesTable)
        .set({ role: "admin" })
        .where(eq(profilesTable.id, context.userId));

      // Promote target user to owner
      await tx
        .update(profilesTable)
        .set({ role: "owner" })
        .where(eq(profilesTable.id, targetUserId));
    });

    revalidatePath("/dashboard/settings/adminSettings/manageUsers");
    revalidatePath("/dashboard/settings/adminSettings/organization");

    return { success: true };
  } catch (error) {
    console.error("Error transferring ownership:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to transfer ownership",
    };
  }
}
