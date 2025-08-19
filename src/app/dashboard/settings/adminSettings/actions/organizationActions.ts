"use server";

import { revalidatePath } from "next/cache";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profilesTable } from "@/db/app.schema";
import { organization } from "@/db/auth.schema";

import { requireBetterAuthPermission } from "../actions";
import {
  transferOwnershipSchema,
  updateOrganizationSchema,
  type TransferOwnershipFormValues,
  type UpdateOrganizationFormValues,
} from "../schemas/userSchemas";

export async function getOrganization() {
  const context = await requireBetterAuthPermission("admin");

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, context.organizationId),
  });

  return org;
}

export async function updateOrganization(
  data: UpdateOrganizationFormValues,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("admin");

    // Validate input
    const result = updateOrganizationSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: "Invalid input data",
      };
    }

    await db
      .update(organization)
      .set({
        name: result.data.name,
        businessName: result.data.businessName,
        streetAddress: result.data.streetAddress,
        city: result.data.city,
        state: result.data.state,
        zipCode: result.data.zipCode,
        phone: result.data.phone,
        website: result.data.website,
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
  data: TransferOwnershipFormValues,
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireBetterAuthPermission("owner");

    // Validate input
    const result = transferOwnershipSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: "Invalid target user",
      };
    }

    const targetUserId = result.data.targetUserId;

    // Update the current owner to admin
    await db
      .update(profilesTable)
      .set({ role: "admin" })
      .where(eq(profilesTable.id, context.userId));

    // Update the target user to owner
    await db
      .update(profilesTable)
      .set({ role: "owner" })
      .where(eq(profilesTable.id, targetUserId));

    revalidatePath("/dashboard/settings/adminSettings/organization");
    revalidatePath("/dashboard/settings/adminSettings/manageUsers");

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
