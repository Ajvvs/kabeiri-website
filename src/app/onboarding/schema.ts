import { z } from "zod";

export const personalSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(1, "Username is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    avatarUrl: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const addressSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
});

export const shopSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  streetAddress: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  phone: z.string().min(1, "Phone number is required"),
  website: z.string().optional(),
  businessPhotoUrl: z.string().optional(),
});

export const subscriptionSchema = z.object({
  tier: z.enum(["Free", "Pro", "Enterprise"]),
});

export type PersonalSchema = z.infer<typeof personalSchema>;
export type AddressSchema = z.infer<typeof addressSchema>;
export type ShopSchema = z.infer<typeof shopSchema>;
export type SubscriptionSchema = z.infer<typeof subscriptionSchema>;
