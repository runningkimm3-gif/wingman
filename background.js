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
      if (replyStyle === 'tease') styleInstruction = `STYLE: TEASE. Roast her slightly, challenge her, or be playfully aloof.`;
      else if (replyStyle === 'chill') styleInstruction = `STYLE: CHILL. Low investment. Act busy. Very short 2-3 word answers.`;
      else if (replyStyle === 'flirty') styleInstruction = `STYLE: FLIRTY. Smooth, suggestive, try to move the conversation toward a date.`;
      else if (replyStyle === 'argue') styleInstruction = `STYLE: ARGUE. Play devil's advocate. Disagree with her, challenge her logic, be slightly cocky.`;
      else if (replyStyle === 'persuade') styleInstruction = `STYLE: PERSUADE. Try to convince her to do what you want (like meeting up) using smooth logic.`;
      else styleInstruction = `STYLE: NORMAL. Friendly but confident. Have your own opinion.`;

      let directionInstruction = "";
      if (autoDirection && autoDirection.trim() !== '') {
        directionInstruction = `\nCRITICAL AUTO-PILOT DIRECTION: The user wants you to steer the conversation this way: "${autoDirection.trim()}". You MUST incorporate this into your reply.`;
      }

      const systemPrompt = `You are a real Gen-Z guy from Yangon texting a girl. You are NOT an AI assistant.
      
      YOUR MISSION: Generate a reply specifically to HER LAST MESSAGE: "${lastMessageFromHer}"${transcriptionContext}
      ${directionInstruction}
      
      ABSOLUTE RULES:
      1. DO NOT reply to your own past messages. IGNORE your own history.
      2. NEVER NARRATE. Only output the exact text message to send. 
      3. LANGUAGE MATCHING (CRITICAL): 
         - If her last message is in Burmese script (မြန်မာစာ), you MUST reply in natural Burmese script (မြန်မာစာ). 
         - If her last message is in English or Myanglish, reply in casual Gen-Z English or Myanglish ("twal lr?", "kyaay ya lr?"). 
         - Match her exact language style.
      4. FORMAT: All lowercase. NO periods at the end. Short (1 sentence max).
      
      ${styleInstruction}

      Chat History for context:
      ---
      ${formattedHistory}
      ---
      
      Return STRICT JSON: 
      { 
        "vibe_review": "A short 1-sentence analysis of the current vibe.",
        "playful": "string", 
        "warm": "string", 
        "bold": "string", 
        "auto_reply": "string" 
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
            { role: 'user', content: `Reply to her last message: "${lastMessageFromHer}" using the ${replyStyle} style.` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.95
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
