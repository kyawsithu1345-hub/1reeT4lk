export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Aurora Bot is back on Groq AI!');
    }

    try {
        const update = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const groqKey = process.env.GROQ_API_KEY;

        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userText = update.message.text;

            // 1. Groq AI ဆီက အဖြေတောင်းမယ်
            const aiResponse = await getGroqChat(groqKey, userText);
            
            // 2. Telegram ဆီ ပြန်ပို့မယ်
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

async function getGroqChat(key, message) {
    try {
        const auroraSystemPrompt = "Your name is Aurora. You are a 19-year-old girl from Myanmar. Use natural, sweet Myanmar language with 'ရှင်' and 'နော်'. Answer as a warm and poetic companion.";

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: auroraSystemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.8,
                max_tokens: 1024
            })
        });

        const data = await res.json();

        if (data.choices && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            console.error("Groq Error Detail:", JSON.stringify(data));
            return "အင်း... ခဏလေးနော်၊ Aurora ဘာပြန်ပြောရမလဲ စဉ်းစားနေလို့ပါ။";
        }
    } catch (e) {
        console.error("Fetch Exception:", e);
        return "Aurora ဆီမှာ error တက်နေလို့ ခဏနေမှ ပြန်လာခဲ့ပါဦးနော်။";
    }
}