import { headers } from "next/headers";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profilesTable } from "@/db/app.schema";
import { auth } from "@/lib/auth";

export type Role = "user" | "admin" | "owner";

export type Action =
  | "USER_READ"
  | "USER_UPDATE"
  | "USER_ROLE_CHANGE"
  | "USER_DELETE"
  | "USER_INVITE"
  | "ORG_READ"
  | "ORG_UPDATE"
  | "OWNER_TRANSFER"
  | "ADMIN_SETTINGS_ACCESS";

interface AuthContext {
  userId: string;
  role: Role;
  organizationId: string;
  targetUserId?: string;
  targetUserRole?: Role;
}

/**
 * Check if a user can perform a specific action
 */
export function can(context: AuthContext, action: Action): boolean {
  const { role, userId, targetUserId, targetUserRole } = context;

  // Owners can do everything
  if (role === "owner") {
    // Except they can't demote themselves if they're the last owner
    if (action === "USER_ROLE_CHANGE" && targetUserId === userId) {
      // We'll need to check if they're the last owner in the actual function
      return true;
    }
    return true;
  }

  // Admins have limited permissions
  if (role === "admin") {
    switch (action) {
      case "USER_READ":
      case "USER_UPDATE":
      case "USER_INVITE":
      case "ORG_READ":
      case "ORG_UPDATE":
      case "ADMIN_SETTINGS_ACCESS":
        return true;

      case "USER_ROLE_CHANGE":
        // Admins can't promote to owner or edit owners
        return targetUserRole !== "owner" && targetUserRole !== "admin";

      case "USER_DELETE":
        // Admins can't delete owners or other admins
        return targetUserRole === "user";

      case "OWNER_TRANSFER":
        // Only owners can transfer ownership
        return false;

      default:
        return false;
    }
  }

  // Regular users have no admin permissions
  return false;
}

/**
 * Get session with user profile and organization context
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return null;
    }

    const profile = await db.query.profilesTable.findFirst({
      where: eq(profilesTable.id, session.user.id),
    });

    if (!profile?.organization) {
      return null;
    }

    return {
      userId: session.user.id,
      role: profile.role as Role,
      organizationId: profile.organization,
    };
  } catch (error) {
    console.error("Error getting auth context:", error);
    return null;
  }
}

/**
 * Get auth context with target user information
 */
export async function getAuthContextWithTarget(
  targetUserId: string,
): Promise<AuthContext | null> {
  const context = await getAuthContext();
  if (!context) return null;

  // Get target user's role
  const targetUser = await db.query.profilesTable.findFirst({
    where: eq(profilesTable.id, targetUserId),
  });

  if (!targetUser || targetUser.organization !== context.organizationId) {
    return null;
  }

  return {
    ...context,
    targetUserId,
    targetUserRole: targetUser.role as Role,
  };
}

/**
 * Check if user is the last owner in the organization
 */
export async function isLastOwner(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const owners = await db.query.profilesTable.findMany({
    where: eq(profilesTable.organization, organizationId),
  });

  const ownerCount = owners.filter((user) => user.role === "owner").length;
  const isCurrentUserOwner = owners.some(
    (user) => user.id === userId && user.role === "owner",
  );

  return isCurrentUserOwner && ownerCount === 1;
}

/**
 * Middleware to check permissions
 */
export async function requirePermission(action: Action, targetUserId?: string) {
  const context = targetUserId
    ? await getAuthContextWithTarget(targetUserId)
    : await getAuthContext();

  if (!context) {
    throw new Error("Unauthorized: No valid session");
  }

  if (!can(context, action)) {
    throw new Error(`Unauthorized: Cannot perform ${action}`);
  }

  return context;
}
