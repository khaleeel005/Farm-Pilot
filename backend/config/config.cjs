const fs = require("fs");
const path = require("path");

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex <= 0) return null;

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

function loadEnvFile(envFilePath) {
  if (!fs.existsSync(envFilePath)) return;

  const content = fs.readFileSync(envFilePath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadEnv() {
  const root = path.resolve(__dirname, "..");
  const nodeEnv = process.env.NODE_ENV;
  const files = [".env"];

  if (nodeEnv) {
    files.push(`.env.${nodeEnv}`);
  }

  files.push(".env.local");

  if (nodeEnv) {
    files.push(`.env.${nodeEnv}.local`);
  }

  for (const file of files) {
    loadEnvFile(path.resolve(root, file));
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set for sequelize-cli`);
  }
  return value;
}

function parsePort(raw, name) {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a valid integer`);
  }
  return parsed;
}

function parseBool(raw, name) {
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(`${name} must be either "true" or "false"`);
}

function parseDialect(raw) {
  if (raw === "postgres" || raw === "sqlite") return raw;
  throw new Error('DB_DIALECT must be either "postgres" or "sqlite"');
}

function buildConfig() {
  loadEnv();

  const dialect = parseDialect(requireEnv("DB_DIALECT"));
  const logging = parseBool(requireEnv("DB_LOG"), "DB_LOG")
    ? console.log
    : false;

  if (process.env.DATABASE_URL) {
    const ssl = process.env.DB_SSL === "true";
    return {
      use_env_variable: "DATABASE_URL",
      dialect,
      logging,
      dialectOptions: ssl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : undefined,
    };
  }

  if (dialect === "sqlite") {
    return {
      dialect,
      storage: requireEnv("DB_STORAGE"),
      logging,
    };
  }

  return {
    username: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    host: requireEnv("DB_HOST"),
    port: parsePort(requireEnv("DB_PORT"), "DB_PORT"),
    dialect,
    logging,
  };
}

const shared = buildConfig();

module.exports = {
  development: shared,
  test: shared,
  production: shared,
};
