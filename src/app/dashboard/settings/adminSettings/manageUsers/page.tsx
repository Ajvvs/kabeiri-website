import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { Role } from "@/lib/authz";

import { UserManagementClient } from "../_components/UserManagementClient";
import { getOrganizationUsers } from "../actions";

export default async function ManageUsersPage() {
  // Check authorization using Better Auth organization member role
  let hasAdminAccess = false;

  try {
    // Get the user's active member information from Better Auth
    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });

    if (activeMember?.role) {
      // Better Auth organization roles can be a string or array
      const memberRole = Array.isArray(activeMember.role)
        ? activeMember.role[0]
        : activeMember.role;

      const userRole = memberRole as Role;

      // Check if user has admin access based on Better Auth organization role
      hasAdminAccess = userRole === "admin" || userRole === "owner";
    }
  } catch (error) {
    console.error("Error getting active member:", error);
    hasAdminAccess = false;
  }

  // Redirect if no admin access
  if (!hasAdminAccess) {
    redirect("/dashboard?error=unauthorized");
  }

  const users = await getOrganizationUsers();

  return <UserManagementClient initialUsers={users} />;
}
