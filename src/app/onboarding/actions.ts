"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { organizationsTable, profilesTable } from "@/db/app.schema";
import { auth } from "@/lib/auth";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

const businessInfoSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  industry: z.string().min(1, "Industry is required"),
  organizationSize: z.string().min(1, "Organization size is required"),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function updatePersonalInfo(data: z.infer<typeof personalInfoSchema>) {
  try {
    const validatedData = personalInfoSchema.parse(data);
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Update user profile
    await db
      .update(profilesTable)
      .set({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.id, session.user.id));

    revalidatePath("/onboarding");
    return { success: true };
  } catch (error) {
    console.error("Error updating personal info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update personal info",
    };
  }
}

export async function createOrganization(
  personalData: z.infer<typeof personalInfoSchema>,
  businessData: z.infer<typeof businessInfoSchema>,
) {
  try {
    const validatedPersonal = personalInfoSchema.parse(personalData);
    const validatedBusiness = businessInfoSchema.parse(businessData);
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    console.log("Creating organization for user:", session.user.id);

    // Check if user already has an organization
    const existingProfile = await db.query.profilesTable.findFirst({
      where: eq(profilesTable.id, session.user.id),
    });

    if (existingProfile?.organization) {
      throw new Error("User already belongs to an organization");
    }

    // Create organization using Better Auth's organization API
    const orgResult = await auth.api.createOrganization({
      headers: await headers(),
      body: {
        name: validatedBusiness.organizationName,
        slug: validatedBusiness.organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, ""),
      },
    });

    if (!orgResult) {
      throw new Error("Failed to create organization");
    }

    console.log("Organization created:", orgResult);

    // Get the organization ID from the response
    const orgId = orgResult.id;

    if (!orgId) {
      throw new Error("Organization ID not returned from Better Auth");
    }

    // Update organizations table with business info
    await db
      .update(organizationsTable)
      .set({
        industry: validatedBusiness.industry,
        organizationSize: validatedBusiness.organizationSize,
        website: validatedBusiness.website || null,
        address: validatedBusiness.address || null,
        phone: validatedBusiness.phone || null,
        updatedAt: new Date(),
      })
      .where(eq(organizationsTable.id, orgId));

    console.log("Organization updated with business fields");

    // Update the user's profile with the organization ID
    // Note: Better Auth automatically handles the "owner" role in the member table
    // We only need to link the profile to the organization
    await db
      .update(profilesTable)
      .set({
        organization: orgId, // Link profile to organization
        // Remove role: "owner" - Better Auth handles this automatically
        firstName: validatedPersonal.firstName,
        lastName: validatedPersonal.lastName,
        phone: validatedPersonal.phone,
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.id, session.user.id));

    console.log("User profile updated with organization and personal info");

    revalidatePath("/onboarding");
    redirect("/dashboard");
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create organization",
    };
  }
}

export async function joinOrganization(inviteCode: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Check if user already has an organization
    const existingProfile = await db.query.profilesTable.findFirst({
      where: eq(profilesTable.id, session.user.id),
    });

    if (existingProfile?.organization) {
      throw new Error("User already belongs to an organization");
    }

    // Use Better Auth's acceptInvitation API
    const result = await auth.api.acceptInvitation({
      headers: await headers(),
      body: {
        invitationId: inviteCode,
      },
    });

    if (!result) {
      throw new Error("Invalid or expired invite code");
    }

    console.log("Successfully joined organization:", result);

    // Better Auth automatically updates the membership
    // We just need to update our profile table to link to the organization
    await db
      .update(profilesTable)
      .set({
        organization: result.organizationId,
        updatedAt: new Date(),
      })
      .where(eq(profilesTable.id, session.user.id));

    revalidatePath("/onboarding");
    redirect("/dashboard");
  } catch (error) {
    console.error("Error joining organization:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to join organization",
    };
  }
}
