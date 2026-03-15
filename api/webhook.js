export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Aurora Bot is Ready!');
    }

    try {
        const update = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userText = update.message.text;

            const aiResponse = await getGeminiChat(geminiKey, userText);
            
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: aiResponse
                })
            });
        }
        
        return res.status(200).send('OK');
    } catch (error) {
        console.error("Handler Error:", error);
        return res.status(500).send('Internal Error');
    }
}

async function getGeminiChat(key, message) {
    try {
        // model name ကို gemini-1.5-flash-latest လို့ ပြောင်းထားပါတယ်
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`;
        
        const auroraSystemPrompt = "Your name is Aurora. You are a 19-year-old girl from Myanmar. Use natural, sweet Myanmar language with 'ရှင်' and 'နော်'.";

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: auroraSystemPrompt }]
                },
                contents: [{
                    parts: [{ text: message }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 800
                }
            })
        });

        const data = await response.json();

        // Error message စစ်ဆေးခြင်း
        if (data.error) {
            console.error("Gemini Error:", data.error.message);
            return "စနစ်လေး နည်းနည်း ပြဿနာတက်နေလို့ ခဏနေမှ ပြန်လာခဲ့ပါဦးနော်။";
        }

        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "အင်း... ခဏလေးနော်၊ Aurora ဘာပြန်ပြောရမလဲ စဉ်းစားနေလို့ပါ။";
        }
    } catch (e) {
        return "Aurora ဆီမှာ error တက်နေလို့ ခဏနေမှ ပြန်လာခဲ့ပါဦးနော်။";
    }
}