import { motion } from 'motion/react';
import { User, FolderOpen, Mail, Sparkles, RefreshCw, MessageCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface WelcomeCard {
  icon: LucideIcon;
  title: string;
  description: string;
  message: string | null;
}

interface WelcomeCardsProps {
  isReturning: boolean;
  visitorName: string | null;
  onSendMessage: (text: string) => void;
  onFocusInput: () => void;
}

const FIRST_VISIT_CARDS: WelcomeCard[] = [
  { icon: User, title: 'about jay', description: 'who he is and what he does', message: 'what does jay do?' },
  { icon: FolderOpen, title: 'projects', description: 'startups, consulting, and builds', message: "tell me about jay's projects" },
  { icon: Mail, title: 'contact', description: 'ways to reach out to jay', message: 'how can i contact jay?' },
  { icon: Sparkles, title: 'skills', description: 'tech stack and expertise', message: "what are jay's skills?" },
];

function getReturningCards(name: string | null): WelcomeCard[] {
  return [
    { icon: RefreshCw, title: 'catch up', description: name ? `hey ${name}, what's new` : "what's on your mind", message: name ? `hey ${name}, what's new?` : "welcome back! what's on your mind?" },
    { icon: FolderOpen, title: 'latest work', description: 'recent projects and updates', message: "tell me about jay's latest work" },
    { icon: Sparkles, title: "what's changed", description: 'anything new since last time', message: 'anything new since last time?' },
    { icon: MessageCircle, title: 'free ask', description: 'ask anything you want', message: null },
  ];
}

export default function WelcomeCards({ isReturning, visitorName, onSendMessage, onFocusInput }: WelcomeCardsProps) {
  const cards = isReturning ? getReturningCards(visitorName) : FIRST_VISIT_CARDS;

  return (
    <div className="flex flex-col gap-3 py-2">
      <p className="font-mono text-xs text-[var(--text-tertiary)] mb-1">
        {isReturning ? 'welcome back...' : 'try asking...'}
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((card, i) => (
          <motion.button
            key={card.title}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.08 + i * 0.07,
              duration: 0.35,
              ease: [0.23, 1, 0.32, 1],
            }}
            onClick={() => card.message ? onSendMessage(card.message) : onFocusInput()}
            className="group flex flex-col items-start gap-2 p-3.5
                       border border-[var(--border-primary)] rounded-xl
                       bg-[var(--bg-primary)]/40 backdrop-blur-sm
                       hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]
                       hover:shadow-md
                       active:scale-[0.97] active:bg-[var(--bg-tertiary)]
                       transition-all duration-200 text-left"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg
                            bg-gradient-to-br from-[#4facfe]/10 via-[#00f2fe]/10 to-[#f093fb]/10
                            border border-[var(--border-secondary)]
                            group-hover:from-[#4facfe]/20 group-hover:via-[#00f2fe]/20 group-hover:to-[#f093fb]/20
                            transition-all duration-300">
              <card.icon
                size={16}
                className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-200"
              />
            </div>

            <span className="font-mono text-xs text-[var(--text-primary)] leading-tight">
              {card.title}
            </span>

            <span className="font-mono text-[10px] text-[var(--text-tertiary)] leading-snug line-clamp-1">
              {card.description}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
