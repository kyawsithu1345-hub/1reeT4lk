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
                // ဒီ ID က လက်ရှိ OpenRouter မှာ အသုံးအများဆုံး Free ID ပါ
                model: "google/gemini-flash-1.5-8b", 
                messages: [
                    { 
                        role: "system", 
                        content: "Your name is Aurora. A 19-year-old girl from Myanmar. You are a sweet companion. Speak natural Myanmar language with 'ရှင်/နော်'." 
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.error) {
            // Error တက်ရင် ဘယ် Model ID ကြောင့်လဲဆိုတာ သိရအောင် error message ကို ပြန်ပို့မယ်
            return `OpenRouter Error (${data.error.code}): ${data.error.message}`;
        }

        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else {
            return "AI က အဖြေပြန်မပေးပါဘူး။ ခဏနေမှ ပြန်စမ်းကြည့်ပါဦးနော်။";
        }
    } catch (e) {
        return "Network Error: " + e.message;
    }
}