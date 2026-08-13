import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  X, 
  Delete, 
  KeyRound, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyPin = (enteredPin: string) => {
    // Secret PIN verification (5313)
    if (enteredPin === '5313') {
      setIsSuccess(true);
      setError(null);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 400);
    } else {
      setError('PIN keselamatan tidak tepat. Sila cuba lagi.');
      setPin('');
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        handleVerifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handleKeyPress(e.key);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center transition-all ${
            isSuccess 
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {isSuccess ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-7 h-7" />}
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            {isSuccess ? 'Akses Dibenarkan' : 'Pengesahan Admin Mode'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Masukkan PIN keselamatan 4-digit untuk membuka kebenaran pengurusan data, import fail, dan muat turun pangkalan data.
          </p>
        </div>

        {/* Hidden physical keyboard capture */}
        <input
          ref={inputRef}
          type="password"
          value={pin}
          onChange={() => {}}
          onKeyDown={handleKeyDown}
          className="opacity-0 absolute -z-10 w-0 h-0"
          autoFocus
        />

        {/* 4-Digit Indicator Display */}
        <div className="flex items-center justify-center space-x-4 py-2">
          {[0, 1, 2, 3].map((index) => {
            const filled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-mono font-bold transition-all ${
                  isSuccess
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 scale-105'
                    : filled
                      ? 'border-emerald-500 bg-emerald-500/10 text-white scale-100 shadow-md shadow-emerald-500/20'
                      : error
                        ? 'border-red-500/80 bg-red-500/10'
                        : 'border-slate-800 bg-slate-950 text-slate-600'
                }`}
              >
                {filled ? '•' : ''}
              </div>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-center space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 py-2 px-3 rounded-xl animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Virtual Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-13 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-500 active:text-slate-950 text-white font-semibold text-lg border border-slate-700/50 shadow-sm transition-all cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-13 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-medium text-xs border border-slate-800 transition-all cursor-pointer flex items-center justify-center"
          >
            Padam
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-13 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-emerald-500 active:text-slate-950 text-white font-semibold text-lg border border-slate-700/50 shadow-sm transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-13 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition-all cursor-pointer flex items-center justify-center"
          >
            <Delete className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center pt-1 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 flex items-center justify-center space-x-1">
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kebenaran Pentadbir & Firebase Owner Sync</span>
          </span>
        </div>
      </div>
    </div>
  );
};
