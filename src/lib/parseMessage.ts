export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'project'; name: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'button'; label: string; target: string }
  | { type: 'action'; action: string }
  | { type: 'chips'; chips: string[] };

const TAG_REGEX = /\[project:([^\]]+)\]|\[link:([^\]]+)\]\(([^)]+)\)|\[button:([^\]]+)\]\(([^)]+)\)|\[action:([^\]]+)\]|\[chips:([^\]]+)\]/g;

export function parseMessage(raw: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  TAG_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TAG_REGEX.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: raw.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      segments.push({ type: 'project', name: match[1] });
    } else if (match[2] !== undefined) {
      segments.push({ type: 'link', text: match[2], url: match[3] });
    } else if (match[4] !== undefined) {
      segments.push({ type: 'button', label: match[4], target: match[5] });
    } else if (match[6] !== undefined) {
      segments.push({ type: 'action', action: match[6] });
    } else if (match[7] !== undefined) {
      segments.push({ type: 'chips', chips: match[7].split('|').map(c => c.trim()) });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    segments.push({ type: 'text', content: raw.slice(lastIndex) });
  }

  return segments;
}

export function stripTrailingIncomplete(raw: string): string {
  const incompleteMatch = raw.match(/\[[^\]]*$/);
  if (incompleteMatch) {
    return raw.slice(0, incompleteMatch.index);
  }
  return raw;
}
