import 'dotenv/config';
import { createServer } from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:8080/callback';
const PORT = 8080;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env first');
  process.exit(1);
}

const state = randomBytes(16).toString('hex');
const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('scope', 'openid profile w_member_social');

console.log('Opening browser for LinkedIn auth...');
console.log(`If browser does not open, visit:\n${authUrl.toString()}\n`);

const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
exec(`${openCmd} "${authUrl.toString()}"`);

const code = await new Promise<string>((resolve, reject) => {
  const timeout = setTimeout(() => {
    server.close();
    reject(new Error('Auth timeout (5 minutes)'));
  }, 5 * 60 * 1000);

  const server = createServer((req, res) => {
    const url = new URL(req.url!, `http://localhost:${PORT}`);
    if (url.pathname !== '/callback') { res.end(); return; }

    const returnedState = url.searchParams.get('state');
    const authCode = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400);
      res.end(`Auth error: ${error}`);
      clearTimeout(timeout);
      server.close();
      reject(new Error(`LinkedIn auth error: ${error}`));
      return;
    }

    if (returnedState !== state) {
      res.writeHead(400);
      res.end('State mismatch');
      clearTimeout(timeout);
      server.close();
      reject(new Error('State mismatch'));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Auth successful! You can close this tab.</h1></body></html>');
    clearTimeout(timeout);
    server.close();
    resolve(authCode!);
  });

  server.listen(PORT, () => console.log(`Waiting for LinkedIn callback on port ${PORT}...`));
});

console.log('Exchanging code for tokens...');
const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }).toString(),
});

if (!tokenRes.ok) {
  throw new Error(`Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
}

const tokens = (await tokenRes.json()) as {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
};

function parseJwtSub(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  return (payload.sub as string) ?? null;
}

async function fetchPersonSub(accessToken: string): Promise<string> {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`/v2/userinfo failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { sub: string };
  return data.sub;
}

const sub =
  (tokens.id_token && parseJwtSub(tokens.id_token)) ??
  (await fetchPersonSub(tokens.access_token));

const personUrn = `urn:li:person:${sub}`;

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
let envContent = readFileSync(envPath, 'utf8');

function setEnvVar(content: string, key: string, value: string): string {
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  return pattern.test(content) ? content.replace(pattern, line) : `${content}\n${line}`;
}

envContent = setEnvVar(envContent, 'LINKEDIN_ACCESS_TOKEN', tokens.access_token);
envContent = setEnvVar(envContent, 'LINKEDIN_PERSON_URN', personUrn);
if (tokens.refresh_token) {
  envContent = setEnvVar(envContent, 'LINKEDIN_REFRESH_TOKEN', tokens.refresh_token);
}

writeFileSync(envPath, envContent);

console.log(`\nDone!`);
console.log(`  Access token expires in ${Math.round(tokens.expires_in / 3600)}h`);
if (tokens.refresh_token && tokens.refresh_token_expires_in) {
  console.log(`  Refresh token expires in ${Math.round(tokens.refresh_token_expires_in / 86400)} days`);
}
console.log(`  Person URN: ${personUrn}`);
