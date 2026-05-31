import type { ReactNode } from 'react';
import CountUp from './CountUp';

interface AnimatedDescriptionProps {
  text: string;
  className?: string;
}

// Matches numbers like: 10, 130k, 500k, 100+, 4%, 0.02%, 0.02
const NUMBER_REGEX = /\b\d+(?:\.\d+)?(?:k|m|%)?\+?\b/gi;

export default function AnimatedDescription({ text, className = '' }: AnimatedDescriptionProps) {
  const elements: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let matchCount = 0;

  const regex = new RegExp(NUMBER_REGEX.source, NUMBER_REGEX.flags);

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      elements.push(
        <span key={`t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }

    const raw = match[0];
    const lower = raw.toLowerCase();

    // Parse the number value
    let numericValue: number;
    let suffix = '';

    if (lower.includes('k')) {
      const num = parseFloat(lower.replace(/[k+%]/g, ''));
      numericValue = num;
      suffix = 'k' + (lower.includes('+') ? '+' : '');
    } else if (lower.includes('m')) {
      const num = parseFloat(lower.replace(/[m+%]/g, ''));
      numericValue = num;
      suffix = 'm' + (lower.includes('+') ? '+' : '');
    } else if (lower.includes('%')) {
      const num = parseFloat(lower.replace(/[%+]/g, ''));
      numericValue = num;
      suffix = '%' + (lower.includes('+') ? '+' : '');
    } else if (lower.includes('+')) {
      numericValue = parseFloat(lower.replace('+', ''));
      suffix = '+';
    } else {
      numericValue = parseFloat(lower);
    }

    if (!isNaN(numericValue)) {
      const decimals = lower.includes('.') ? 2 : 0;
      elements.push(
        <span key={`n-${match.index}`}>
          <CountUp
            end={numericValue}
            suffix={suffix}
            decimals={decimals}
            className="font-medium text-[var(--text-primary)]"
          />
        </span>
      );
    } else {
      elements.push(<span key={`n-${match.index}`}>{raw}</span>);
    }

    lastIndex = regex.lastIndex;
    matchCount++;
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    elements.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <span className={className}>{elements}</span>;
}
