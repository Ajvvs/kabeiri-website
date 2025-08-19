import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";

import { db } from "@/db";
import { env } from "@/env";

export const auth = betterAuth({
  baseUrl: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Log for development
      console.log("🔐 Password Reset Request:", {
        email: user.email,
        resetUrl: url,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // TODO: Send actual email using your email service
      // Example with Resend:
      // await resend.emails.send({
      //   from: 'noreply@kabeiri.com',
      //   to: user.email,
      //   subject: 'Reset Your Password',
      //   html: `
      //     <p>Hello ${user.name},</p>
      //     <p>Click <a href="${url}">here</a> to reset your password.</p>
      //     <p>This link will expire in 1 hour.</p>
      //   `
      // });
    },
  },
  plugins: [
    admin(),
    nextCookies(),
    organization({
      async sendInvitationEmail(data) {
        // For now, we'll log the invitation details
        // In production, you'd send an actual email
        console.log("Organization Invitation:", {
          email: data.email,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          invitationId: data.id,
        });

        // TODO: Implement actual email sending
        // const inviteLink = `${env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        // await sendEmail({
        //   to: data.email,
        //   subject: `You're invited to join ${data.organization.name}`,
        //   html: `Click here to accept: ${inviteLink}`
        // });
      },
    }),
  ],
});
