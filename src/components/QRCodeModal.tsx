import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VCARD = `BEGIN:VCARD
VERSION:3.0
N:Katariya;Jay;;;
FN:Jay Katariya
TEL:+17655438168
EMAIL:jkatariy@purdue.edu
URL:https://linkedin.com/in/jkatariya
ORG:Purdue University
TITLE:Integrated Business & Engineering
END:VCARD`;

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (isOpen && !qrUrl) {
      QRCode.toDataURL(VCARD, {
        width: 256,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
      }).then(setQrUrl);
    }
  }, [isOpen, qrUrl]);

  // Lock body scroll on iOS when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/10 backdrop-blur-[3px]"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
          onClick={onClose}
          onTouchMove={(e) => e.preventDefault()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow */}
            <div className="absolute -inset-[3px] bg-gradient-to-r from-[#4facfe] via-[#00f2fe] to-[#f093fb] blur-lg opacity-60 rounded-2xl animate-gradient-xy" />

            <div className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border-primary)] rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-4">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-full hover:bg-[var(--bg-secondary)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {qrUrl && (
                <img
                  src={qrUrl}
                  alt="QR Code - Save Jay's Contact"
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl"
                />
              )}

              <div className="text-center">
                <p className="font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">
                  scan to save my contact
                </p>
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
