"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/lib/authz";

import { changeUserRole, updateUserInfo } from "../actions/userActions";
import {
  changeUserRoleSchema,
  updateUserInfoSchema,
  type ChangeUserRoleFormValues,
  type UpdateUserInfoFormValues,
} from "../schemas/userSchemas";
import { AddressFields } from "./AddressFields";

interface EditUserFormProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    phone?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    role: Role;
  };
  canChangeRole: boolean;
  canEditUser: boolean;
  isEditingSelf: boolean;
  isLastOwner: boolean;
}

export function EditUserForm({
  user,
  canChangeRole,
  canEditUser,
  isEditingSelf,
  isLastOwner,
}: EditUserFormProps) {
  const router = useRouter();

  const userForm = useForm<UpdateUserInfoFormValues>({
    resolver: zodResolver(updateUserInfoSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phone: user.phone || "",
      streetAddress: user.streetAddress || "",
      city: user.city || "",
      state: user.state || "",
      zipCode: user.zipCode || "",
    },
  });

  const roleForm = useForm<ChangeUserRoleFormValues>({
    resolver: zodResolver(changeUserRoleSchema),
    defaultValues: {
      role: user.role,
    },
  });

  const userFormErrors = userForm.formState.errors;
  const roleFormErrors = roleForm.formState.errors;
  const isSubmittingUser = userForm.formState.isSubmitting;
  const isSubmittingRole = roleForm.formState.isSubmitting;

  async function onSubmitUserInfo(data: UpdateUserInfoFormValues) {
    try {
      const response = await updateUserInfo(user.id, data);

      if (response.success) {
        toast.success("User information updated successfully!");
        router.refresh();
      } else {
        const errorMessage =
          response.error || "Failed to update user information";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user information");
    }
  }

  async function onSubmitRoleChange(data: ChangeUserRoleFormValues) {
    try {
      const response = await changeUserRole(user.id, data);

      if (response.success) {
        toast.success("User role updated successfully!");
        router.refresh();
      } else {
        const errorMessage = response.error || "Failed to update user role";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user role");
    }
  }

  // Determine if role changes should be disabled
  const roleChangeDisabled =
    !canChangeRole || (isEditingSelf && user.role === "owner" && isLastOwner);

  return (
    <div className="space-y-8">
      {/* User Information Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">User Information</h3>
        <form
          onSubmit={userForm.handleSubmit(onSubmitUserInfo)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...userForm.register("firstName")}
                className="mt-1"
                disabled={!canEditUser}
              />
              {userFormErrors.firstName && (
                <span className="text-destructive text-sm">
                  {userFormErrors.firstName.message}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...userForm.register("lastName")}
                className="mt-1"
                disabled={!canEditUser}
              />
              {userFormErrors.lastName && (
                <span className="text-destructive text-sm">
                  {userFormErrors.lastName.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              {...userForm.register("username")}
              className="mt-1"
              disabled={!canEditUser}
            />
            {userFormErrors.username && (
              <span className="text-destructive text-sm">
                {userFormErrors.username.message}
              </span>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              {...userForm.register("phone")}
              className="mt-1"
              disabled={!canEditUser}
            />
            {userFormErrors.phone && (
              <span className="text-destructive text-sm">
                {userFormErrors.phone.message}
              </span>
            )}
          </div>

          {/* Address Fields */}
          <AddressFields form={userForm} disabled={!canEditUser} showTitle />

          {canEditUser && (
            <Button
              type="submit"
              disabled={isSubmittingUser}
              className="w-full sm:w-auto"
            >
              {isSubmittingUser ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update User Information"
              )}
            </Button>
          )}
        </form>
      </div>

      {/* Role Change Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">User Role</h3>
        <form
          onSubmit={roleForm.handleSubmit(onSubmitRoleChange)}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              onValueChange={(value) =>
                roleForm.setValue("role", value as Role)
              }
              defaultValue={roleForm.watch("role")}
              disabled={roleChangeDisabled}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            {roleFormErrors.role && (
              <span className="text-destructive text-sm">
                {roleFormErrors.role.message}
              </span>
            )}
          </div>

          {/* Role Change Warnings */}
          {roleChangeDisabled && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                {isEditingSelf && user.role === "owner" && isLastOwner ? (
                  <>
                    <strong>⚠️ Warning:</strong> As the only owner, you cannot
                    change your own role. Transfer ownership to another user
                    first.
                  </>
                ) : (
                  <>
                    <strong>Permission Required:</strong> Only organization
                    owners can modify user roles.
                  </>
                )}
              </div>
            </div>
          )}

          {canChangeRole && !roleChangeDisabled && (
            <Button
              type="submit"
              disabled={isSubmittingRole}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {isSubmittingRole ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Updating Role...
                </>
              ) : (
                "Update User Role"
              )}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
