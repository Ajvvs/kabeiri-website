"use server";

import { Polar } from "@polar-sh/sdk";

// Initialize Polar client
const polarClient = new Polar({
  accessToken: process.env.POLAR_DEV_TOKEN,
  server: "sandbox",
});

// Tier to Product ID mapping
const TIER_PRODUCT_MAP = {
  Free: process.env.POLAR_FREE_PRODUCT_ID,
  Pro: process.env.POLAR_PRO_PRODUCT_ID,
  Enterprise: process.env.POLAR_ENTERPRISE_PRODUCT_ID,
} as const;

export type TierType = keyof typeof TIER_PRODUCT_MAP;

export interface CheckoutData {
  tier: TierType;
  organizationId: string;
  customerEmail: string;
  customerName: string;
}

export async function createPolarCheckout({
  tier,
  organizationId,
  customerEmail,
  customerName,
}: CheckoutData) {
  try {
    const productId = TIER_PRODUCT_MAP[tier];
    console.log("productId", productId);
    if (!productId) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    // Create Polar customer first
    const customer = await polarClient.customers.create({
      email: customerEmail,
      name: customerName,
      metadata: {
        organizationId,
        tier,
      },
    });

    console.log("Polar customer created:", customer);

    // Create checkout session with Polar API
    const checkoutLink = await polarClient.checkoutLinks.create({
      productId,
      paymentProcessor: "stripe",
      successUrl: `${process.env.POLAR_SUCCESS_URL}?org=${organizationId}&tier=${tier}&customer=${customer.id}`,
      metadata: {
        organizationId,
        tier,
        customerId: customer.id, // Store customer ID in metadata
      },
    });

    if (!checkoutLink.id) {
      throw new Error("Failed to create checkout link");
    }

    return {
      success: true,
      checkoutUrl: checkoutLink.url,
      checkoutId: checkoutLink.id,
    };
  } catch (error) {
    console.error("Error creating Polar checkout:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create checkout",
    };
  }
}

export async function getTierPricing() {
  // Simplified pricing with hardcoded values to avoid complex API type issues
  return {
    Free: {
      name: "Free",
      description: "Perfect for getting started",
      price: 0,
      currency: "USD",
      interval: null,
      features: [
        "Basic shop management",
        "Up to 5 jobs per month",
        "Email support",
      ],
    },
    Pro: {
      name: "Pro",
      description: "Best for growing businesses",
      price: 2900, // $29.00 in cents
      currency: "USD",
      interval: "month",
      features: [
        "Unlimited jobs",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
      ],
    },
    Enterprise: {
      name: "Enterprise",
      description: "For large organizations",
      price: 9900, // $99.00 in cents
      currency: "USD",
      interval: "month",
      features: [
        "Everything in Pro",
        "Multi-location support",
        "Dedicated account manager",
        "Custom workflows",
      ],
    },
  };
}

export async function verifyCheckoutComplete(checkoutId: string) {
  try {
    const checkout = await polarClient.checkoutLinks.get({ id: checkoutId });
    return {
      success: true,
      isComplete: checkout.successUrl !== null,
      metadata: checkout.metadata,
    };
  } catch (error) {
    console.error("Error verifying checkout:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to verify checkout",
    };
  }
}
