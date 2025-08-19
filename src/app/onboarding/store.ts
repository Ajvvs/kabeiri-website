import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  AddressSchema,
  PersonalSchema,
  ShopSchema,
  SubscriptionSchema,
} from "@/app/onboarding/schema";

interface OnboardingStore {
  personalInfo: PersonalSchema;
  addressInfo: AddressSchema;
  shopInfo: ShopSchema;
  subscriptionInfo: SubscriptionSchema;
  setPersonalInfo: (info: PersonalSchema) => void;
  setAddressInfo: (info: AddressSchema) => void;
  setShopInfo: (info: ShopSchema) => void;
  setSubscriptionInfo: (info: SubscriptionSchema) => void;
  reset: () => void;
}

const initialState = {
  personalInfo: {
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    avatarUrl: "",
  },
  addressInfo: {
    address: "",
    city: "",
    state: "",
    zipCode: "",
  },
  shopInfo: {
    shopName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    website: "",
    businessPhotoUrl: "",
  },
  subscriptionInfo: {
    tier: "Free" as const,
  },
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialState,
      setPersonalInfo: (info) => set({ personalInfo: info }),
      setAddressInfo: (info) => set({ addressInfo: info }),
      setShopInfo: (info) => set({ shopInfo: info }),
      setSubscriptionInfo: (info) => set({ subscriptionInfo: info }),
      reset: () => set(initialState),
    }),
    {
      name: "onboarding-store",
    },
  ),
);
