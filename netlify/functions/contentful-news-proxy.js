const fetch = require('node-fetch');
const { documentToHtmlString } = require('@contentful/rich-text-html-renderer');

module.exports.handler = async (event, context) => {
  try {
    const spaceId = process.env.CONTENTFUL_SPACE_ID;
    const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
    const contentTypeId = 'newsFlash'; // Ensure this matches your Contentful content type API ID

    // Read the locale from query parameters; default to 'en-US' (or your default) if not provided.
    const locale = event.queryStringParameters.locale || 'en-US';

    // Append the locale parameter to the API URL
    const baseUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?access_token=${accessToken}&content_type=${contentTypeId}&include=10&order=-fields.publishDate&locale=${locale}`;
    const response = await fetch(baseUrl);
    const data = await response.json();

    if (!data || !data.items) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No items found or invalid response." }),
      };
    }

    const resolvedArticles = [];

    // Build a map of assets for quick lookup
    const assetMap = new Map();
    if (data.includes && data.includes.Asset) {
      data.includes.Asset.forEach(asset => {
        assetMap.set(asset.sys.id, asset);
      });
    }

    for (let i = 0; i < data.items.length; i++) {
      const entry = data.items[i];
      const fields = entry.fields || {};

      const title = fields.title || "Untitled News";

      // Convert shortExcerpt if it is a Rich Text object
      let shortExcerpt = "";
      if (fields.shortExcerpt && typeof fields.shortExcerpt === 'object' && fields.shortExcerpt.nodeType) {
        shortExcerpt = documentToHtmlString(fields.shortExcerpt);
      } else if (typeof fields.shortExcerpt === 'string') {
        shortExcerpt = fields.shortExcerpt;
      }

      const body = fields.fullBody || "";
      const articleId = entry.sys.id;

      // Resolve the thumbnail image URL via the asset map
      let thumbnailUrl = "";
      if (fields.thumbnailImage && fields.thumbnailImage.sys) {
        const assetId = fields.thumbnailImage.sys.id;
        const asset = assetMap.get(assetId);
        if (asset && asset.fields && asset.fields.file) {
          thumbnailUrl = "https:" + asset.fields.file.url;
        }
      }

      resolvedArticles.push({
        id: articleId,
        title,
        shortExcerpt, // This is now an HTML string if it was rich text
        body,
        thumbnailUrl
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resolvedArticles),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (err) {
    console.error("Error in contentful-news-proxy:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
