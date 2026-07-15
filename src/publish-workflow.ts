import { loadPublishConfig } from './config.js';
import { createPost } from './linkedin.js';
import { createComment } from './comment.js';

/** Public URL for a created post, from the `urn:li:share:…` / `urn:li:ugcPost:…` URN. */
function linkedInPostUrl(urn: string): string {
  return `https://www.linkedin.com/feed/update/${urn}`;
}

async function main() {
  const config = loadPublishConfig();

  // Blog-first: resume-static-site authors the blog and the LinkedIn copy, then
  // dispatches the finished text here (post-to-linkedin.yml). Post it verbatim,
  // then drop the blog link as a first comment — LinkedIn demotes posts with
  // external links in the body, so the link rides in the comment instead.
  const postText = process.env['POST_TEXT'];
  if (!postText || !postText.trim()) {
    throw new Error('Missing required environment variable: POST_TEXT');
  }

  const blogUrl = process.env['BLOG_URL']?.trim();
  const commentText = process.env['COMMENT_TEXT']?.trim() || (blogUrl ? `Full write-up: ${blogUrl}` : '');

  console.log('Publishing dispatched text to LinkedIn...');
  const postUrn = await createPost(postText, config.linkedinAccessToken, config.linkedinPersonUrn);
  console.log(`Published successfully. URN: ${postUrn}`);
  console.log(`Post URL: ${linkedInPostUrl(postUrn)}`);

  if (!commentText) {
    console.log('No blog URL or comment text supplied — skipping the blog-link comment.');
    return;
  }

  // Transitional guard: while the site still bakes the blog link into the copy,
  // commenting it again would double the link. Skip until the copy drops it.
  if (blogUrl && postText.includes(blogUrl)) {
    console.log('Blog URL is already in the post copy — skipping the blog-link comment.');
    return;
  }

  console.log('Commenting the blog link on the post...');
  const commentUrn = await createComment(postUrn, commentText, config.linkedinAccessToken, config.linkedinPersonUrn);
  console.log(`Comment created. URN: ${commentUrn}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
