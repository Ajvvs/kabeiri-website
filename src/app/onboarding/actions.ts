"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { eq } from "drizzle-orm";

import type {
  AddressSchema,
  PersonalSchema,
  ShopSchema,
} from "@/app/onboarding/schema";
import { db } from "@/db";
import { profilesTable } from "@/db/app.schema";
import { organization } from "@/db/auth.schema";
import { auth } from "@/lib/auth";

type ActionResponse<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function createUserAccount(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<ActionResponse<{ userId: string }>> {
  try {
    const authResponse = await auth.api.signUpEmail({
      body: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
      },
    });

    if (!authResponse?.user?.id) {
      throw new Error("Failed to create account");
    }

    return {
      success: true,
      data: { userId: authResponse.user.id },
    };
  } catch (error: unknown) {
    console.error("Error creating account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create account",
    };
  }
}

export async function createUserProfile(
  userId: string,
  formData: PersonalSchema & AddressSchema,
): Promise<ActionResponse> {
  try {
    await db.insert(profilesTable).values({
      id: userId,
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phoneNumber,
      role: "owner", // Set as owner since they're creating an organization
      streetAddress: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      avatarUrl: formData.avatarUrl,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create profile",
    };
  }
}

export async function createOrganization(
  data: ShopSchema,
): Promise<ActionResponse<{ organizationId: string }>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("User not authenticated");
    }

    console.log("Creating organization with data:", data);

    // Generate slug from shop name
    const slug = data.shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Create organization using better-auth with ONLY allowed fields
    const orgResponse = await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name: data.shopName,
        slug: slug,
        logo: data.businessPhotoUrl || undefined,
      },
    });

    console.log("Organization created:", orgResponse);

    // Extract organization ID - handle different response structures
    const orgId = orgResponse?.id;

    if (!orgId) {
      console.error("No organization ID returned:", orgResponse);
      throw new Error("Failed to create organization - no ID returned");
    }

    console.log("Organization ID:", orgId);

    // Update organization with business fields using direct DB query
    await db
      .update(organization)
      .set({
        businessName: data.shopName,
        businessPhotoUrl: data.businessPhotoUrl || null,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        website: data.website || null,
      })
      .where(eq(organization.id, orgId));

    console.log("Organization updated with business fields");

    // Update the user's profile with the organization ID
    // Note: Better Auth automatically handles the "owner" role in the member table
    // We only need to link the profile to the organization
    await db
      .update(profilesTable)
      .set({
        organization: orgId, // Link profile to organization
        // Remove role: "owner" - Better Auth handles this automatically
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.id, session.user.id));

    console.log("Profile updated successfully");

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error creating organization:", error);
    throw error;
  }
}
