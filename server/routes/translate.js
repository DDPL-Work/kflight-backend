// routes/translate.js
const express = require("express");
const router = express.Router();
const { translateArray } = require("../utils/Translator.utils");

router.post("/", async (req, res) => {
  try {
    const { texts, targetLang } = req.body;
    

    if (!texts || !Array.isArray(texts) || !targetLang) {
      return res.status(400).json({ error: "texts (array) and targetLang required" });
    }

    console.log(`Translating ${texts.length} texts to ${targetLang}`);

    const results = await translateArray(texts, targetLang);

    res.json({ translations: results });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

module.exports = router;
