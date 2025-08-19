"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CheckCircle2Icon, LoaderIcon } from "lucide-react";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  const organizationId = searchParams.get("org");
  const tier = searchParams.get("tier");

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Here you could verify the checkout completion with Polar
        // and update any subscription status in your database

        if (organizationId && tier) {
          setStatus("success");
          setMessage(`Successfully subscribed to ${tier} plan!`);

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push(`/dashboard?tier=${tier}&welcome=true`);
          }, 3000);
        } else {
          throw new Error("Missing organization or tier information");
        }
      } catch (error) {
        console.error("Checkout success error:", error);
        setStatus("error");
        setMessage(
          "There was an issue processing your payment. Please contact support.",
        );
      }
    };

    handleSuccess();
  }, [organizationId, tier, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <LoaderIcon className="text-primary mx-auto size-12 animate-spin" />
          <h1 className="mt-4 text-2xl font-semibold">
            Processing your payment...
          </h1>
          <p className="text-muted-foreground mt-2">
            Please wait while we confirm your subscription.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-12 rounded-full bg-red-100 p-3 dark:bg-red-900">
            <svg
              className="size-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-red-600">
            Payment Error
          </h1>
          <p className="text-muted-foreground mt-2">{message}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded-md px-4 py-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto size-12 rounded-full bg-green-100 p-3 dark:bg-green-900">
          <CheckCircle2Icon className="size-6 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-green-600">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground mt-2">{message}</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Redirecting you to your dashboard...
        </p>
        <div className="mt-4">
          <div className="inline-flex items-center gap-2">
            <LoaderIcon className="size-4 animate-spin" />
            <span className="text-sm">Redirecting in 3 seconds...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
