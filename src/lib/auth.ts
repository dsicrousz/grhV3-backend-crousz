import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
// import { dash } from "@better-auth/infra";
import { ac, roles } from "./permissions";
import 'dotenv/config';

// Validation des variables d'environnement critiques
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/refgrh';
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const FRONTEND_URLS = process.env.FRONTEND_URLS;
if (!BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is required in environment variables');
}

if (!FRONTEND_URLS) {
  throw new Error('FRONTEND_URLS is required in environment variables');
}

const allowedOrigins = FRONTEND_URLS.split(',').map(url => url.trim());

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const client = new MongoClient(MONGODB_URL);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
    transaction: false
  }),
  account:{
    accountLinking: {
			enabled: true, // Enable/disable linking (default: true)
			trustedProviders: ["google", "github"], // Auto-link without email verification
			disableImplicitLinking: false, // Require explicit linking via settings
			allowDifferentEmails: false, // Allow linking accounts with different emails
			updateUserInfoOnLink: false, // Sync provider profile to user on link
			allowUnlinkingAll: false, // Allow removing all linked accounts
		}
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
    disableSignUp:true
  },
  socialProviders: GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET ? {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      disableSignUp: true,
    },
  } : {},
  plugins: [
    admin({
      ac,
      roles,
      defaultRole: 'user',
    }),
    apiKey({
      enableSessionForAPIKeys: true,
    })
  ],
  secret: BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  trustedOrigins: allowedOrigins,
  advanced: {
    cookiePrefix: 'better-auth',
    useSecureCookies: process.env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});
