async function getOpenRouterChat(key, message) {
    // လက်ရှိ အလုပ်လုပ်နေတဲ့ Model IDs စာရင်း
    const models = [
        "google/gemini-flash-1.5-8b", 
        "meta-llama/llama-3.1-8b-instruct",
        "meta-llama/llama-3-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "openrouter/auto" // ဒါက နောက်ဆုံးလက်နက် (သူ့ဘာသာသူ ရွေးခိုင်းတာ)
    ];

    for (const modelId of models) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        { role: "system", content: "Your name is Aurora. A 19-year-old girl from Myanmar. Speak sweet Myanmar language." },
                        { role: "user", content: message }
                    ]
                })
            });

            const data = await response.json();

            // 404 (ရှာမတွေ့) သို့မဟုတ် Quota ပြည့်ရင် နောက် model တစ်ခုကို ကူးမယ်
            if (data.error && (data.error.code === 404 || data.error.code === 429)) {
                continue; 
            }

            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            }
        } catch (e) {
            continue;
        }
    }
    return "စိတ်မကောင်းပါဘူးရှင်။ Aurora ရဲ့ စနစ်တွေ အကုန်လုံး အလုပ်မလုပ်ဖြစ်နေလို့ ခဏနေမှ ပြန်လာခဲ့ပါနော်။";
}