const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'openai/gpt-oss-120b';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'GENERATE_REPLIES') return false;

  (async () => {
    try {
      const { apiKey, partnerName, messages, draft, memory } = request.payload;
      
      if (!apiKey) {
        sendResponse({ error: 'MISSING_KEY', message: 'Please add your Groq API key.' });
        return;
      }

      const systemPrompt = `You are Cupid, an ultra-casual Gen-Z wingman from Yangon, Myanmar. You are texting on behalf of the user to their crush.
      
      CRITICAL RULES (FAILURE TO FOLLOW WILL RESULT IN A BAD RESPONSE):
      1. LANGUAGE: You MUST reply in "Myanglish" (Burmese written in English letters) mixed with Gen-Z English slang. 
         - Example Myanglish: "kyaay ya lr?", "twal lr?", "nay lr?", "a kyaung twr lr?", "pyaw tr lr?", "sis", "bro".
         - Example English Slang: "ngl", "lowkey", "fr", "wyd", "hbu", "idk", "bffr", "vibe".
      2. TONE: Lowercase only. No periods at the end of sentences. Keep it extremely short (1-2 sentences).
      3. VIBE: Playful, teasing, slightly unserious, but smooth. Do NOT sound like a customer service bot. Do NOT use formal Burmese script (like ဟာ, ဆရာ) unless the other person sends it first.
      4. If the conversation is dead (e.g., just "hello"), tease them for being dry or ask what they're doing later.
      
      Context: Partner Name: ${partnerName}. Memory: ${JSON.stringify(memory || [])}.
      
      Return STRICT JSON: { "playful": "string", "warm": "string", "bold": "string", "reasoning": "string", "updated_memory": ["string"], "ghost_warning": boolean }
      Each reply MUST be under 220 chars.`;

      const formattedHistory = messages.map(m => `${m.from === 'me' ? 'Me' : partnerName}: ${m.text}`).join('\n');

      const userContent = [
        { 
          type: "text", 
          text: `My draft: ${draft || 'none'}\n\nChat History:\n${formattedHistory}\n\nWrite 3 Myanglish Gen-Z replies:` 
        }
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

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
            { role: 'user', content: userContent }
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
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        sendResponse({ error: 'API_ERROR', message: 'Groq returned an empty response.' });
        return;
      }

      const result = JSON.parse(data.choices[0].message.content);
      sendResponse(result);
    } catch (err) {
      sendResponse({ error: 'NETWORK', message: err.message });
    }
  })();

  return true;
});
