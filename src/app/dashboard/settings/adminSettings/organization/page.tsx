import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeftIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/authz";

import { OrganizationSettingsForm } from "../_components/OrganizationSettingsForm";
import { TransferOwnershipForm } from "../_components/TransferOwnershipForm";
import { getOrganization } from "../actions/organizationActions";
import { getOrganizationUsers } from "../actions/userActions";

export default async function OrganizationPage() {
  // Check authorization using Better Auth organization member role
  let hasAdminAccess = false;
  let isOwner = false;

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
      isOwner = userRole === "owner";
    }
  } catch (error) {
    console.error("Error getting active member:", error);
    hasAdminAccess = false;
    isOwner = false;
  }

  // Redirect if no admin access
  if (!hasAdminAccess) {
    redirect("/dashboard?error=unauthorized");
  }

  const organization = await getOrganization();
  const users = await getOrganizationUsers();

  // Get current user ID from session
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id;

  if (!organization) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600 dark:text-red-400">Organization not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="mb-6">
          <Link
            href="/dashboard/settings/adminSettings"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to Admin Settings
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organization Settings
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your organization information and settings.
          </p>
        </div>

        {/* Organization Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>
              Update your organization details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationSettingsForm organization={organization} />
          </CardContent>
        </Card>

        {/* Ownership Transfer Form - Only for owners */}
        {isOwner && currentUserId && (
          <Card>
            <CardHeader>
              <CardTitle>Transfer Ownership</CardTitle>
              <CardDescription>
                Transfer ownership of this organization to another user. This
                action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransferOwnershipForm
                users={users}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
