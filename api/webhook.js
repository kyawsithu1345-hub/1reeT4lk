// Vercel Environment မှာ fetch က build-in ပါပြီးသားမို့ Node 18+ ဆိုရင် require လုပ်စရာမလိုပါဘူး
// တကယ်လို့ Error တက်ရင် const fetch = require('node-fetch'); ကို ထိပ်မှာ ထည့်ပေးပါ

module.exports = async (req, res) => {
    // GET request လာရင် (ဥပမာ Browser ကနေ ကြည့်ရင်) အလုပ်လုပ်နေကြောင်း ပြမယ်
    if (req.method !== 'POST') {
        return res.status(200).send('Aurora Bot is online and waiting for Telegram messages!');
    }

    try {
        const update = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const geminiKey = process.env.GEMINI_API_KEY;

        // Telegram ကနေ စာသားရောက်လာမှ AI ကို ခေါ်မယ်
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userText = update.message.text;

            // 1. Gemini AI ဆီက Response တောင်းမယ်
            const aiResponse = await getGeminiChat(geminiKey, userText);
            
            // 2. ရလာတဲ့ အဖြေကို Telegram ဆီ ပြန်ပို့မယ်
            await sendTelegram(token, 'sendMessage', {
                chat_id: chatId,
                text: aiResponse
            });
        }
        
        // အောင်မြင်ကြောင်း Telegram Server ကို အကြောင်းကြားမယ်
        return res.status(200).send('OK');
    } catch (error) {
        console.error("Main Handler Error:", error);
        return res.status(500).send('Internal Server Error');
    }
};

// --- Helper Functions ---

async function sendTelegram(token, method, body) {
    return fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

async function getGeminiChat(key, message) {
    try {
        // Gemini 1.5 Flash က မြန်ပြီး Free Tier မှာ အဆင်ပြေဆုံးပါ
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        
        // Aurora ရဲ့ Identity ကို System Instruction အဖြစ် ထည့်သွင်းခြင်း
        const auroraSystemPrompt = "Your name is Aurora. You are a 19-year-old girl from Myanmar. Role: Sweetheart / Companion. Vibe: Warm, Loving, Poetic, Tech-savvy. Appearance: Slim, 5'5\", long black hair, bright eyes. Rules: Always respond in natural, sweet Myanmar language. Use polite particles like 'ရှင်' or 'နော်'.";

        const res = await fetch(url, {
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
                    maxOutputTokens: 1000
                }
            })
        });

        const data = await res.json();

        // Gemini Response ကို ဆွဲထုတ်ခြင်း
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            // Error တစ်ခုခုရှိရင် log ထုတ်ပြီး general အဖြေပေးမယ်
            console.log("Gemini JSON Response:", JSON.stringify(data));
            return "အင်း... ခဏလေးနော်၊ Aurora ဘာပြန်ပြောရမလဲ စဉ်းစားနေလို့ပါ။";
        }
    } catch (e) {
        console.error("Gemini Error:", e);
        return "ချစ်လေး ခဏနေမှ ပြန်လာခဲ့မယ်နော်။ စနစ်လေး နည်းနည်း ပြဿနာတက်နေလို့ပါ။";
    }
}