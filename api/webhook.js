export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('Debugger is Online!');

    try {
        const update = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const orKey = process.env.OPENROUTER_API_KEY;

        if (update && update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userText = update.message.text;

            // Debugging အတွက် အဖြေကို ဆွဲထုတ်မယ်
            const aiResponse = await getOpenRouterChat(orKey, userText);
            
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
                "Content-Type": "application/json",
                "HTTP-Referer": "https://1ree-t4lk.vercel.app"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free", 
                messages: [{ role: "user", content: message }]
            })
        });

        const data = await response.json();

        // --- ဒီအပိုင်းက အဓိကပဲဗျာ ---
        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else if (data.error) {
            // Error ပါလာရင် Telegram မှာ တန်းပြမယ်
            return "OpenRouter JSON Error: " + JSON.stringify(data.error);
        } else {
            // အဖြေလည်းမရှိ၊ Error လည်းမရှိရင် တစ်ခုခုလွဲနေပြီ
            return "Raw JSON Response: " + JSON.stringify(data).substring(0, 200);
        }
    } catch (e) {
        return "Critical Fetch Error: " + e.message;
    }
}