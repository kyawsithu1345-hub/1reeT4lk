export default async function handler(req, res) {
    // GET request လာရင် Bot အလုပ်လုပ်နေကြောင်း ပြမယ်
    if (req.method !== 'POST') {
        return res.status(200).send('Aurora Bot is running perfectly with Gemini AI!');
    }

    try {
        const update = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const geminiKey = process.env.GEMINI_API_KEY;

        // Telegram ကနေ စာသားရောက်လာရင်
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userText = update.message.text;

            // 1. Gemini AI ဆီက အဖြေတောင်းမယ်
            const aiResponse = await getGeminiChat(geminiKey, userText);
            
            // 2. ရလာတဲ့ အဖြေကို Telegram ဆီ ပြန်ပို့မယ်
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
        console.error("Critical Handler Error:", error);
        return res.status(500).send('Internal Server Error');
    }
}

// --- Gemini AI Function ---
async function getGeminiChat(key, message) {
    try {
        // အသေချာဆုံး URL Structure (v1 standard)
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
        
        // Aurora ရဲ့ Identity ကို Prompt ထဲမှာ တစ်ခါတည်း ပေါင်းထည့်ခြင်း
        const auroraPrompt = "Your name is Aurora. You are a 19-year-old girl from Myanmar. You are poetic, warm, and tech-savvy. Always use natural, sweet Myanmar language with 'ရှင်' and 'နော်'. Answer as a companion.";

        const res = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ 
                        text: `${auroraPrompt}\n\nUser: ${message}` 
                    }]
                }]
            })
        });

        const data = await res.json();

        // Gemini Error ရှိမရှိ စစ်မယ်
        if (data.error) {
            console.error("Gemini API Error Detail:", data.error.message);
            return "ချစ်လေး ခဏနေမှ ပြန်လာခဲ့မယ်နော်။ (API Error လေး တက်နေလို့ပါ)";
        }

        // Response ပြန်လာရင် ထုတ်ပေးမယ်
        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "အင်း... ခဏလေးနော်၊ Aurora ဘာပြန်ပြောရမလဲ စဉ်းစားနေလို့ပါ။";
        }
    } catch (e) {
        console.error("Fetch Exception:", e);
        return "Aurora ဆီမှာ error တက်နေလို့ ခဏနေမှ ပြန်လာခဲ့ပါဦးနော်။";
    }
}