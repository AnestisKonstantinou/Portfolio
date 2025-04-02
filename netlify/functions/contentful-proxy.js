const fetch = require('node-fetch');

module.exports.handler = async (event, context) => {
  try {
    // 1) Parse the query param
    const entryId = event.queryStringParameters.entryId;
    if (!entryId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing entryId query parameter" }),
      };
    }

    // 2) Read environment vars from Netlify
    const spaceId = process.env.CONTENTFUL_SPACE_ID;
    const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

    // 3) Fetch the main entry with a higher include (just in case)
    const mainUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries/${entryId}?access_token=${accessToken}&include=10`;
    const mainResp = await fetch(mainUrl);
    const mainData = await mainResp.json();

    if (!mainData || !mainData.fields) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Entry not found or missing fields" }),
      };
    }

    // 4) Extract the gallery items (references to assets)
    const entryTitle = mainData.fields.title || "Untitled Gallery";
    const imagesArray = mainData.fields.galleryItem || [];

    // 5) If includes.Asset is present, we can parse that. Otherwise, we do the fallback
    let resolvedImages = [];

    if (mainData.includes && mainData.includes.Asset && mainData.includes.Asset.length > 0) {
      // a) Normal route: data.includes.Asset is present
      const assetsMap = new Map();
      mainData.includes.Asset.forEach(asset => {
        assetsMap.set(asset.sys.id, asset);
      });

      imagesArray.forEach(itemRef => {
        const asset = assetsMap.get(itemRef.sys.id);
        if (asset && asset.fields && asset.fields.file) {
          const url = 'https:' + asset.fields.file.url;
          const title = asset.fields.title || '';
          const description = asset.fields.description || '';
          resolvedImages.push({ url, title, description });
        }
      });
    } else {
      // b) Fallback route: fetch each asset individually
      for (let i = 0; i < imagesArray.length; i++) {
        const ref = imagesArray[i];
        if (!ref.sys || !ref.sys.id) continue;
        const assetId = ref.sys.id;

        const assetUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/assets/${assetId}?access_token=${accessToken}`;
        const assetResp = await fetch(assetUrl);
        const assetData = await assetResp.json();

        if (assetData && assetData.fields && assetData.fields.file) {
          const url = 'https:' + assetData.fields.file.url;
          const title = assetData.fields.title || '';
          const description = assetData.fields.description || '';
          resolvedImages.push({ url, title, description });
        }
      }
    }

    // 6) Return a **simplified** JSON object. For example:
    // {
    //   "title": "Textile",
    //   "images": [
    //      { "url": "...", "title": "...", "description": "..." },
    //      ...
    //   ]
    // }
    // so your front-end doesn't need to do any logic.
    const responseBody = {
      title: entryTitle,
      images: resolvedImages
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responseBody),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    };

  } catch (error) {
    console.error("Proxy error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
