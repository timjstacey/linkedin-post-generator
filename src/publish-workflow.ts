import { loadPublishConfig } from './config.js';
import { createPost } from './linkedin.js';

/** Public URL for a created post, from the `urn:li:share:…` / `urn:li:ugcPost:…` URN. */
function linkedInPostUrl(urn: string): string {
  return `https://www.linkedin.com/feed/update/${urn}`;
}

async function main() {
  const config = loadPublishConfig();

  // Blog-first: resume-static-site authors the blog and the LinkedIn copy, then
  // dispatches the finished text here (post-to-linkedin.yml). Just post it — the
  // blog link is already in the copy, so the link runs one way and the returned
  // URL is logged, not forwarded.
  const postText = process.env['POST_TEXT'];
  if (!postText || !postText.trim()) {
    throw new Error('Missing required environment variable: POST_TEXT');
  }

  const blogUrl = process.env['BLOG_URL'];
  if (blogUrl) {
    console.log(`Canonical blog URL (already in the copy): ${blogUrl}`);
  }

  console.log('Publishing dispatched text to LinkedIn...');
  const postUrn = await createPost(postText, config.linkedinAccessToken, config.linkedinPersonUrn);
  console.log(`Published successfully. URN: ${postUrn}`);
  console.log(`Post URL: ${linkedInPostUrl(postUrn)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
