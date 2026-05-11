import 'dotenv/config';

export interface Config {
  linkedinAccessToken: string;
  linkedinPersonUrn: string;
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

export function loadPublishConfig(): Config {
  return {
    linkedinAccessToken: requireEnv('LINKEDIN_ACCESS_TOKEN'),
    linkedinPersonUrn: requireEnv('LINKEDIN_PERSON_URN'),
  };
}
