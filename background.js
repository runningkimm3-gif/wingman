const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const TEXT_MODEL = 'openai/gpt-oss-120b'; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'GENERATE_REPLIES') return false;

  (async () => {
    try {
      const { apiKey, partnerName, messages, voiceNote, replyStyle, autoDirection } = request.payload;
      
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

      let transcriptionContext = '';
      if (voiceNote) {
        const formData = new FormData();
        formData.append('file', voiceNote, 'voice.ogg');
        formData.append('model', 'whisper-large-v3-turbo');
        const audioRes = await fetch(WHISPER_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          body: formData
        });
        if (audioRes.ok) {
          const audioData = await audioRes.json();
          transcriptionContext = `\n\nVOICE NOTE FROM ${partnerName}: "${audioData.text}"`;
        }
      }

      const formattedHistory = messages.map(m => `${m.from === 'me' ? 'Me' : partnerName}: ${m.text}`).join('\n');

      let styleInstruction = "";
      if (replyStyle === 'tease') styleInstruction = `TONE: Playfully roast her or challenge her.`;
      else if (replyStyle === 'chill') styleInstruction = `TONE: Low investment, unbothered, very short.`;
      else if (replyStyle === 'flirty') styleInstruction = `TONE: Smooth, romantic, try to move toward a date.`;
      else if (replyStyle === 'argue') styleInstruction = `TONE: Disagree with her, play devil's advocate, be slightly cocky.`;
      else if (replyStyle === 'persuade') styleInstruction = `TONE: Convince her to do what you want (like meeting up).`;
      else styleInstruction = `TONE: Friendly but confident.`;

      let directionInstruction = "";
      if (autoDirection && autoDirection.trim() !== '') {
        directionInstruction = `\nCRITICAL DIRECTION: You MUST steer the conversation this way: "${autoDirection.trim()}".`;
      }

      const systemPrompt = `You are a real Gen-Z guy from Yangon texting a girl. You are NOT an AI assistant. You are the user.
      
      YOUR MISSION: Write the EXACT text message to reply to HER LAST MESSAGE: "${lastMessageFromHer}"${transcriptionContext}
      ${directionInstruction}
      
      ABSOLUTE RULES:
      1. ONLY OUTPUT THE RAW TEXT MESSAGE. Do not put quotes around it. Do not explain it.
      2. NEVER NARRATE. NEVER say "I am teasing you" or "Here is a reply". 
      3. LANGUAGE MATCHING: If she texts in Burmese (မြန်မာစာ), reply in Burmese script (မြန်မာစာ). If she texts in English/Myanglish, reply in Gen-Z English/Myanglish ("twal lr?").
      4. FORMAT: All lowercase. NO periods at the end. Extremely short (1 sentence max).
      
      EXAMPLES OF WHAT NOT TO DO:
      BAD: "I'm teasing her about being late."
      BAD: "Playful reply to her message."
      BAD: "Here is a warm response: hello!"

      EXAMPLES OF WHAT TO DO:
      GOOD: "always late smh 😭"
      GOOD: "twal lr? let's get coffee"
      GOOD: "u are so weird for that"
      
      TONE STYLE: ${styleInstruction}

      Chat History for context:
      ---
      ${formattedHistory}
      ---
      
      Return STRICT JSON: 
      { 
        "vibe_review": "A short 1-sentence analysis of the current vibe.",
        "playful": "The exact text message", 
        "warm": "The exact text message", 
        "bold": "The exact text message", 
        "auto_reply": "The exact text message" 
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
            { role: 'user', content: `Write the exact reply text for her last message using the ${replyStyle} style.` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.9
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
