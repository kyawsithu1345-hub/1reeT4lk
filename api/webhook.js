export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OpenRouter Bot Ready!');

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
}

async function getOpenRouterChat(key, message) {
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
                // OpenRouter အတွက် ဒါလေးတွေ ထည့်ပေးရပါတယ်
                "HTTP-Referer": "https://1ree-t4lk.vercel.app", 
                "X-Title": "1reeT4lk Aurora"
            },
            body: JSON.stringify({
                // Free model ထဲက Gemini 1.5 Flash ကို သုံးထားပါတယ်
                model: "google/gemini-flash-1.5-exp:free", 
                messages: [
                    { role: "system", content: "Your name is Aurora. A 19-year-old girl from Myanmar. Use sweet Myanmar language with 'ရှင်' and 'နော်'." },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await res.json();
        return data.choices[0].message.content;
    } catch (e) {
        return "စနစ်လေး ခဏပြင်နေလို့ နောက်မှ ပြန်လာခဲ့မယ်နော်။";
    }
}