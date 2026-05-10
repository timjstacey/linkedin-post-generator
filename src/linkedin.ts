export interface LinkedInComment {
  urn: string;
  actorUrn: string;
  text: string;
}

export async function getComments(
  postUrn: string,
  accessToken: string,
): Promise<LinkedInComment[]> {
  const encoded = encodeURIComponent(postUrn);
  const response = await fetch(
    `https://api.linkedin.com/v2/socialActions/${encoded}/comments?count=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`LinkedIn API error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    elements: Array<{
      '$URN': string;
      actor: string;
      message: { text: string };
    }>;
  };

  return (data.elements ?? []).map((e) => ({
    urn: e['$URN'],
    actorUrn: e.actor,
    text: e.message.text,
  }));
}

export async function replyToComment(
  postUrn: string,
  commentUrn: string,
  text: string,
  accessToken: string,
  personUrn: string,
): Promise<void> {
  const encoded = encodeURIComponent(postUrn);
  const response = await fetch(
    `https://api.linkedin.com/v2/socialActions/${encoded}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        actor: personUrn,
        message: { text },
        parentComment: commentUrn,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`LinkedIn API error ${response.status}: ${await response.text()}`);
  }
}

export async function createPost(
  text: string,
  accessToken: string,
  personUrn: string,
): Promise<string> {
  const body = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
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

  const postUrn = response.headers.get('X-RestLi-Id') ?? 'unknown';
  return postUrn;
}
