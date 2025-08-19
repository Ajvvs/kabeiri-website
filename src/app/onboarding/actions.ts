"use server";

import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { eq } from "drizzle-orm";

import type {
  AddressSchema,
  PersonalSchema,
  ShopSchema,
  SubscriptionSchema,
} from "@/app/onboarding/schema";
import { db } from "@/db";
import { profilesTable } from "@/db/app.schema";
import { organization } from "@/db/auth.schema";
import { auth } from "@/lib/auth";
import { createPolarCheckout, type TierType } from "@/lib/polar-checkout";

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
  } catch (error) {
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

export async function createOrganizationWithCheckout(
  data: ShopSchema &
    SubscriptionSchema & { customerEmail: string; customerName: string },
): Promise<ActionResponse<{ organizationId: string; checkoutUrl?: string }>> {
  try {
    console.log("Creating organization with checkout data:", data);

    // Generate slug from shop name
    const slug = data.shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Create organization first
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("User not authenticated");
    }

    // Create organization using better-auth with ONLY allowed fields
    const orgResponse = await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name: data.shopName,
        slug: slug,
        logo: data.businessPhotoUrl || undefined,
      },
    });

    const orgId = orgResponse?.id;
    if (!orgId) {
      throw new Error("Failed to create organization - no ID returned");
    }

    // Update organization with business fields
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

    // Update user profile with organization ID and owner role
    await db
      .update(profilesTable)
      .set({
        organization: orgId,
        role: "owner",
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.id, session.user.id));

    // If tier is not Free, create Polar checkout

    const checkoutResult = await createPolarCheckout({
      tier: data.tier as TierType,
      organizationId: orgId,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
    });

    if (checkoutResult.success && checkoutResult.checkoutUrl) {
      return {
        success: true,
        data: {
          organizationId: orgId,
          checkoutUrl: checkoutResult.checkoutUrl,
        },
      };
    } else {
      console.error("Checkout creation failed:", checkoutResult.error);
      // Organization created but checkout failed - still return success
      return {
        success: true,
        data: { organizationId: orgId },
      };
    }
  } catch (error) {
    console.error("Error creating organization with checkout:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create organization",
    };
  }
}

export async function createOrganization(
  data: ShopSchema & SubscriptionSchema,
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

    // Create organization directly in our database (not Polar organization)
    const orgId = randomUUID();

    await db.insert(organization).values({
      id: orgId,
      name: data.shopName,
      slug: slug,
      logo: data.businessPhotoUrl || null,
      businessName: data.shopName,
      businessPhotoUrl: data.businessPhotoUrl || null,
      streetAddress: data.streetAddress,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      website: data.website || null,
      createdAt: new Date(),
    });

    console.log("Organization created with ID:", orgId);

    // Update the user's profile with the organization ID
    // Note: Better Auth automatically handles the "owner" role in the member table
    // We only need to link the profile to the organization
    await db
      .update(profilesTable)
      .set({
        organization: orgId,
        role: "owner",

        updatedAt: new Date(),
      })
      .where(eq(profilesTable.id, session.user.id));

    console.log("Profile updated successfully");

    revalidatePath(`/dashboard?tier=${data.tier}`);
    return {
      success: true,
      data: { organizationId: orgId },
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create organization",
    };
  }
}
