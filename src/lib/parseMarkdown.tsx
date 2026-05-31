import React from 'react';

/**
 * Strips unclosed markdown delimiters at the end of a streaming string.
 * Prevents partial **bold or *italic from rendering broken markup.
 */
export function stripTrailingMarkdown(text: string): string {
  // Don't strip inside code blocks — they render naturally during streaming
  const fenceCount = (text.match(/```/g) || []).length;
  if (fenceCount % 2 === 1) return text; // unclosed code block, leave as-is

  // Check for unclosed inline code (count single backticks not part of ```)
  const withoutFences = text.replace(/```/g, '');
  const backtickCount = (withoutFences.match(/`/g) || []).length;
  if (backtickCount % 2 === 1) {
    const lastBacktick = text.lastIndexOf('`');
    return text.slice(0, lastBacktick);
  }

  // Check for unclosed bold (**)
  const boldParts = text.split('**');
  if (boldParts.length % 2 === 0) {
    // Odd number of ** means one is unclosed
    const lastBold = text.lastIndexOf('**');
    return text.slice(0, lastBold);
  }

  // Check for unclosed italic (single *)
  // Only match * that aren't part of **
  const withoutBold = text.replace(/\*\*/g, '');
  const starCount = (withoutBold.match(/\*/g) || []).length;
  if (starCount % 2 === 1) {
    const lastStar = text.lastIndexOf('*');
    // Make sure this isn't part of a **
    if (lastStar > 0 && text[lastStar - 1] === '*') return text;
    return text.slice(0, lastStar);
  }

  return text;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      // Bold
      elements.push(<strong key={match.index} className="text-[var(--text-primary)] font-medium">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      // Italic
      elements.push(<em key={match.index}>{match[2]}</em>);
    } else if (match[3] !== undefined) {
      // Inline code
      elements.push(
        <code key={match.index} className="font-mono text-[0.85em] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-1 py-px">
          {match[3]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? elements : [text];
}

function renderLines(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="pl-4 my-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const listMatch = line.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      listItems.push(
        <li key={i} className="list-disc my-0.5">
          {renderInlineFormatting(listMatch[1])}
        </li>
      );
    } else {
      flushList();
      if (line.trim()) {
        elements.push(
          <span key={i}>
            {elements.length > 0 && <br />}
            {renderInlineFormatting(line)}
          </span>
        );
      } else if (i > 0 && i < lines.length - 1) {
        elements.push(<br key={i} />);
      }
    }
  });

  flushList();
  return elements;
}

/**
 * Converts a plain text string to React elements with markdown formatting.
 * Supports: **bold**, *italic*, `inline code`, ```code blocks```, - list items
 */
export function renderMarkdown(text: string): React.ReactNode {
  // Split on code blocks
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      parts.push(...renderLines(text.slice(lastIndex, match.index)));
    }

    // Code block
    parts.push(
      <pre key={`code-${match.index}`} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 my-1.5 overflow-x-auto">
        <code className="font-mono text-[0.8em] leading-relaxed">{match[2]}</code>
      </pre>
    );

    lastIndex = match.index + match[0].length;
  }

  // Check for unclosed code block (streaming)
  const remaining = text.slice(lastIndex);
  const unclosedFence = remaining.indexOf('```');
  if (unclosedFence !== -1) {
    // Text before the unclosed fence
    if (unclosedFence > 0) {
      parts.push(...renderLines(remaining.slice(0, unclosedFence)));
    }
    // Render unclosed code block content
    const langMatch = remaining.slice(unclosedFence + 3).match(/^(\w*)\n?/);
    const codeStart = unclosedFence + 3 + (langMatch ? langMatch[0].length : 0);
    parts.push(
      <pre key="code-unclosed" className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 my-1.5 overflow-x-auto">
        <code className="font-mono text-[0.8em] leading-relaxed">{remaining.slice(codeStart)}</code>
      </pre>
    );
  } else if (remaining) {
    parts.push(...renderLines(remaining));
  }

  if (parts.length === 0) return text;

  return <span className="chat-markdown">{parts}</span>;
}
