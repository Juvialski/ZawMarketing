import React, { useState } from 'react';
import { Lock, ArrowRight, EyeOff } from 'lucide-react';

interface ReviewAccessGateProps {
  status: 'not_found' | 'revoked' | 'expired' | 'passcode_required' | 'no_version';
  errorMessage?: string;
  onSubmitPasscode?: (passcode: string) => void;
}

export const ReviewAccessGate: React.FC<ReviewAccessGateProps> = ({
  status,
  errorMessage,
  onSubmitPasscode,
}) => {
  const [passcode, setPasscode] = useState('');

  if (status === 'passcode_required') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-white">Private Campaign Review Room</h1>
            <p className="text-xs text-slate-400 mt-2">
              This marketing review package is passcode-protected. Enter the access code provided by your deal sponsor.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (passcode.trim() && onSubmitPasscode) {
                onSubmitPasscode(passcode.trim());
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode / PIN"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={!passcode.trim()}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>Unlock Review Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Failsafe Generic Inactive Screen (Does NOT leak whether campaign/org exists)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
          <EyeOff className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-bold text-white">
            {status === 'no_version' ? 'Review Package In Preparation' : 'Review Link Not Active'}
          </h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {status === 'no_version'
              ? 'The campaign owner has not published a review package yet. Please check back shortly.'
              : 'This review link is no longer active, has expired, or is invalid. Please contact the campaign owner for an updated link.'}
          </p>
        </div>
      </div>
    </div>
  );
};
