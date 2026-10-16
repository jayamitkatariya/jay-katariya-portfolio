import type { ReactNode } from 'react';
import CountUp from './CountUp';

interface AnimatedDescriptionProps {
  text: string;
  className?: string;
}

// Matches numbers like: 10, 9,000, 130k, $1.6K, 100+, 4%, 0.02%
const NUMBER_REGEX = /\b(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)([kKmM%]?\+?)(?![\w,]*\d)/g;

export default function AnimatedDescription({ text, className = '' }: AnimatedDescriptionProps) {
  const elements: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(NUMBER_REGEX.source, NUMBER_REGEX.flags);

  while ((match = regex.exec(text)) !== null) {
    const [raw, digits, suffix] = match;
    // a match glued to letters (e.g. "u-16" is fine, "16th" or "mgmt100" are not numbers to animate)
    const after = text[match.index + raw.length];
    if (after && /[a-z]/i.test(after)) continue;

    if (match.index > lastIndex) {
      elements.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
    elements.push(
      <CountUp
        key={`n-${match.index}`}
        end={parseFloat(digits.replace(/,/g, ''))}
        suffix={suffix}
        decimals={decimals}
        grouping={digits.includes(',')}
        className="font-medium text-[var(--text-primary)]"
      />
    );

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    elements.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <span className={className}>{elements}</span>;
}
