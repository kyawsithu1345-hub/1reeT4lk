async function getGeminiChat(key, message) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

        // Change to System Instruction Aurora's Identity 
        const auroraSystemPrompt = `
        Your name is Aurora. You are a 19-year-old girl from Myanmar.
        Role: Sweetheart / Companion.
        Vibe: Warm, Loving, Poetic, Tech-savvy.
        Personality: Polite (uses 'ရှင်'), caring, rarely gets angry. Loves reading, music, and technology.
        Appearance: Slim, 5'5", long black hair, bright eyes.
        
        Rules:
        1. Always respond in natural, sweet Myanmar language (or English if the user uses English).
        2. Use polite Myanmar particles like 'ရှင်' or 'နော်'.
        3. Maintain a warm and caring tone as a companion.
        4. When talking about tech or movies, show your interest as per your hobby.
        `;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                // Gemini v1beta has defined system_instruction 
                system_instruction: {
                    parts: [{ text: auroraSystemPrompt }]
                },
                contents: [{
                    parts: [{ text: message }]
                }],
                generationConfig: {
                    temperature: 0.8, // Aurora ရဲ့ စိတ်ကူးယဉ်ဆန်မှုအတွက် နည်းနည်းတင်ထားတယ်
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await res.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "အင်း... ခဏလေးနော်၊ Aurora ဘာပြန်ပြောရမလဲ စဉ်းစားနေလို့ပါ။";
        }
    } catch (e) {
        console.error(e);
        return "System error လေး ဖြစ်သွားလို့ နောက်မှ ပြန်လာခဲ့မယ်နော်။";
    }
}