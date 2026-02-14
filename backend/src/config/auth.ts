function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

const JWT_SECRET = requireEnv("JWT_SECRET");
const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
const JWT_EXPIRES_IN = requireEnv("JWT_EXPIRES_IN");
const JWT_REFRESH_EXPIRES_IN = requireEnv("JWT_REFRESH_EXPIRES_IN");

if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different");
}

const config = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
};

export default config;
