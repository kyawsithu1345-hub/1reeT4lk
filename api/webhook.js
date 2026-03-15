import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    const update = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const groqKey = process.env.GROQ_API_KEY;

    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const userText = update.message.text;

        // Disclaimer ဖြုတ်လိုက်ပြီဖြစ်လို့ ဘာစာသားမဆို AI ဆီ တိုက်ရိုက်ပို့မယ်
        const aiResponse = await getGroqChat(groqKey, userText);
        await sendTelegram(token, 'sendMessage', {
            chat_id: chatId,
            text: aiResponse
        });
    }
    return res.status(200).send('OK');
}

async function sendTelegram(token, method, body) {
    return fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

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
                        content: "You are a helpful assistant. Use natural Myanmar for Myanmar queries and English for English queries." 
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });
        const data = await res.json();
        return data.choices[0].message.content;
    } catch (e) {
        return "System error. Please try again later.";
    }
}