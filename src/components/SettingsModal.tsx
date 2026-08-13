import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Radio, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink, 
  Info,
  Server,
  Save
} from 'lucide-react';
import { WhatsAppConfig } from '../types';

interface SettingsModalProps {
  config: WhatsAppConfig | null;
  onUpdateConfig: (newConfig: Partial<WhatsAppConfig> & { apiToken?: string }) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState(config?.phoneNumberId || '');
  const [businessAccountId, setBusinessAccountId] = useState(config?.businessAccountId || '');
  const [mode, setMode] = useState<'LIVE' | 'SIMULATION_TEST'>(config?.mode || 'SIMULATION_TEST');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhook/whatsapp` 
    : 'https://ais-.../api/webhook/whatsapp';

  const handleCopy = (text: string, type: 'webhook' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'webhook') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateConfig({
        apiToken: tokenInput.trim() || undefined,
        phoneNumberId: phoneNumberId.trim(),
        businessAccountId: businessAccountId.trim(),
        mode,
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            System Configuration
          </span>
          <span className="text-xs text-slate-400">Meta Graph API v21.0</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center space-x-3">
          <Settings className="w-8 h-8 text-emerald-400" />
          <span>Konfigurasi WhatsApp Cloud API</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Tetapkan kelayakan rasmi WhatsApp Business Platform atau gunakan Mod Ujian Berkelajuan Tinggi.
        </p>
      </div>

      {/* Mode Selector Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Radio className="w-5 h-5 text-emerald-400" />
          <span>Mod Operasi Sistem</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setMode('SIMULATION_TEST')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
              mode === 'SIMULATION_TEST'
                ? 'bg-emerald-500/10 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-400">Mod Simulasi & Ujian (Ready-to-Use)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Aktif</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Menghantar mesej dan dokumen PDF melalui antrian tempatan dengan kitaran status penghantaran masa nyata (Sent → Delivered → Read). Sesuai untuk demonstrasi dan ujian segera.
            </p>
          </div>

          <div
            onClick={() => setMode('LIVE')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
              mode === 'LIVE'
                ? 'bg-emerald-500/10 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white">Live Meta WhatsApp Cloud API</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">Production</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Menghubungkan terus ke pelayan Meta Graph API untuk menghantar dokumen dan mesej sebenar ke nombor telefon penerima.
            </p>
          </div>
        </div>
      </div>

      {/* Meta API Credentials Form */}
      <form onSubmit={handleSave} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Key className="w-5 h-5 text-emerald-400" />
          <span>Kredensial Meta Developer Portal</span>
        </h3>

        <div className="space-y-4 text-sm">
          <div>
            <label className="text-xs text-slate-300 block mb-1">
              WhatsApp Permanent / System User Access Token
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={config?.hasToken ? "•••••••••••••••••••••••• (Tersimpan)" : "EAAG..."}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Didapati dari Meta for Developers &gt; WhatsApp &gt; API Setup
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="Contoh: 104598234123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">
                WhatsApp Business Account ID (WABA)
              </label>
              <input
                type="text"
                value={businessAccountId}
                onChange={(e) => setBusinessAccountId(e.target.value)}
                placeholder="Contoh: 204918239019283"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>Tetapan sistem berjaya disimpan.</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
          </button>
        </div>
      </form>

      {/* Webhook Guide Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <span>Webhook Status Penyerahan (Delivery Tracking)</span>
          </h3>
          <span className="text-xs text-slate-400">Penyelarasan Automatik</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Daftarkan URL Webhook ini di Meta Developer Portal untuk membolehkan sistem menerima kemas kini masa nyata (Sent, Delivered, Read, Failed) secara terus.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Callback URL Webhook:</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-300 font-mono text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(webhookUrl, 'webhook')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                {copiedWebhook ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWebhook ? 'Disalin' : 'Salin URL'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Verify Token:</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={config?.webhookVerifyToken || 'whatsapp_secure_verify_token_123'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-300 font-mono text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(config?.webhookVerifyToken || 'whatsapp_secure_verify_token_123', 'token')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToken ? 'Disalin' : 'Salin Token'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
