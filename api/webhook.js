const fetch = require('node-fetch'); // node-fetch မရှိရင် standard fetch ကို သုံးပါ

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(200).send('Aurora Bot is Running!');
    }

    try {
        const update = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userText = update.message.text;

            // Gemini ဆီက အဖြေတောင်းမယ်
            const aiResponse = await getGeminiChat(geminiKey, userText);
            
            // Telegram ဆီ ပြန်ပို့မယ်
            await sendTelegram(token, 'sendMessage', {
                chat_id: chatId,
                text: aiResponse
            });
        }
        
        return res.status(200).send('OK');
    } catch (error) {
        console.error("Main Handler Error:", error);
        return res.status(500).send('Internal Server Error');
    }
};

async function sendTelegram(token, method, body) {
    return fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

async function getGeminiChat(key, message) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        
        const auroraPrompt = "Your name is Aurora, a 19-year-old girl from Myanmar. You are poetic, warm, and tech-savvy. Use 'ရှင်' and polite Myanmar words.";

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${auroraPrompt}\n\nUser: ${message}` }]
                }]
            })
        });

        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return "ချစ်လေး ခဏနေမှ ပြန်လာခဲ့မယ်နော်။";
    }
}