interface CommentElement {
  actor?: string;
  message?: { text?: string };
}

/** Existing first-level comments on a share/ugcPost. Empty list when the post has none. */
export async function getExistingComments(postUrn: string, accessToken: string): Promise<CommentElement[]> {
  const url = `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  // A post with no social actions returns 404 — treat that as "no comments yet".
  if (response.status === 404) return [];
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LinkedIn API error ${response.status}: ${errorBody}`);
  }

  const body = (await response.json()) as { elements?: CommentElement[] };
  return body.elements ?? [];
}

/** Create a comment on a share/ugcPost. Returns the new comment URN. */
export async function createComment(
  postUrn: string,
  text: string,
  accessToken: string,
  personUrn: string
): Promise<string> {
  const body = {
    actor: personUrn,
    object: postUrn,
    message: { text },
  };

  const url = `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LinkedIn API error ${response.status}: ${errorBody}`);
  }

  const commentUrn = response.headers.get('X-RestLi-Id') ?? 'unknown';
  return commentUrn;
}
