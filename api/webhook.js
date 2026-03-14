import fs from 'fs';
import path from 'path';

// ဒီအပိုင်းက Vercel အတွက် မဖြစ်မနေ လိုအပ်ပါတယ်
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    const update = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const groqKey = process.env.GROQ_API_KEY;

    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const userText = update.message.text;

        // Start Command
        if (userText === '/start') {
            await sendTelegram(token, 'sendMessage', {
                chat_id: chatId,
                text: "လတ်တလော အဆင်ပြေစေရန် Groq AI ကို အသုံးပြုထားပါတယ်ရှင်။ English လို အသုံးပြုလျှင် အကောင်းဆုံးဖြစ်ပြီး မြန်မာလို အသုံးပြုပါက အနည်းငယ် မှားယွင်းနိုင်ပါသည်။ ပိုမိုကောင်းမွန်သော အစီအစဉ်များ လာဖို့ ရှိပါတယ်ရှင့်။ ✨"
            });
            return res.status(200).send('OK');
        }

        // AI ဆီ ပို့ခြင်း
        const aiResponse = await getGroqChat(groqKey, userText);
        await sendTelegram(token, 'sendMessage', {
            chat_id: chatId,
            text: aiResponse
        });
    }
    return res.status(200).send('OK');
}

// Telegram ပို့တဲ့ function
async function sendTelegram(token, method, body) {
    return fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

// သင် ခုနက ပို့လိုက်တဲ့ getGroqChat function (ဒီအောက်မှာ ထည့်ပေးပါ)
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
                    { 
                        role: "system", 
                        content: `You are a helpful AI Assistant.
                        Instructions:
                        1. Answer clearly and concisely.
                        2. Use natural Myanmar spoken language (avoid book-style).
                        3. If user speaks English, respond in English.
                        4. Keep it friendly but professional for now.` 
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.6,
                max_tokens: 1024
            })
        });
        const data = await res.json();
        return data.choices[0].message.content;
    } catch (e) {
        return "Aurora ခဏနားနေလို့ပါရှင့်။ ✨";
    }
}