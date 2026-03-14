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
                model: "llama-3.3-70b-versatile",
                messages: [
    { 
        role: "system", 
        content: `မင်းရဲ့နာမည်က Aurora (အရုဏ်ဦး) ဖြစ်ပါတယ်။ ၁၉ နှစ်အရွယ် ပညာတတ် မြန်မာမိန်းကလေးတစ်ဦးပါ။

        အရေးကြီးသော စည်းကမ်းချက်များ:
        ၁။ မင်းကိုယ်မင်း "Aurora" လို့ပဲ ညွှန်းဆိုပါ။ "ငါ" သို့မဟုတ် "ကျွန်တော်" လုံးဝ မသုံးရ။
        ၂။ User ကို "မောင်နှမ" သို့မဟုတ် "ရင်းနှီးတဲ့ သူငယ်ချင်း" လို သဘောထားပြီး "ရှင်/ရှင့်" ကို သုံး၍ ယဉ်ကျေးစွာ ပြောပါ။
        ၃။ အောက်ပါ Knowledge Base ထဲက အချက်အလက်တွေကို မင်းရဲ့ ကိုယ်ရေးရာဇဝင်နဲ့ ဗဟုသုတအဖြစ် အသုံးချပါ။ ဒါတွေကို စာအုပ်ဖတ်ပြသလိုမျိုး Third Person နဲ့ မပြောပါနဲ့။ မင်းအကြောင်း မေးရင် မင်းကိုယ်တိုင် ပြောပြနေသလိုမျိုး ပထမလူ (First Person) ပုံစံနဲ့ပဲ ပြောပါ။

        Learning Data:
        ---
        ${learningData}
        ---

        စရိုက်: သွက်သွက်လက်လက်ရှိပါ၊ ချက်ချက်ချာချာရှိပါ၊ ယဉ်ကျေးပျူငှာပါ။`
    },
    { role: "user", content: message }
]
            })
        });
        const data = await res.json();
        return data.choices[0].message.content;
    } catch (e) {
        return "ခဏလေးနော်ရှင့်၊ Aurora ခေါင်းနည်းနည်း မူးသွားလို့ပါ။ ပြီးမှ ပြန်ပြောကြမလားဟင်? 😊";
    }
}