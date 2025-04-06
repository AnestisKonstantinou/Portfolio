const fetch = require('node-fetch');

module.exports.handler = async (event, context) => {
  const entryId = event.queryStringParameters.entryId;
  const locale = event.queryStringParameters.locale || 'en';  // default to 'en' if not provided

  if (!entryId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing entryId" }) };
  }

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  // Append locale parameter to the URL
  const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries/${entryId}?access_token=${accessToken}&include=10&locale=${locale}`;
  
  try {
    const response = await fetch(url);
    const rawData = await response.json();

    // Fallback for assets if not included:
    if (!rawData.includes || !rawData.includes.Asset || rawData.includes.Asset.length === 0) {
      console.log("No includes.Asset. Doing fallback fetch for each asset ref...");
      const galleryRefs = rawData.fields?.gallery || [];
      rawData.includes = { Asset: [] };

      for (const ref of galleryRefs) {
        const assetId = ref.sys?.id;
        if (!assetId) continue;

        const assetUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/assets/${assetId}?access_token=${accessToken}&locale=${locale}`;
        const assetResp = await fetch(assetUrl);
        const assetData = await assetResp.json();
        if (assetData.fields && assetData.fields.file) {
          rawData.includes.Asset.push(assetData);
        }
      }
    }

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
