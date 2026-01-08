const { TranslationServiceClient } = require("@google-cloud/translate").v3;
const { client: redis } = require("../config/redis.config");

const client = new TranslationServiceClient();

const PROJECT_ID = process.env.GCLOUD_PROJECT_ID;
const LOCATION = "global";

console.log("GCLOUD_PROJECT_ID:", PROJECT_ID);
console.log("GOOGLE_APPLICATION_CREDENTIALS:", process.env.GOOGLE_APPLICATION_CREDENTIALS);

async function translateArray(texts, targetLang) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const cleanTexts = texts.map(t => (t || "").trim()).filter(Boolean);
  if (!cleanTexts.length) return [];

  const [response] = await client.translateText({
    parent: `projects/${PROJECT_ID}/locations/${LOCATION}`,
    contents: cleanTexts,
    mimeType: "text/plain",
    targetLanguageCode: targetLang,
  });

  return response.translations.map(t => t.translatedText);
}

module.exports = { translateArray };