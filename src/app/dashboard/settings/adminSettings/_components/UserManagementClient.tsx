"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeftIcon,
  EditIcon,
  LoaderIcon,
  PlusIcon,
  UserIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DeleteUserButton } from "./DeleteUserButton";
import { InviteUserDialog } from "./InviteUserDialog";
import { UserSearchAndFilter } from "./UserSearchAndFilter";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone?: string;
  role: string;
}

interface UserManagementClientProps {
  initialUsers: User[];
}

export function UserManagementClient({
  initialUsers,
}: UserManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredUsers = useMemo(() => {
    return initialUsers.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesRole = selectedRole === "all" || user.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [initialUsers, searchQuery, selectedRole]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate a brief loading state
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

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

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Management
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage users in your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
            <InviteUserDialog>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </InviteUserDialog>
          </div>
        </div>

        <UserSearchAndFilter
          onSearch={handleSearch}
          onRoleFilter={handleRoleFilter}
          searchQuery={searchQuery}
          selectedRole={selectedRole}
          userCount={initialUsers.length}
          filteredCount={filteredUsers.length}
        />

        <Card>
          <CardHeader>
            <CardTitle>
              Users ({filteredUsers.length}
              {filteredUsers.length !== initialUsers.length &&
                ` of ${initialUsers.length}`}
              )
            </CardTitle>
            <CardDescription>
              View and manage all users in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {searchQuery || selectedRole !== "all"
                    ? "No users match your filters"
                    : "No users found"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery || selectedRole !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by adding your first user."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.phone || "No phone"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Link
                              href={`/dashboard/settings/adminSettings/manageUsers/${user.id}`}
                            >
                              <Button variant="outline" size="sm">
                                <EditIcon className="h-4 w-4" />
                              </Button>
                            </Link>
                            {user.role !== "owner" && (
                              <DeleteUserButton userId={user.id} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
