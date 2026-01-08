const { translateText } = require('../utils/Translator.utils.js');

const getTranslation = async (req,res) =>{
    const {text, targetLanguage} = req.body;
    try{
        const translatedText = await translateText(text, targetLanguage);
        return res.status(200).json({ translatedText });
    }catch(error){
        res.status(500).json({ error: 'Translation failed' });
    }
}  

module.exports = { getTranslation }