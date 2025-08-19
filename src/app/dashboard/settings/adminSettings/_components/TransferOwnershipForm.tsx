"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { transferOwnership } from "../actions/organizationActions";
import {
  transferOwnershipSchema,
  type TransferOwnershipFormValues,
} from "../schemas/userSchemas";

interface TransferOwnershipFormProps {
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
  currentUserId: string;
}

export function TransferOwnershipForm({
  users,
  currentUserId,
}: TransferOwnershipFormProps) {
  const router = useRouter();

  const form = useForm<TransferOwnershipFormValues>({
    resolver: zodResolver(transferOwnershipSchema),
    defaultValues: {
      targetUserId: "",
    },
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  // Filter out current user from the list
  const eligibleUsers = users.filter((user) => user.id !== currentUserId);

  async function onSubmit(data: TransferOwnershipFormValues) {
    try {
      const response = await transferOwnership(data);

      if (response.success) {
        toast.success("Ownership transferred successfully!");
        router.refresh();
      } else {
        const errorMessage = response.error || "Failed to transfer ownership";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to transfer ownership");
    }
  }

  if (eligibleUsers.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No other users available for ownership transfer. Add more users to your
        organization first.
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="targetUserId">Select New Owner</Label>
        <Select
          onValueChange={(value) => form.setValue("targetUserId", value)}
          defaultValue={form.watch("targetUserId")}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choose a user to transfer ownership to" />
          </SelectTrigger>
          <SelectContent>
            {eligibleUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.targetUserId && (
          <span className="text-destructive text-sm">
            {errors.targetUserId.message}
          </span>
        )}
      </div>

      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Warning:</strong> This action cannot be undone. You will lose
          owner privileges and the selected user will become the new
          organization owner.
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        variant="destructive"
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
            Transferring...
          </>
        ) : (
          "Transfer Ownership"
        )}
      </Button>
    </form>
  );
}
