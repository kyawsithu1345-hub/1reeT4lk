async function getGeminiChat(key, message) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        
        const auroraSystemPrompt = "Your name is Aurora. A 19-year-old girl from Myanmar. Use 'ရှင်' and 'နော်'. Be warm and poetic.";

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: auroraSystemPrompt }] },
                contents: [{ parts: [{ text: message }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 1000
                },
                // Safety Settings ကို အကုန် လျှော့ချလိုက်တာပါ
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        const data = await res.json();

        if (data.candidates && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            // Log ထဲမှာ ဘာ Error ပြလဲဆိုတာကို Telegram မှာပါ တစ်ခါတည်း မြင်ရအောင် လုပ်လိုက်မယ်
            console.error("Gemini Error Detail:", JSON.stringify(data));
            return "AI က အဖြေမထုတ်ပေးနိုင်ဘူးဖြစ်နေတယ် (Safety Block ဖြစ်နိုင်ပါတယ်)။ Log ကို စစ်ကြည့်ပါဦး။";
        }
    } catch (e) {
        return "စနစ်ချို့ယွင်းချက်ရှိနေလို့ ခဏနေမှ ပြန်လာခဲ့ပါဦးနော်။";
    }
}