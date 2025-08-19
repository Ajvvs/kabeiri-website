"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { ArrowLeftIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";

import {
  createOrganizationWithCheckout,
  createUserAccount,
  createUserProfile,
} from "@/app/onboarding/actions";
import { useOnboardingStore } from "@/app/onboarding/store";

type SubmissionStatus = {
  account?: boolean;
  profile?: boolean;
  organization?: boolean;
  error?: string;
};

export function ReviewForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>({});
  const { personalInfo, addressInfo, shopInfo, subscriptionInfo, reset } =
    useOnboardingStore();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Step 1: Create user account
      const accountResult = await createUserAccount({
        email: personalInfo.email,
        password: personalInfo.password,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
      });

      if (!accountResult.success || !accountResult.data?.userId) {
        throw new Error(accountResult.error || "Failed to create account");
      }
      setStatus((prev) => ({ ...prev, account: true }));

      // Step 2: Create user profile
      const profileResult = await createUserProfile(accountResult.data.userId, {
        ...personalInfo,
        ...addressInfo,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error || "Failed to create profile");
      }
      setStatus((prev) => ({ ...prev, profile: true }));

      // Step 3: Create organization with checkout if shop info exists
      if (shopInfo.shopName) {
        const orgResult = await createOrganizationWithCheckout({
          ...shopInfo,
          tier: subscriptionInfo.tier,
          customerEmail: personalInfo.email,
          customerName: `${personalInfo.firstName} ${personalInfo.lastName}`,
        });

        if (!orgResult.success) {
          throw new Error(orgResult.error || "Failed to create organization");
        }

        setStatus((prev) => ({ ...prev, organization: true }));

        // If checkout URL is provided (paid tier), redirect to checkout
        if (orgResult.data?.checkoutUrl) {
          // Clear the store before redirecting to checkout
          reset();
          // Redirect to Polar checkout
          window.location.href = orgResult.data.checkoutUrl;
          return; // Don't continue with normal flow
        }
      }

      // Clear the store
      reset();

      // Success! Redirect to dashboard (Free tier or no organization)
      router.push(`/dashboard`);
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Something went wrong",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="text-muted-foreground hover:bg-muted rounded-lg p-2 transition disabled:opacity-50"
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold">Review Your Information</h1>
        <div className="w-8" />
      </div>

      <div className="rounded-lg border p-6 shadow-xs">
        <h2 className="mb-4 text-lg font-medium">Personal Information</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-muted-foreground text-sm">Name</dt>
            <dd>
              {personalInfo.firstName} {personalInfo.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Username</dt>
            <dd>{personalInfo.username}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Email</dt>
            <dd>{personalInfo.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Phone</dt>
            <dd>{personalInfo.phoneNumber}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border p-6 shadow-xs">
        <h2 className="mb-4 text-lg font-medium">Address</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <dt className="text-muted-foreground text-sm">Street Address</dt>
            <dd>{addressInfo.address}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">City</dt>
            <dd>{addressInfo.city}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">State</dt>
            <dd>{addressInfo.state}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">ZIP Code</dt>
            <dd>{addressInfo.zipCode}</dd>
          </div>
        </dl>
      </div>

      {shopInfo.shopName && (
        <div className="rounded-lg border p-6 shadow-xs">
          <h2 className="mb-4 text-lg font-medium">Shop Information</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <dt className="text-muted-foreground text-sm">Shop Name</dt>
              <dd>{shopInfo.shopName}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground text-sm">Street Address</dt>
              <dd>{shopInfo.streetAddress}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">City</dt>
              <dd>{shopInfo.city}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">State</dt>
              <dd>{shopInfo.state}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">ZIP Code</dt>
              <dd>{shopInfo.zipCode}</dd>
            </div>
            {shopInfo.website && (
              <div>
                <dt className="text-muted-foreground text-sm">Website</dt>
                <dd>{shopInfo.website}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground text-sm">Business Phone</dt>
              <dd>{shopInfo.phone}</dd>
            </div>
            {shopInfo.businessPhotoUrl && (
              <div>
                <dt className="text-muted-foreground text-sm">
                  Business Photo
                </dt>
                <dd>
                  <Image
                    src={shopInfo.businessPhotoUrl}
                    alt="Business"
                    className="mt-1 size-24 rounded-lg object-cover"
                  />
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="rounded-lg border p-6 shadow-xs">
        <h2 className="mb-4 text-lg font-medium">Subscription</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <dt className="text-muted-foreground text-sm">Tier</dt>
            <dd>{subscriptionInfo.tier}</dd>
          </div>
        </dl>
      </div>

      {status.error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircleIcon className="size-5" />
            <p>{status.error}</p>
          </div>
        </div>
      )}

      {(status.account || status.profile || status.organization) && (
        <div className="space-y-2">
          {status.account && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2Icon className="size-5" />
              <p>Account created successfully</p>
            </div>
          )}
          {status.profile && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2Icon className="size-5" />
              <p>Profile created successfully</p>
            </div>
          )}
          {status.organization && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2Icon className="size-5" />
              <p>Organization created successfully</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2 transition disabled:opacity-50"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </div>
    </div>
  );
}

export function ReviewInfo() {
  return (
    <>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">
        Almost there!
      </h2>

      <div className="text-muted-foreground mb-8 max-w-md text-lg">
        <div className="flex flex-col gap-4">
          <p>Please review your information before creating your account.</p>
          <p>Make sure everything is correct before proceeding.</p>
        </div>
      </div>
    </>
  );
}
