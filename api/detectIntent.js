/**
 * Vercel serverless: chat API for Safari Mixer (OpenAI + session head/body/legs).
 * Env: OPENAI_KEY (or OPENAI_API_KEY) in Vercel Environment Variables.
 */
const OPENAI_KEY = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;

const ANIMALS = [
  'antelope', 'buffalo', 'bunny', 'cat', 'chicken', 'crocodile', 'dinosaur',
  'dog', 'duck', 'elephant', 'flamingo', 'fox', 'frog', 'giraffe', 'goldenlion',
  'gorilla', 'hippo', 'hyena', 'leopard', 'lion', 'lizard', 'monkey', 'ostrich',
  'pig', 'pony', 'puma', 'rhino', 'sheep', 'tiger', 'tortoise', 'unicorn',
  'warthog', 'wildebeest', 'zebra'
];

const STORAGE_BASE = 'https://storage.googleapis.com/animixer-1d266.appspot.com';

const sessions = Object.create(null);

function getSession(sessionId) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = { head: null, body: null, legs: null };
  }
  return sessions[sessionId];
}

function findAnimalInText(text) {
  const lower = text.toLowerCase().replace(/[^a-z\s]/g, ' ');
  for (const a of ANIMALS) {
    const re = new RegExp('\\b' + a.replace(/lion/, 'lion') + '\\b');
    if (re.test(lower)) return a;
  }
  if (/\b(golden\s*lion)\b/.test(lower)) return 'goldenlion';
  return null;
}

function parseChoice(query) {
  const q = query.toLowerCase().trim();
  const animal = findAnimalInText(query);
  if (!animal) return null;
  if (/\bhead\b/.test(q)) return { part: 'head', animal };
  if (/\bbody\b|torso\b/.test(q)) return { part: 'body', animal };
  if (/\blegs?\b|feet\b/.test(q)) return { part: 'legs', animal };
  return { part: null, animal };
}

function parseAllChoices(query) {
  const choices = [];
  const q = query.toLowerCase();
  for (const animal of ANIMALS) {
    const re = new RegExp('\\b' + animal + '\\s+head\\b', 'i');
    if (re.test(q)) choices.push({ part: 'head', animal });
  }
  for (const animal of ANIMALS) {
    const re = new RegExp('\\b' + animal + '\\s+(?:body|torso)\\b', 'i');
    if (re.test(q)) choices.push({ part: 'body', animal });
  }
  for (const animal of ANIMALS) {
    const re = new RegExp('\\b' + animal + '\\s+legs?\\b', 'i');
    if (re.test(q)) choices.push({ part: 'legs', animal });
  }
  if (choices.length) return choices;
  const single = parseChoice(query);
  return single ? [single] : [];
}

function buildAnimalCard(head, body, legs, baseUrl) {
  const title = [head, body, legs].map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-');
  const shareUrl = `${baseUrl}?animal1=${head}&animal2=${body}&animal3=${legs}`;
  const imageUrl = `${STORAGE_BASE}/thumbnails/${head}_${body}_${legs}_thumbnail.png`;
  return {
    result: {
      action: '',
      fulfillment: {
        speech: `Here's your ${title}!`,
        data: {
          google: {
            rich_response: {
              items: [
                {
                  basic_card: {
                    title,
                    image: {
                      url: imageUrl,
                      accessibility_text: title
                    },
                    buttons: [{ open_url_action: { url: shareUrl } }]
                  }
                }
              ]
            }
          }
        }
      }
    }
  };
}

const SAFARI_MIXER_SYSTEM = `You are Safari Mixer: a friendly bot. The user is choosing animal parts: HEAD, BODY, LEGS (in that order). 
Reply in 1 short sentence. After they pick legs (or say "nothing" / "done" when you asked for legs), say something like "Here we go!" or "Ta-da!". 
If they say "hello" or "hi", greet and ask "What head would you like?". If they give a head, ask for body; if body, ask for legs. Use English, be playful.`;

async function openAiChat(query, sessionId) {
  if (!OPENAI_KEY) return null;
  const state = getSession(sessionId);
  const stateLine = `[Current: head=${state.head || '?'} body=${state.body || '?'} legs=${state.legs || '?'}]`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SAFARI_MIXER_SYSTEM + '\n' + stateLine },
        { role: 'user', content: query }
      ],
      max_tokens: 120
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'OpenAI error');
  const raw = data.choices?.[0]?.message?.content ?? null;
  const text = typeof raw === 'string' && raw.trim()
    ? raw.trim()
    : "I didn't catch that. Try something like 'giraffe head' or 'monkey body'!";
  return { result: { action: '', fulfillment: { speech: text, data: {} } } };
}

async function post(req, res) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const query = (body.query || body.text || '').trim();
  const sessionId = body.sessionId || body.session_id || 'animixer-' + Math.random().toString(36).slice(2, 12);

  if (!query) {
    return res.status(400).json({ error: 'Missing or invalid "query" or "text" in body' });
  }

  const state = getSession(sessionId);

  const choices = parseAllChoices(query);
  for (const choice of choices) {
    if (choice.part && choice.animal) {
      state[choice.part] = choice.animal;
    } else if (choice.animal) {
      if (!state.head) state.head = choice.animal;
      else if (!state.body) state.body = choice.animal;
      else if (!state.legs) state.legs = choice.animal;
    }
  }
  if (choices.length === 0) {
    const single = parseChoice(query);
    if (single && single.animal) {
      if (!state.head) state.head = single.animal;
      else if (!state.body) state.body = single.animal;
      else if (!state.legs) state.legs = single.animal;
    }
  }

  const doneWords = /\b(nothing|done|finish|ready|that's all|skip)\b/i.test(query);
  if (doneWords && state.head && state.body && !state.legs) state.legs = state.body;
  if (doneWords && state.head && !state.body) state.body = state.head;

  const baseUrl = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || ('https://' + (process.env.VERCEL_URL || 'animixer.vercel.app'));
  if (state.head && state.body && state.legs) {
    const card = buildAnimalCard(state.head, state.body, state.legs, baseUrl);
    state.head = null;
    state.body = null;
    state.legs = null;
    return res.status(200).json(card);
  }

  if (OPENAI_KEY) {
    try {
      const out = await openAiChat(query, sessionId);
      if (out && out.result) {
        out.result.suggestedPart = !state.body ? 'body' : (!state.legs ? 'legs' : null);
      }
      return res.status(200).json(out);
    } catch (err) {
      console.error('OpenAI chat error:', err);
      return res.status(500).json({ error: err.message || 'OpenAI request failed' });
    }
  }

  return res.status(500).json({
    error: 'Set OPENAI_KEY (or OPENAI_API_KEY) in Vercel Environment Variables'
  });
}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return post(req, res);
};
