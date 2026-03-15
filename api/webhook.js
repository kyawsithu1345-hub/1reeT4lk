export default async function handler(req, res) {
    // POST request မဟုတ်ရင် ပေးမဝင်ဘူး
    if (req.method !== 'POST') {
        return res.status(200).send('Groq AI Engine is Online!');
    }

    try {
        const update = req.body;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const groqKey = process.env.GROQ_API_KEY;

        if (update && update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const userText = update.message.text;

            // Groq AI ဆီက အဖြေတောင်းမယ်
            const aiResponse = await getGroqChat(groqKey, userText);
            
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
        return res.status(200).send('Internal Error');
    }
}

async function getGroqChat(key, message) {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Groq ရဲ့ အမြန်ဆုံး model
                messages: [
                    { role: "system", content: "You are a helpful AI assistant. Answer in the language used by the user." },
                    { role: "user", content: message }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else {
            return "AI Error: " + (data.error ? data.error.message : "No response from Groq");
        }
    } catch (e) {
        return "Network Error: " + e.message;
    }
}