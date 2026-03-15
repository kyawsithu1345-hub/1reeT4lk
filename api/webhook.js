export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OpenRouter Debugger Ready!');

    try {
        const update = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const orKey = process.env.OPENROUTER_API_KEY;

        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userText = update.message.text;

            const aiResponse = await getOpenRouterChat(orKey, userText);
            
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: aiResponse })
            });
        }
        return res.status(200).send('OK');
    } catch (e) {
        return res.status(200).send('OK');
    }
}

async function getOpenRouterChat(key, message) {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // Model နာမည်ကို အသေချာဆုံး ဖြစ်မယ့် Stable Free model တစ်ခု ပြောင်းထားတယ်
                model: "google/gemini-flash-1.5-8b:free", 
                messages: [
                    { role: "system", content: "Your name is Aurora. A 19-year-old girl from Myanmar. Use sweet Myanmar language." },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();

        // Error message ကို Telegram မှာ တန်းမြင်ရအောင် လုပ်ထားပါတယ်
        if (data.error) {
            return `OpenRouter Error: ${data.error.message || "Unknown Error"}`;
        }

        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            return "AI က အဖြေပြန်မပေးပါဘူး။ JSON: " + JSON.stringify(data).substring(0, 100);
        }
    } catch (e) {
        return "Network Error: " + e.message;
    }
}