export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Method not allowed');
    }

    const update = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const groqKey = process.env.GROQ_API_KEY;

    // ၁။ စာသား (Text) ရောက်လာရင် AI နဲ့ ပြန်ဖြေခြင်း
    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const userText = update.message.text;

        // /start ရိုက်ရင် Website သွားဖို့ ခလုတ်ပြမယ်
        if (userText === '/start') {
            await sendTelegram(token, 'sendMessage', {
                chat_id: chatId,
                text: "1reeT4lk မှ ကြိုဆိုပါတယ်! ကျွန်တော်က AI Assistant ပါ။ ဘာကူညီပေးရမလဲ?",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🚀 Open 1reeT4lk App", web_app: { url: "https://1ree-t4lk.vercel.app/app.html" } }
                    ]]
                }
            });
        } else {
            // Groq AI ဆီက အဖြေတောင်းမယ်
            const aiResponse = await getGroqChat(groqKey, userText);
            await sendTelegram(token, 'sendMessage', {
                chat_id: chatId,
                text: aiResponse
            });
        }
    }

    // ၂။ သီချင်းဖိုင် (Audio) ရောက်လာရင် လက်ခံမယ်
    if (update.message && update.message.audio) {
        const chatId = update.message.chat.id;
        const fileId = update.message.audio.file_id;
        await sendTelegram(token, 'sendMessage', {
            chat_id: chatId,
            text: `သီချင်းရပါပြီ! File ID က: ${fileId} ဖြစ်ပါတယ်။ (ဒီ ID ကို Supabase မှာ သိမ်းလို့ရပါပြီ)`
        });
    }

    return res.status(200).send('OK');
}

// Telegram API ဆီ Data ပို့တဲ့ function
async function sendTelegram(token, method, body) {
    return fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

// Groq AI ဆီက အဖြေတောင်းတဲ့ function
async function getGroqChat(key, message) {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "မင်းက 1reeT4lk Website ရဲ့ လက်ထောက် AI ဖြစ်တယ်။ မြန်မာလိုပဲ ရိုးရိုးရှင်းရှင်းနဲ့ ယဉ်ယဉ်ကျေးကျေး ပြန်ဖြေပေးပါ။" },
                    { role: "user", content: message }
                ]
            })
        });
        const data = await res.json();
        return data.choices[0].message.content;
    } catch (e) {
        return "ခဏလေးနော်၊ ကျွန်တော့်ဦးနှောက် ခဏအနားယူနေလို့ပါ။ နောက်မှ ပြန်မေးပေးပါ!";
    }
}
