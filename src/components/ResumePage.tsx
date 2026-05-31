import { motion } from 'motion/react';
import { Download, FileText, ExternalLink, GraduationCap, Briefcase, Award, Code } from 'lucide-react';

const RESUME_URL = '/jay-katariya-resume.pdf';

const highlights = [
  {
    icon: Briefcase,
    label: 'experience',
    color: 'text-blue-500',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    items: [
      'co-founder & ceo @ workro',
      'senior advisory board @ purduethink',
      'corporate strategy intern @ infinity',
      'possibilities summit @ goldman sachs',
    ],
  },
  {
    icon: GraduationCap,
    label: 'education',
    color: 'text-violet-500',
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/5',
    items: [
      'b.s. integrated business & engineering',
      'minor in psychology',
      'certificate in entrepreneurship & innovation',
      "dean's list & semester honors",
    ],
  },
  {
    icon: Award,
    label: 'recognition',
    color: 'text-amber-500',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    items: [
      'morgan business concept competition winner',
      'tks unicorn scholar — top 70 of 9,000+',
      '2 published research papers on SSRN',
      'national cyber olympiad — top 0.02%',
    ],
  },
  {
    icon: Code,
    label: 'technical',
    color: 'text-emerald-500',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    items: [
      'javascript, react, react native',
      'python, node.js, postgresql',
      'rest apis, html/css',
      'excel, matlab, fusion 360',
    ],
  },
];

export default function ResumePage() {
  return (
    <div className="min-h-screen pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="mb-10 sm:mb-14"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-3 sm:mb-4">
            resume
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light max-w-lg mb-8 sm:mb-10">
            the full picture in one page. download it or open in a new tab.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={RESUME_URL}
              download="Jay_Katariya_Resume.pdf"
              className="group inline-flex items-center gap-2.5 px-6 py-3 sm:px-8 sm:py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-mono text-xs sm:text-sm tracking-wide hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--text-primary)]/10"
            >
              <Download className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
              download resume
            </a>
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-6 py-3 sm:px-8 sm:py-3.5 border border-[var(--border-primary)] rounded-xl font-mono text-xs sm:text-sm tracking-wide text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-tertiary)] transition-all duration-300"
            >
              <ExternalLink className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              open in new tab
            </a>
          </div>
        </motion.div>

        {/* Highlights Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 sm:mb-14"
        >
          <h2 className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--text-tertiary)] uppercase mb-5 sm:mb-6">
            at a glance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((section, i) => (
              <motion.div
                key={section.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                className={`group p-5 sm:p-6 rounded-2xl border ${section.border} ${section.bg} hover:shadow-sm transition-all duration-300`}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <section.icon className={`w-4 h-4 ${section.color}`} />
                  <span className={`font-mono text-xs tracking-widest ${section.color} font-medium`}>
                    {section.label}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className={`mt-1.5 w-1 h-1 rounded-full ${section.color} opacity-40 shrink-0`} />
                      <span className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Document Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <a
            href={RESUME_URL}
            download="Jay_Katariya_Resume.pdf"
            className="group flex items-center gap-4 sm:gap-5 p-5 sm:p-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--text-tertiary)] transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm sm:text-base text-[var(--text-primary)] font-medium truncate">
                Jay_Katariya_Resume.pdf
              </p>
              <p className="font-mono text-[10px] sm:text-xs text-[var(--text-tertiary)] mt-0.5 tracking-wide">
                PDF document — click to download
              </p>
            </div>
            <Download className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-all duration-300 group-hover:-translate-y-0.5 shrink-0" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}
