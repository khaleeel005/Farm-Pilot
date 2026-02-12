// SECURITY: JWT secret must be set via environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-only-refresh-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Warn if using default secrets in non-development environment
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("WARNING: JWT_SECRET environment variable not set in production!");
}

const config = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
};

export default config;
