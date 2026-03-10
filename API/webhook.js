// api/webhook.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).send('Method not allowed');
    }

    const update = req.body;
    
    // Telegram က message ရလာပြီဆိုရင် အလုပ်လုပ်မယ်
    if (update.message && update.message.audio) {
        const fileId = update.message.audio.file_id;
        const fileName = update.message.audio.file_name || "Unknown";

        // ဒီနေရာမှာ GitHub API နဲ့ array.js ကို update လုပ်မယ့် logic ထည့်ရမှာ
        // လက်ရှိမှာတော့ log ထုတ်ပြီး အလုပ်လုပ်တာကို အတည်ပြုမယ်
        console.log(`Received file: ${fileName} with ID: ${fileId}`);

        return res.status(200).json({ message: "File received successfully!" });
    }

    return res.status(200).send('Webhook active');
}
