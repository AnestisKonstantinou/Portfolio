const fetch = require('node-fetch');
const { documentToHtmlString } = require('@contentful/rich-text-html-renderer');

/**
 * This function fetches *all* published "News Article" entries from Contentful,
 * and returns an array of simplified objects: 
 * [ {id, title, thumbnailUrl, shortExcerpt, body}, ... ].
 * It converts a Rich Text shortExcerpt field into HTML.
 */
module.exports.handler = async (event, context) => {
  try {
    const spaceId = process.env.CONTENTFUL_SPACE_ID;
    const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
    
    // Content type for your "News Article" (replace with your actual contentTypeId)
    const contentTypeId = 'newsFlash';
    
    // Using include=10 to try to resolve references and ordering by publishDate descending
    const baseUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?access_token=${accessToken}&content_type=${contentTypeId}&include=10&order=-fields.publishDate`;
    const response = await fetch(baseUrl);
    const data = await response.json();

    if (!data || !data.items) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No items found or invalid response." }),
      };
    }

    const resolvedArticles = [];

    // Build a map of assets from data.includes.Asset for quick lookup
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
      
      // Convert shortExcerpt if it's a Rich Text object
      let shortExcerptHtml = "";
      if (fields.shortExcerpt && typeof fields.shortExcerpt === 'object' && fields.shortExcerpt.nodeType) {
        shortExcerptHtml = documentToHtmlString(fields.shortExcerpt);
      } else {
        shortExcerptHtml = fields.shortExcerpt || "";
      }

      // Full body (unchanged)
      const body = fields.fullBody || "";
      const articleId = entry.sys.id; // unique ID for toggling

      // Lookup thumbnail URL from assetMap
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
        shortExcerpt: shortExcerptHtml,
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
