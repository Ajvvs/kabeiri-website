"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateOrganization } from "../actions/organizationActions";
import {
  updateOrganizationSchema,
  type UpdateOrganizationFormValues,
} from "../schemas/userSchemas";
import { AddressFields } from "./AddressFields";

interface OrganizationSettingsFormProps {
  organization: {
    id: string;
    name: string;
    businessName?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    phone?: string | null;
    website?: string | null;
  };
}

export function OrganizationSettingsForm({
  organization,
}: OrganizationSettingsFormProps) {
  const router = useRouter();

  const form = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: organization.name,
      businessName: organization.businessName || "",
      streetAddress: organization.streetAddress || "",
      city: organization.city || "",
      state: organization.state || "",
      zipCode: organization.zipCode || "",
      phone: organization.phone || "",
      website: organization.website || "",
    },
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(data: UpdateOrganizationFormValues) {
    try {
      const response = await updateOrganization(data);

      if (response.success) {
        toast.success("Organization updated successfully!");
        router.refresh();
      } else {
        const errorMessage = response.error || "Failed to update organization";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update organization");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization Details */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Organization Name</Label>
          <Input id="name" {...form.register("name")} className="mt-1" />
          {errors.name && (
            <span className="text-destructive text-sm">
              {errors.name.message}
            </span>
          )}
        </div>

        <div>
          <Label htmlFor="businessName">Business Name (Optional)</Label>
          <Input
            id="businessName"
            {...form.register("businessName")}
            className="mt-1"
          />
          {errors.businessName && (
            <span className="text-destructive text-sm">
              {errors.businessName.message}
            </span>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            {...form.register("phone")}
            className="mt-1"
          />
          {errors.phone && (
            <span className="text-destructive text-sm">
              {errors.phone.message}
            </span>
          )}
        </div>

        <div>
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            {...form.register("website")}
            className="mt-1"
          />
          {errors.website && (
            <span className="text-destructive text-sm">
              {errors.website.message}
            </span>
          )}
        </div>
      </div>

      {/* Address Fields */}
      <AddressFields form={form} showTitle />

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Organization"
        )}
      </Button>
    </form>
  );
}
