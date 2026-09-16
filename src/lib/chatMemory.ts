export interface ChatMemory {
  visitorName: string | null;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  conversationHighlights: string[];
  lastTopics: string[];
}

const STORAGE_KEY = 'jay-chat-memory';

const TOPIC_PATTERNS: [RegExp, string][] = [
  [/mindcord/i, 'mindcord'],
  [/workro/i, 'workro'],
  [/goldman/i, 'goldman sachs'],
  [/purduethink/i, 'purduethink'],
  [/infinity|infinitysols/i, 'infinity automated solutions'],
  [/contact|email|phone|linkedin/i, 'contact info'],
  [/project/i, 'projects overview'],
  [/skill|tech|code|python|javascript/i, 'technical skills'],
  [/united\s*airlines/i, 'united airlines'],
  [/careshub|cares hub/i, 'careshub'],
  [/interest|hobby|hobbies/i, 'interests'],
  [/purdue|university|college/i, 'education'],
  [/clickyyy/i, 'clickyyy'],
  [/\bcue\b/i, 'cue'],
  [/localmind/i, 'localmind'],
  [/bucket/i, 'bucket'],
  [/\bpersona\b/i, 'persona cli'],
  [/\bmote\b/i, 'mote'],
  [/brewed/i, 'brewed'],
];

const NAME_PATTERNS = [
  /(?:i'm|i am|my name is|call me|this is)\s+([A-Z][a-z]+)/i,
  /^([A-Z][a-z]+)\s+here/i,
];

function createDefaultMemory(): ChatMemory {
  const now = new Date().toISOString();
  return {
    visitorName: null,
    visitCount: 0,
    firstVisit: now,
    lastVisit: now,
    conversationHighlights: [],
    lastTopics: [],
  };
}

export function loadMemory(): ChatMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...createDefaultMemory(), ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load chat memory:', e);
  }
  return createDefaultMemory();
}

export function saveMemory(memory: ChatMemory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch (e) {
    console.warn('Failed to save chat memory:', e);
  }
}

export function incrementVisit(memory: ChatMemory): ChatMemory {
  return {
    ...memory,
    visitCount: memory.visitCount + 1,
    lastVisit: new Date().toISOString(),
  };
}

export function extractTopics(message: string): string[] {
  const topics: string[] = [];
  for (const [pattern, topic] of TOPIC_PATTERNS) {
    if (pattern.test(message) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }
  return topics;
}

export function detectName(message: string): string | null {
  for (const pattern of NAME_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function addTopics(memory: ChatMemory, topics: string[]): ChatMemory {
  const newHighlights = [...memory.conversationHighlights];
  const newLastTopics = [...memory.lastTopics];

  for (const topic of topics) {
    if (!newLastTopics.includes(topic)) {
      newLastTopics.push(topic);
    }
    if (!newHighlights.includes(topic)) {
      newHighlights.push(topic);
    }
  }

  return {
    ...memory,
    conversationHighlights: newHighlights.slice(-10),
    lastTopics: newLastTopics.slice(-5),
  };
}

export function setVisitorName(memory: ChatMemory, name: string): ChatMemory {
  return { ...memory, visitorName: name };
}

export function buildMemoryContext(memory: ChatMemory): string {
  const parts: string[] = [];

  if (memory.visitCount > 1) {
    const lastDate = new Date(memory.lastVisit).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    parts.push(`this is a returning visitor (visit #${memory.visitCount}, last visited ${lastDate}).`);
  }

  if (memory.visitorName) {
    parts.push(`the visitor's name is ${memory.visitorName}.`);
  }

  if (memory.lastTopics.length > 0) {
    parts.push(`last time they asked about: ${memory.lastTopics.join(', ')}.`);
  }

  if (memory.conversationHighlights.length > 0) {
    parts.push(`previous conversation topics: ${memory.conversationHighlights.join(', ')}.`);
  }

  if (parts.length === 0) return '';

  return parts.join(' ') + '\nif this is a returning visitor, acknowledge them warmly and reference previous topics if relevant. if they shared their name, use it naturally.';
}
