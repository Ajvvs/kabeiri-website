import { polarClient } from "@polar-sh/better-auth";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [adminClient(), organizationClient(), polarClient()],
});

export const { signIn, signUp, useSession } = createAuthClient();
