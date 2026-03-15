export default async function handler(req, res) {
    // POST မဟုတ်ရင် ၂၀၀ ပေးပြီး ရပ်မယ်
    if (req.method !== 'POST') {
        return res.status(200).send('Aurora Bot is Ready!');
    }

    try {
        const update = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const orKey = process.env.OPENROUTER_API_KEY;

        // Telegram က စာသားပါမှ အလုပ်လုပ်မယ်
        if (update && update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userText = update.message.text;

            // OpenRouter ဆီက အဖြေတောင်းမယ်
            const aiResponse = await getOpenRouterChat(orKey, userText);
            
            // Telegram ဆီ ပြန်ပို့မယ်
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
        return res.status(200).send('OK'); // Telegram ကို error မပြချင်လို့ 200 ပဲ ပြန်ပေးထားမယ်
    }
}

async function getOpenRouterChat(key, message) {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://1ree-t4lk.vercel.app", 
                "X-Title": "Aurora Bot"
            },
            body: JSON.stringify({
                // အခုလောလောဆယ် OpenRouter မှာ အလုပ်လုပ်ဆုံး Free Model ID ပါ
                model: "google/gemini-2.0-flash-exp:free", 
                messages: [
                    { 
                        role: "system", 
                        content: "Your name is Aurora. A 19-year-old girl from Myanmar. Use sweet Myanmar language with 'ရှင်/နော်'." 
                    },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            return `OpenRouter Error: ${data.error.message}`;
        }

        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else {
            return "အင်း... ခဏလေးနော်၊ Aurora ဘာပြန်ပြောရမလဲ စဉ်းစားနေလို့ပါ။";
        }
    } catch (e) {
        return "Aurora ဆီမှာ error တက်နေလို့ ခဏနေမှ ပြန်လာခဲ့ပါဦးနော်။";
    }
}