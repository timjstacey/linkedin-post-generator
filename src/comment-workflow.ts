import { loadPublishConfig } from './config.js';
import { createComment, getExistingComments } from './comment.js';

const POST_URL_PREFIX = 'https://www.linkedin.com/feed/update/';

/** Inverse of linkedInPostUrl in publish-workflow.ts: feed URL -> post URN. */
function urnFromPostUrl(postUrl: string): string {
  const urn = postUrl.startsWith(POST_URL_PREFIX) ? postUrl.slice(POST_URL_PREFIX.length) : postUrl;
  if (!urn.startsWith('urn:li:')) {
    throw new Error(`Could not derive a post URN from LINKEDIN_POST_URL: ${postUrl}`);
  }
  return urn;
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

async function main() {
  const config = loadPublishConfig();
  const postUrl = requireEnv('LINKEDIN_POST_URL');
  const commentText = requireEnv('COMMENT_TEXT');
  const postUrn = urnFromPostUrl(postUrl);

  // Dedup key: the blog URL if supplied, else the full comment text.
  const dedupKey = process.env['BLOG_URL'] || commentText;

  // Best-effort dedup: skip if we already commented this blog link, to guard against
  // a re-run or repeated dispatch. Reading comments needs r_member_social, which the
  // publish token (w_member_social) lacks — that GET returns 403. Treat any read
  // failure as "could not check" and fall through to post, rather than aborting.
  let existing: Awaited<ReturnType<typeof getExistingComments>> = [];
  try {
    existing = await getExistingComments(postUrn, config.linkedinAccessToken);
  } catch (err) {
    console.warn(`Could not read existing comments (dedup skipped): ${String(err)}`);
  }
  const alreadyPosted = existing.some(
    (c) => c.actor === config.linkedinPersonUrn && (c.message?.text ?? '').includes(dedupKey)
  );
  if (alreadyPosted) {
    console.log('Matching comment already present on the post. Skipping.');
    return;
  }

  console.log(`Commenting on ${postUrn}...`);
  const commentUrn = await createComment(postUrn, commentText, config.linkedinAccessToken, config.linkedinPersonUrn);
  console.log(`Comment created. URN: ${commentUrn}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
