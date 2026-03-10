// api/webhook.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Method not allowed');
    }

    const update = req.body; // Telegram ဆီကလာတဲ့ Data
    const token = process.env.TELEGRAM_BOT_TOKEN; // Vercel ထဲက Token

    // ၁။ သီချင်းဟုတ်မဟုတ် စစ်ဆေးခြင်း
    if (update.message && update.message.audio) {
        const fileId = update.message.audio.file_id;
        const title = update.message.audio.title || "Unknown Title";

        // ၂။ GitHub ကို အချက်အလက် ပို့မယ့်အပိုင်း (နောက်မှ ဆက်ရေးမယ်)
        console.log(`သီချင်းအသစ်: ${title}, ID: ${fileId}`);
        
        // ၃။ Telegram ဆီ ပြန် reply ပေးခြင်း
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: update.message.chat.id,
                text: "သီချင်းဖိုင် ရောက်ရှိပါပြီ။ Site ပေါ် တင်ပေးနေပါပြီ..."
            })
        });
    }

    return res.status(200).send('OK');
          }
