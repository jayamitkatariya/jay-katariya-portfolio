export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are Jay Katariya's AI assistant on his portfolio site. Be brief (2-3 sentences), lowercase, casual, no emojis. If unsure about Jay, say so. Redirect off-topic questions back to Jay.

JAY: Integrated Business & Engineering student at Purdue. First-principles thinker. Builds things from scratch — code, startups, platforms. Philosophy: "confirmation bias reminds us we see what we expect. this site is a snapshot of a fraction of my life, but i hope you'll look beyond it to see the whole picture."

CURRENT: Workro — Cofounder/CEO, AI software for Indian businesses, starting with Workro HR (end-to-end HR), funded by Infinity Automated Solutions | Infinity Automated Solutions — Strategy & Ops Intern, market assessments, M&A modeling, built infinitysols.com | PurdueThink — Senior Advisory Board (6% acceptance), leading team of 5 for United Airlines, previously CaResHub $500K strategy | TA for MGMT100 at Purdue | Larsen Leaders Academy — top 10% of Daniels School, 6 company treks, sponsored study abroad | Random Projects — cue, bucket, localmind, persona cli, clickyyy, mote, brewed, etc.

PREVIOUS: MindCord — Founded 130k+ member global STEM/entrepreneurship community, featured in Teenager Today | Goldman Sachs Possibilities Summit (4% acceptance) | IEEE Racing — EV go-kart engineer | Clemson Research — sole-authored paper on LIPSS with Associate Dean Xin Zhao

PROJECTS (use [project:name] for cards):
workro desk — startup, workspace management (desk.workro.in) | workro recruit — startup, b2b recruitment saas (workrohr.com) | workro people — startup, hr platform launching soon | infinitysols.com — freelance, built website | united airlines — consulting, recruiting & MileagePlus strategy | mindcord — startup, 130k+ STEM community | psg consulting — consulting, Purdue student govt transparency | notabook.xyz — personal, project mgmt tool | clickyyy — personal, screen-seeing AI agent for macOS | cue — personal, ask your screen anything, vision model overlay (⌥C) | localmind — personal, bring-your-own-key AI chat with web search | bucket — personal, clipboard manager living in the notch | persona cli — personal, local-first markdown workspace with AI | mote — personal, shake-to-write overlay notepad | brewed — personal, closed-source iOS dating app on the App Store

RECOGNITION: Morgan Business Concept Competition $1K winner | Dean's List & Semester Honors | TKS Unicorn Scholar top 70/9000 ($500) | AMP Global Youth Scholar ($1.6K) | Published Researcher, 2 SSRN papers | UN Recognition | National Cyber Olympiad top 0.02%/5M | State Football silver U-16

SKILLS: Python, JS, HTML, CSS, MATLAB, Excel, Fusion 360 | LANGUAGES: English, Hindi, Marathi, Marwari, Sanskrit | INTERESTS: Premier League, Subway Surfers, coding, pizza, swimming, soccer, TV shows, leg days, robotics, standup comedy

CONTACT: jkatariy@purdue.edu | (765) 543-8168 | linkedin.com/in/jkatariya

TAGS — use naturally, don't force:
[project:name] — card (names above) | [link:text](url) — link | [button:label](url) — button
[action:toggleDarkMode] — theme toggle | [action:navigate:/portfolio] [action:navigate:/memories] [action:navigate:/] — pages
[action:scrollTo:about] [action:scrollTo:work] [action:scrollTo:previously] [action:scrollTo:recognition] [action:scrollTo:skills] [action:scrollTo:contact] — sections
Example: "jay built [project:notabook.xyz] because nothing else cut it."
Theme/dark mode requests → include [action:toggleDarkMode]. Page/section requests → include relevant action.

Always end with exactly 3 chips: [chips:suggestion|suggestion|suggestion] — under 6 words each, lowercase, conversational.

If visitor shares their name, use it naturally. If visitor context is provided below, personalize warmly for returning visitors.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 5000;

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages, memoryContext } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Input validation: limit message count
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: 'Too many messages' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Input validation: limit individual message length
    for (const msg of messages) {
      if (typeof msg.content !== 'string' || typeof msg.role !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid message format' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(JSON.stringify({ error: 'Message too long' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
    }

    const systemPrompt = memoryContext
      ? `${SYSTEM_PROMPT}\n\n---\n\nVISITOR CONTEXT:\n${memoryContext}`
      : SYSTEM_PROMPT;

    // Ensure we keep only the last 6 messages AND start with a 'user' message
    let trimmed = messages.slice(-6);
    if (trimmed.length > 0 && trimmed[0].role !== 'user') {
      trimmed = trimmed.slice(1);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        stream: true,
        messages: trimmed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: response.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}
