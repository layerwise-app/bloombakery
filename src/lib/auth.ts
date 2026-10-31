import { env } from 'cloudflare:workers';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { db } from '~/db';
import * as schema from '~/db/schema';
import { sendAuthEmail } from '~/lib/auth-email';
import { isOwnerEmail } from '~/lib/owners';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL || undefined,
  secret: env.BETTER_AUTH_SECRET || undefined,
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
      partitioned: true
    }
  },
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: {
    enabled: true,
    // Only owners have accounts on this site; see `owners` in the config.
    disableSignUp: true
  },
  databaseHooks: {
    user: {
      create: {
        // Email codes create an account on first use. Keep that to owners.
        before: async (user) => (isOwnerEmail(user.email) ? undefined : false)
      }
    }
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      async sendVerificationOTP({ email, otp, type }) {
        // The sign-in form is public. Never let it email an address that isn't
        // an owner's, or anyone could use it to send mail to strangers.
        if (!isOwnerEmail(email)) {
          console.warn('[auth] skipped sign-in code: address is not an owner');
          return;
        }
        await sendAuthEmail({
          email,
          otp,
          type: type === 'change-email' ? 'email-verification' : type
        });
      }
    }),
    admin(),
    // Must be the last plugin so it can attach Set-Cookie to responses.
    tanstackStartCookies()
  ]
});
