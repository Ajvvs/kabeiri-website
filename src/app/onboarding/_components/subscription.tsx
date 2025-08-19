"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { useOnboardingStore } from "@/app/onboarding/store";
import { getTierPricing } from "@/lib/polar-checkout";

import { subscriptionSchema, type SubscriptionSchema } from "../schema";

export function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscriptionInfo, setSubscriptionInfo } = useOnboardingStore();
  const [selectedTier, setSelectedTier] = useState<
    "Free" | "Pro" | "Enterprise"
  >(subscriptionInfo.tier || "Free");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pricing, setPricing] = useState<Record<string, any> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionSchema>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: subscriptionInfo,
  });

  useEffect(() => {
    const loadPricing = async () => {
      const pricingData = await getTierPricing();
      setPricing(pricingData);
    };
    loadPricing();
  }, []);

  const onSubmit = () => {
    startTransition(() => {
      setSubscriptionInfo({ tier: selectedTier });

      // Navigate to review step
      const params = new URLSearchParams(searchParams);
      params.set("step", "review");
      router.push(`?${params.toString()}`);
    });
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams);
    params.set("step", "shop");
    router.push(`?${params.toString()}`);
  };

  const handleTierSelect = (tier: "Free" | "Pro" | "Enterprise") => {
    setSelectedTier(tier);
    setValue("tier", tier);
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Free";
    return `$${(price / 100).toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-muted-foreground hover:bg-muted rounded-lg p-2 transition"
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <h2 className="text-2xl font-semibold tracking-tight">
          Choose your plan
        </h2>
      </div>
      <p className="text-muted-foreground">
        Select the plan that best fits your business needs.
      </p>

      {pricing && (
        <div className="space-y-4">
          {Object.entries(pricing).map(([tier, details]) => (
            <label
              key={tier}
              className={`hover:bg-muted/50 relative flex cursor-pointer items-start gap-4 rounded-lg border-2 p-6 transition-all ${
                selectedTier === tier
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="subscription-tier"
                value={tier}
                checked={selectedTier === tier}
                onChange={() =>
                  handleTierSelect(tier as "Free" | "Pro" | "Enterprise")
                }
                className="text-primary focus:ring-primary mt-1 size-4"
              />

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{details.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {details.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {formatPrice(details.price, details.currency)}
                    </div>
                    {details.interval && (
                      <p className="text-muted-foreground text-sm">
                        per {details.interval}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {details.features.map((feature: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckIcon className="size-3 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("tier")} value={selectedTier} />
        {errors.tier && (
          <p className="text-destructive mb-4 text-sm">{errors.tier.message}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 transition disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Continue"}
        </button>
      </form>
    </div>
  );
}

export function SubscriptionInfo() {
  return (
    <>
      <h2 className="mb-6 text-3xl font-semibold tracking-tight">
        Choose your plan. Cancel whenever you want.
      </h2>

      <div className="text-muted-foreground mb-8 max-w-md text-lg">
        <div className="flex flex-col gap-4">
          <p>Pick the plan that&apos;s right for you.</p>
        </div>
      </div>
    </>
  );
}
