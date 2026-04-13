import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
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

const client = new MongoClient(MONGODB_URL);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
    transaction: false
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  plugins: [
    admin({
      ac,
      roles,
      defaultRole: 'user',
    }),
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
