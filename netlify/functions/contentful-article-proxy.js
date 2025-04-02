// Pseudocode for your contentful-article-proxy.js:
const fetch = require('node-fetch');

module.exports.handler = async (event, context) => {
  const entryId = event.queryStringParameters.entryId;
  if (!entryId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing entryId" }) };
  }

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries/${entryId}?access_token=${accessToken}&include=10`;
  try {
    const response = await fetch(url);
    const rawData = await response.json();

    // We now have rawData.sys, rawData.fields, etc.
    // If rawData.includes.Asset is missing or empty, do fallback:
    if (!rawData.includes || !rawData.includes.Asset || rawData.includes.Asset.length === 0) {
      console.log("No includes.Asset. Doing fallback fetch for each asset ref...");

      // If there's a gallery array, fetch each asset individually
      const galleryRefs = rawData.fields?.gallery || [];
      // We'll store them in rawData.includes.Asset so your front-end code can find them
      rawData.includes = { Asset: [] };

      for (const ref of galleryRefs) {
        const assetId = ref.sys?.id;
        if (!assetId) continue;

        const assetUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/assets/${assetId}?access_token=${accessToken}`;
        const assetResp = await fetch(assetUrl);
        const assetData = await assetResp.json();
        // if this is a valid asset, push it into rawData.includes.Asset
        if (assetData.fields && assetData.fields.file) {
          rawData.includes.Asset.push(assetData);
        }
      }
    }

    // Now rawData should have an includes.Asset array with all the images
    return {
      statusCode: 200,
      body: JSON.stringify(rawData),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (err) {
    console.error("Article proxy error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
