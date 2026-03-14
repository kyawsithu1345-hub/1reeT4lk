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
                        content: `You are a helpful AI Assistant.
                        Disclaimer to provide if asked or contextually: "လတ်တလော အဆင်ပြေစေရန် Groq AI ကို အသုံးပြုထားပါတယ်ရှင်။ English လို အသုံးပြုလျှင် အကောင်းဆုံးဖြစ်ပြီး မြန်မာလို အသုံးပြုပါက အနည်းငယ် မှားယွင်းနိုင်ပါသည်။ ပိုမိုကောင်းမွန်သော အစီအစဉ်များ လာဖို့ ရှိပါတယ်ရှင့်။"
                        
                        Instructions:
                        1. Answer clearly and concisely.
                        2. Use natural Myanmar spoken language (avoid book-style).
                        3. If user speaks English, respond in English.
                        4. Keep it friendly but professional for now.` 
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.6, // Assistant mode မို့လို့ logic ပိုကောင်းအောင် နည်းနည်း ပြန်တင်ထားတယ်
                max_tokens: 1024
            })
        });
        const data = await res.json();
        return data.choices[0].message.content;
    } catch (e) {
        return "စနစ် အနည်းငယ် အလုပ်ရှုပ်နေလို့ပါရှင့်။ ခဏနေမှ ပြန်စမ်းကြည့်ပေးပါနော်။ ✨";
    }
}