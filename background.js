const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'llama-3.3-70b-versatile'; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'GENERATE_REPLIES') return false;

  (async () => {
    try {
      const { apiKey, partnerName, messages, replyStyle, autoDirection, globalStyle } = request.payload;
      
      if (!apiKey) {
        sendResponse({ error: 'MISSING_KEY', message: 'Please add your Groq API key.' });
        return;
      }

      const herMessages = messages.filter(m => m.from === 'them');
      if (herMessages.length === 0) {
        sendResponse({ error: 'NO_MSG', message: 'She has not sent any messages yet.' });
        return;
      }
      
      const lastMessageFromHer = herMessages[herMessages.length - 1].text;
      const formattedHistory = messages.map(m => `${m.from === 'me' ? 'Me' : partnerName}: ${m.text}`).join('\n');

      // REDUCE GLOBAL STYLE SIZE to prevent token limits
      let styleContext = "";
      const myCurrentChatMessages = messages.filter(m => m.from === 'me').map(m => m.text);
      
      if (myCurrentChatMessages.length > 2) {
        styleContext = `Here is how the user has been texting in THIS chat: "${myCurrentChatMessages.slice(-5).join(' | ')}"`;
      } else if (globalStyle && globalStyle.length > 0) {
        // Only take the last 5 messages to save tokens
        styleContext = `This is a new chat, but here is how the user texts in general from other chats: "${globalStyle.slice(0, 5).join(' | ')}"`;
      } else {
        styleContext = `No past style available. Just use a casual Gen-Z tone.`;
      }

      let styleInstruction = "";
      if (replyStyle === 'tease') styleInstruction = `Playfully roast her or challenge her (ဟာဆရာ style).`;
      else if (replyStyle === 'chill') styleInstruction = `Low investment, unbothered, very short.`;
      else if (replyStyle === 'flirty') styleInstruction = `Smooth, romantic, try to move toward a date.`;
      else if (replyStyle === 'argue') styleInstruction = `Disagree with her, play devil's advocate, be slightly cocky.`;
      else if (replyStyle === 'persuade') styleInstruction = `Convince her to do what you want (like meeting up).`;
      else styleInstruction = `Friendly but confident.`;

      let directionInstruction = "";
      if (autoDirection && autoDirection.trim() !== '') {
        directionInstruction = `\n🚨 OVERRIDE DIRECTIVE: You MUST steer the conversation this way: "${autoDirection.trim()}".`;
      }

      const systemPrompt = `You are a real Gen-Z guy from Yangon texting a girl. You are NOT an AI assistant.
      
      MIMIC THE USER'S STYLE: ${styleContext}
      
      Chat History for context:
      ---
      ${formattedHistory}
      ---
      
      Your task is to reply to HER LAST MESSAGE: "${lastMessageFromHer}"
      
      STRICT RULES:
      1. ONLY OUTPUT THE RAW TEXT MESSAGE. Do not put quotes around it.
      2. NEVER NARRATE. 
      3. LANGUAGE MATCHING: If she texts in Burmese (မြန်မာစာ), reply in Burmese script. If she texts in English, reply in English.
      4. CASUAL BURMESE: If replying in Burmese, use modern Gen-Z Burmese slang.
      5. FORMAT: All lowercase. NO periods at the end. Extremely short (1 sentence max).
      
      TONE: ${styleInstruction}
      ${directionInstruction}
      
      Return STRICT JSON: 
      { 
        "vibe_review": "A short 1-sentence analysis of the current vibe.",
        "playful": "The exact text message to send", 
        "warm": "The exact text message to send", 
        "bold": "The exact text message to send", 
        "auto_reply": "The exact text message to send" 
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
      
      // CATCH JSON PARSE ERRORS
      try {
        const result = JSON.parse(data.choices[0].message.content);
        sendResponse(result);
      } catch (parseError) {
        console.error("Cupid Parse Error: The AI did not return valid JSON.", data.choices[0].message.content);
        sendResponse({ error: 'PARSE_ERROR', message: 'The AI returned a malformed response. Try again.' });
      }
      
    } catch (err) {
      sendResponse({ error: 'NETWORK', message: err.message });
    }
  })();

  return true;
});
