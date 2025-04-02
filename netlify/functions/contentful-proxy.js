import fetch from 'node-fetch';

export async function handler(event, context) {
  const entryId = event.queryStringParameters.entryId;

  if (!entryId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing entryId query parameter" }),
    };
  }

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  const contentfulUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries/${entryId}?access_token=${accessToken}&include=2`;

  try {
    const response = await fetch(contentfulUrl);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Optional: if you're calling this from other domains
      },
    };
  } catch (error) {
    console.error("Proxy error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}
