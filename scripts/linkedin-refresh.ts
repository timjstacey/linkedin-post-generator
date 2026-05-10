import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.LINKEDIN_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('Missing LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, or LINKEDIN_REFRESH_TOKEN in .env');
  console.error('Run `npm run auth:linkedin` first to obtain tokens.');
  process.exit(1);
}

const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }).toString(),
});

if (!res.ok) {
  throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
}

const tokens = (await res.json()) as {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
};

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
let envContent = readFileSync(envPath, 'utf8');

function setEnvVar(content: string, key: string, value: string): string {
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  return pattern.test(content) ? content.replace(pattern, line) : `${content}\n${line}`;
}

envContent = setEnvVar(envContent, 'LINKEDIN_ACCESS_TOKEN', tokens.access_token);
if (tokens.refresh_token) {
  envContent = setEnvVar(envContent, 'LINKEDIN_REFRESH_TOKEN', tokens.refresh_token);
}
writeFileSync(envPath, envContent);

console.log(`Access token refreshed (expires in ${Math.round(tokens.expires_in / 3600)}h)`);
if (tokens.refresh_token && tokens.refresh_token_expires_in) {
  console.log(`Refresh token updated (expires in ${Math.round(tokens.refresh_token_expires_in / 86400)} days)`);
}
