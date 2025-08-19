import { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Using a more specific type approach without interfaces
// This component works with any form that has these optional address fields
export function AddressFields({
  form,
  showStreetAddress = true,
  showPhone = true,
  showTitle = false,
  disabled = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  showStreetAddress?: boolean;
  showPhone?: boolean;
  showTitle?: boolean;
  disabled?: boolean;
}) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <div className="space-y-4">
      {showTitle && (
        <h4 className="text-base font-medium text-gray-900 dark:text-white">
          Address Information
        </h4>
      )}

      {showPhone && (
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="Phone number"
            className="mt-1"
            disabled={disabled}
          />
          {errors.phone && (
            <span className="text-destructive text-sm">
              {errors.phone.message as string}
            </span>
          )}
        </div>
      )}

      {showStreetAddress && (
        <div>
          <Label htmlFor="streetAddress">Street Address</Label>
          <Input
            id="streetAddress"
            {...register("streetAddress")}
            placeholder="Street address"
            className="mt-1"
            disabled={disabled}
          />
          {errors.streetAddress && (
            <span className="text-destructive text-sm">
              {errors.streetAddress.message as string}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register("city")}
            placeholder="City"
            className="mt-1"
            disabled={disabled}
          />
          {errors.city && (
            <span className="text-destructive text-sm">
              {errors.city.message as string}
            </span>
          )}
        </div>

        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            {...register("state")}
            placeholder="State"
            className="mt-1"
            disabled={disabled}
          />
          {errors.state && (
            <span className="text-destructive text-sm">
              {errors.state.message as string}
            </span>
          )}
        </div>

        <div>
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            {...register("zipCode")}
            placeholder="Zip code"
            className="mt-1"
            disabled={disabled}
          />
          {errors.zipCode && (
            <span className="text-destructive text-sm">
              {errors.zipCode.message as string}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
