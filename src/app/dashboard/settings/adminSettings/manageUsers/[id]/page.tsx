import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeftIcon, ShieldIcon, UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { isLastOwner, type Role } from "@/lib/authz";

import { DeleteUserButton } from "../../_components/DeleteUserButton";
import { EditUserForm } from "../../_components/EditUserForm";
import { getUserById } from "../../actions/userActions";

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserPageProps) {
  const { id } = await params;
  // Check authorization using Better Auth organization member role
  let hasAdminAccess = false;
  let userRole: Role | undefined;
  let isOwner = false;
  let currentUserId: string | undefined;

  try {
    // Get session and member information from Better Auth
    const session = await auth.api.getSession({ headers: await headers() });
    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });

    currentUserId = session?.user?.id;

    if (activeMember?.role) {
      // Better Auth organization roles can be a string or array
      const memberRole = Array.isArray(activeMember.role)
        ? activeMember.role[0]
        : activeMember.role;

      userRole = memberRole as Role;

      // Check if user has admin access based on Better Auth organization role
      hasAdminAccess = userRole === "admin" || userRole === "owner";
      isOwner = userRole === "owner";
    }
  } catch (error) {
    console.error("Error getting active member:", error);
    hasAdminAccess = false;
  }

  // Redirect if no admin access
  if (!hasAdminAccess) {
    redirect("/dashboard?error=unauthorized");
  }

  // Get the user details
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  // Check if this user is trying to edit themselves and if they're the last owner
  const isEditingSelf = currentUserId === id;
  const isLastOwnerInOrg =
    isEditingSelf && user.role === "owner"
      ? await isLastOwner(id, user.organization!)
      : false;

  // Simplified permission logic based on Better Auth roles
  const canEditUser = hasAdminAccess;
  const canChangeRole =
    isOwner && !(isEditingSelf && user.role === "owner" && isLastOwnerInOrg);
  const canDeleteUser = hasAdminAccess && user.role !== "owner";

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="mb-6">
          <Link
            href="/dashboard/settings/adminSettings/manageUsers"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to User Management
          </Link>
        </div>

        {/* User Header */}
        <div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  @{user.username}
                </span>
                <Badge
                  variant={
                    user.role === "owner"
                      ? "default"
                      : user.role === "admin"
                        ? "secondary"
                        : "outline"
                  }
                  className="flex items-center gap-1"
                >
                  <ShieldIcon className="h-3 w-3" />
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Edit User Form */}
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              {canEditUser
                ? "Update user information and manage their role in the organization."
                : "View user information. Contact an administrator to make changes."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditUserForm
              user={user}
              canChangeRole={canChangeRole}
              canEditUser={canEditUser}
              isEditingSelf={isEditingSelf}
              isLastOwner={isLastOwnerInOrg}
            />
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {canDeleteUser && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                Danger Zone
              </CardTitle>
              <CardDescription>
                Permanently remove this user from your organization. This action
                cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteUserButton userId={user.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
