export async function uploadImage(imageUrl: string, accessToken: string, personUrn: string): Promise<string> {
  // Step 1: Register the upload
  const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: personUrn,
        serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
      },
    }),
  });

  if (!registerResponse.ok) {
    const errorBody = await registerResponse.text();
    throw new Error(`LinkedIn API error ${registerResponse.status}: ${errorBody}`);
  }

  const registerData = (await registerResponse.json()) as {
    value: {
      asset: string;
      uploadMechanism: {
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
          uploadUrl: string;
        };
      };
    };
  };

  const assetUrn = registerData.value?.asset;
  const uploadUrl =
    registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  if (!assetUrn || !uploadUrl) {
    throw new Error(`LinkedIn registerUpload response missing asset or uploadUrl: ${JSON.stringify(registerData)}`);
  }

  // Step 2: Download the image. Bound the fetch — a hung image host must not
  // stall the whole publish job (the image is optional; a failure falls back
  // to a text-only post upstream).
  const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image ${imageResponse.status}: ${imageUrl}`);
  }
  const imageBytes = await imageResponse.arrayBuffer();

  // Step 3: Upload the bytes. The dispatch payload is always a PNG
  // (feedshare-image recipe), so send image/png rather than trusting the
  // source server's Content-Type.
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'image/png',
    },
    body: imageBytes,
  });

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.text();
    throw new Error(`LinkedIn API error ${uploadResponse.status}: ${errorBody}`);
  }

  return assetUrn;
}

export async function createPost(
  text: string,
  accessToken: string,
  personUrn: string,
  imageAssetUrn?: string
): Promise<string> {
  const body = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': imageAssetUrn
        ? {
            shareCommentary: { text },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                media: imageAssetUrn,
                description: { text },
              },
            ],
          }
        : {
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
