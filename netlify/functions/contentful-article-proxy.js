const fetch = require('node-fetch');

module.exports.handler = async (event, context) => {
  const entryId = event.queryStringParameters.entryId;
  if (!entryId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing entryId" }) };
  }

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  // Just fetch the raw entry, maybe with a big include=10
  const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries/${entryId}?access_token=${accessToken}&include=10`;
  
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    
    // Return the entire raw data
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    console.error("Article proxy error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
