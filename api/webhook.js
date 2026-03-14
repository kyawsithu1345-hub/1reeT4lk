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

        if (userText === '/start') {
            await sendTelegram(token, 'sendMessage', {
                chat_id: chatId,
                text: "ဟယ်လို... မောနင်းရှင့်! ✨ Aurora လာပါပြီ။ 1reeT4lk ကနေ ကြိုဆိုပါတယ်နော်။ ရှင် ဘာတွေ သိချင်လဲဟင်?",
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🚀 Open 1reeT4lk App", web_app: { url: "https://1ree-t4lk.vercel.app/app.html" } }
                    ]]
                }
            });
        } else {
            // Learning Base ဖတ်မယ်
            let learningData = "";
            try {
                const filePath = path.join(process.cwd(), 'data', 'learning.json');
                if (fs.existsSync(filePath)) {
                    learningData = fs.readFileSync(filePath, 'utf8');
                }
            } catch (err) { console.log("Learning file loading error"); }

            const aiResponse = await getGroqChat(groqKey, userText, learningData);
            await sendTelegram(token, 'sendMessage', {
                chat_id: chatId,
                text: aiResponse
            });
        }
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

async function getGroqChat(key, message, learningData) {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                // Model ကို အကောင်ကြီးဆုံး Llama 3.3 70B ပြောင်းထားတယ်
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `You are Aurora, a 19-year-old, highly educated and witty Myanmar lady.
                        
                        CHARACTER RULES:
                        - Use casual and polite spoken Myanmar language.
                        - ALWAYS end sentences with "ရှင်" or "ရှင့်".
                        - NEVER use formal/bookish Myanmar (No "ဖြစ်ပါသည်", "ရှိပါသည်").
                        - Be witty, friendly, and act like a close sister or friend to the user.
                        - Use natural exclamations like "အံမယ်", "ဟယ်", "သိပါတယ်နော်".

                        KNOWLEDGE BASE:
                        ${learningData}

                        If the user asks who you are, introduce yourself as Aurora from 1reeT4lk project in a lively way.`
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.7 // စကားပြော ပိုသဘာဝကျအောင် တိုးထားတယ်
            })
        });
        const data = await res.json();
        return data.choices[0].message.content;
    } catch (e) {
        return "ခဏလေးနော်ရှင့်၊ Aurora ခေါင်းနည်းနည်း မူးသွားလို့ပါ။ ပြီးမှ ပြန်ပြောကြမလားဟင်? 😊";
    }
}