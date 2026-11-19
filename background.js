const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// UPGRADED MODEL: Much smarter, understands Myanmar & English nuance perfectly.
const TEXT_MODEL = 'llama-3.3-70b-versatile'; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'GENERATE_REPLIES') return false;

  (async () => {
    try {
      const { apiKey, partnerName, messages, replyStyle, autoDirection, globalStyle } = request.payload;
      
      if (!apiKey) { sendResponse({ error: 'MISSING_KEY', message: 'Please add your Groq API key.' }); return; }
      
      const herMessages = messages.filter(m => m.from === 'them');
      if (herMessages.length === 0) { sendResponse({ error: 'NO_MSG', message: 'She has not sent any messages yet.' }); return; }

      const lastMessageFromHer = herMessages[herMessages.length - 1].text;
      
      // Format chat history clearly
      const formattedHistory = messages.map(m => `${m.from === 'me' ? 'Me' : partnerName}: ${m.text}`).join('\n');

      // Extract user's typing style
      const myCurrentChatMessages = messages.filter(m => m.from === 'me').map(m => m.text);
      let styleContext = "";
      if (myCurrentChatMessages.length >= 3) {
        styleContext = `Here is how the user texts: "${myCurrentChatMessages.slice(-5).join(' | ')}". Mimic this exact capitalization and slang.`;
      } else if (globalStyle && globalStyle.length > 0) {
        styleContext = `Here is how the user texts in general: "${globalStyle.slice(0, 5).join(' | ')}". Mimic this.`;
      } else {
        styleContext = `Use a casual, modern Gen-Z lowercase texting style.`;
      }

      // Define the Vibe
      let styleInstruction = "";
      if (replyStyle === 'tease') styleInstruction = `Playfully roast her, challenge her, or be slightly aloof.`;
      else if (replyStyle === 'chill') styleInstruction = `Low investment, 2-3 words max. Act busy.`;
      else if (replyStyle === 'flirty') styleInstruction = `Smooth, romantic, try to move toward a date.`;
      else if (replyStyle === 'argue') styleInstruction = `Disagree with her, play devil's advocate.`;
      else if (replyStyle === 'persuade') styleInstruction = `Convince her to meet up using smooth logic.`;
      else styleInstruction = `Friendly but confident.`;

      let directionInstruction = "";
      if (autoDirection && autoDirection.trim() !== '') {
        directionInstruction = `\n🚨 OVERRIDE DIRECTIVE: You MUST steer the conversation this way: "${autoDirection.trim()}".`;
      }

      const systemPrompt = `You are a real Gen-Z guy from Yangon texting a girl. You are NOT an AI. You are confident, smooth, and never simp.

      🚨 STYLE MIMICRY: ${styleContext}
      🚨 LANGUAGE: If she texts in Burmese (မြန်မာစာ), reply in natural, casual Burmese script (e.g., ဟာ, ဆရာ, စော်နော်). If she texts in English or Myanglish (e.g., "twal lr?"), reply in English/Myanglish. Match her exact language.
      🚨 FORMAT: All lowercase. NO periods at the end. Extremely short (1 sentence max).

      Chat History for context:
      ---
      ${formattedHistory}
      ---

      Your task is to reply SPECIFICALLY to her last message: "${lastMessageFromHer}"
      
      TONE: ${styleInstruction}
      ${directionInstruction}

      Return STRICT JSON: 
      { 
        "vibe_score": 1-5 (1=cold, 5=flirty),
        "vibe_review": "1 short sentence analyzing her vibe.",
        "playful": "The exact text message to send",
        "warm": "The exact text message to send",
        "bold": "The exact text message to send",
        "auto_reply": "The absolute best, most natural reply"
      }`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); 

      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: TEXT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Reply to her last message.` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.85
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json();
        sendResponse({ error: 'API_ERROR', message: errData.error?.message || `Groq Error: ${response.status}` });
        return;
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      sendResponse(result);
    } catch (err) {
      sendResponse({ error: 'NETWORK', message: err.message });
    }
  })();

  return true;
});
