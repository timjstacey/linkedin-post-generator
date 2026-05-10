import 'dotenv/config';

export interface Config {
  anthropicApiKey: string;
  tavilyApiKey?: string;
  linkedinAccessToken?: string;
  linkedinPersonUrn?: string;
  researchTopic?: string;
  hashtags: string[];
  githubToken: string;
  githubRepo: string;
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

export function loadResearchConfig(): Config {
  return {
    anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
    tavilyApiKey: requireEnv('TAVILY_API_KEY'),
    researchTopic: requireEnv('RESEARCH_TOPIC'),
    hashtags: (process.env['HASHTAGS'] ?? '').split(',').filter(Boolean),
    githubToken: requireEnv('GITHUB_TOKEN'),
    githubRepo: requireEnv('GITHUB_REPO'),
  };
}

export function loadPublishConfig(): Config {
  return {
    anthropicApiKey: process.env['ANTHROPIC_API_KEY'] ?? '',
    linkedinAccessToken: requireEnv('LINKEDIN_ACCESS_TOKEN'),
    linkedinPersonUrn: requireEnv('LINKEDIN_PERSON_URN'),
    hashtags: [],
    githubToken: requireEnv('GITHUB_TOKEN'),
    githubRepo: requireEnv('GITHUB_REPO'),
  };
}
