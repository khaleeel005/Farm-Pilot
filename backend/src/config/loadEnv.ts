import fs from 'fs';
import path from 'path';

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const separatorIndex = trimmed.indexOf('=');
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

export function loadEnvFile(envFilePath = '.env'): void {
  const resolvedPath = path.resolve(process.cwd(), envFilePath);
  if (!fs.existsSync(resolvedPath)) return;

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;

    const [key, value] = parsed;
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function resolveEnvFiles(nodeEnv?: string): string[] {
  const files = ['.env'];

  if (nodeEnv) {
    files.push(`.env.${nodeEnv}`);
  }

  files.push('.env.local');

  if (nodeEnv) {
    files.push(`.env.${nodeEnv}.local`);
  }

  return files;
}

export function loadEnv(): void {
  const protectedKeys = new Set(Object.keys(process.env));
  const nodeEnv = process.env.NODE_ENV;
  const files = resolveEnvFiles(nodeEnv);

  for (const envFilePath of files) {
    const resolvedPath = path.resolve(process.cwd(), envFilePath);
    if (!fs.existsSync(resolvedPath)) continue;

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;

      const [key, value] = parsed;
      if (protectedKeys.has(key)) continue;

      process.env[key] = value;
    }
  }
}

loadEnv();
