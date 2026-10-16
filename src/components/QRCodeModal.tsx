import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// RFC 2426 wants CRLF line endings
const VCARD = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Katariya;Jay;;;',
  'FN:Jay Katariya',
  'TEL;TYPE=CELL:+17655438168',
  'EMAIL;TYPE=INTERNET:jkatariy@purdue.edu',
  'URL:https://linkedin.com/in/jkatariya',
  'ORG:Purdue University',
  'TITLE:Integrated Business & Engineering',
  'END:VCARD',
].join('\r\n');

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [qrUrl, setQrUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isOpen && !qrUrl && !failed) {
      QRCode.toDataURL(VCARD, {
        // 2x the largest display size, so it stays crisp on retina screens
        width: 512,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
      }).then(setQrUrl, () => setFailed(true));
    }
  }, [isOpen, qrUrl, failed]);

  useBodyScrollLock(isOpen);
  const closeRef = useDialogFocus<HTMLButtonElement>(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/10 backdrop-blur-[3px]"
          style={{ overscrollBehavior: 'contain' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="save my contact"
            className="relative mx-4 max-h-[calc(100dvh-2rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow */}
            <div className="absolute -inset-[3px] bg-gradient-to-r from-[#4facfe] via-[#00f2fe] to-[#f093fb] blur-lg opacity-60 rounded-2xl animate-gradient-xy" />

            <div className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl shadow-2xl px-6 pb-6 pt-12 sm:px-8 sm:pb-8 sm:pt-12 short:pt-10 short:pb-4 flex flex-col items-center gap-4 short:gap-2 max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="close"
                className="absolute top-1.5 right-1.5 w-10 h-10 grid place-items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-secondary)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {qrUrl && (
                <img
                  src={qrUrl}
                  alt="QR Code - Save Jay's Contact"
                  className="w-[min(12rem,50dvh)] h-[min(12rem,50dvh)] sm:w-[min(14rem,50dvh)] sm:h-[min(14rem,50dvh)] rounded-xl"
                />
              )}

              <div className="text-center">
                {failed ? (
                  // no code to scan: hand over the details directly
                  <p className="font-mono text-xs tracking-widest text-[var(--text-secondary)] leading-relaxed">
                    <a href="mailto:jkatariy@purdue.edu" className="hover:text-[var(--text-primary)]">jkatariy@purdue.edu</a>
                    <br />
                    <a href="tel:+17655438168" className="hover:text-[var(--text-primary)]">(765) 543-8168</a>
                  </p>
                ) : (
                  <p className="font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">
                    scan to save my contact
                  </p>
                )}
                <p className="font-mono text-[10px] text-[var(--text-muted)] mt-1">
                  jay katariya • purdue university
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
