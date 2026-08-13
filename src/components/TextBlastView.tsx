import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Eye, 
  Info,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { Contact, Campaign } from '../types';

interface TextBlastViewProps {
  contacts: Contact[];
  onBlastSuccess: (campaign: Campaign) => void;
  onNavigate: (tab: string) => void;
}

export const TextBlastView: React.FC<TextBlastViewProps> = ({
  contacts,
  onBlastSuccess,
  onNavigate,
}) => {
  const [recipientMode, setRecipientMode] = useState<'ALL' | 'GROUP' | 'SELECTED'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const [message, setMessage] = useState<string>(
    `Assalamualaikum & Salam Sejahtera {{name}},\n\nIni adalah pemakluman penting bagi warga organisasi (ID: {{id}}).\n\nSila layari portal utama untuk maklumat lanjut.\n\nSekian, terima kasih.`
  );

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blastError, setBlastError] = useState<string | null>(null);

  const groups = Array.from(new Set(contacts.map(c => c.group))).filter(Boolean);

  const activeRecipients = contacts.filter(c => {
    if (c.optInStatus === 'OPTED_OUT') return false;
    if (recipientMode === 'ALL') return true;
    if (recipientMode === 'GROUP') return selectedGroup === 'All' || c.group === selectedGroup;
    if (recipientMode === 'SELECTED') return selectedContactIds.includes(c.id);
    return true;
  });

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + ` {{${variable}}}`);
  };

  const previewContact = activeRecipients[0] || {
    name: 'Ahmad Faiz bin Zulkifli',
    externalId: 'ST001',
    group: 'Management',
    phone: '60139500149'
  };

  const renderedPreviewMessage = message
    .replace(/\{\{\s*name\s*\}\}/gi, previewContact.name)
    .replace(/\{\{\s*id\s*\}\}/gi, previewContact.externalId || 'ST001')
    .replace(/\{\{\s*group\s*\}\}/gi, previewContact.group || 'Staff')
    .replace(/\{\{\s*phone\s*\}\}/gi, previewContact.phone || '');

  const handleExecuteBlast = async () => {
    if (!message.trim()) {
      setBlastError('Mesej tidak boleh dibiarkan kosong.');
      return;
    }

    if (activeRecipients.length === 0) {
      setBlastError('Tiada penerima aktif dipilih.');
      return;
    }

    setIsSubmitting(true);
    setBlastError(null);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Text Blast - ${new Date().toLocaleDateString()}`,
          type: 'TEXT',
          caption: message,
          targetType: recipientMode,
          targetGroup: recipientMode === 'GROUP' ? selectedGroup : undefined,
          recipients: activeRecipients.map(r => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
            externalId: r.externalId,
            group: r.group
          }))
        })
      });

      const resData = await response.json();
      if (response.ok && resData.campaign) {
        setShowConfirmModal(false);
        onBlastSuccess(resData.campaign);
      } else {
        setBlastError(resData.error || 'Gagal memulakan kempen');
      }
    } catch (err: any) {
      setBlastError(err.message || 'Ralat sambungan ke pelayan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-sky-500/20 text-sky-400 border border-sky-500/30">
              Bulk Text Blast
            </span>
            <span className="text-xs text-slate-400">Personalised Variables Supported</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center space-x-3">
            <MessageSquare className="w-8 h-8 text-emerald-400" />
            <span>Text Blast Studio</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Hantar mesej teks WhatsApp rasmi kepada senarai penerima dengan variabel personalisasi automatik.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
          <Users className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs text-slate-400">Sasaran Penerima</div>
            <div className="text-base font-bold text-white">
              {activeRecipients.length} <span className="text-xs font-normal text-slate-400">kenalan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Recipient Selection */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
                <span>Pilih Penerima</span>
              </label>
              <button
                onClick={() => onNavigate('contacts')}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                Urus Senarai ({contacts.length}) →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecipientMode('ALL')}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  recipientMode === 'ALL'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Semua ({contacts.filter(c => c.optInStatus === 'OPTED_IN').length})
              </button>

              <button
                type="button"
                onClick={() => setRecipientMode('GROUP')}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  recipientMode === 'GROUP'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Kumpulan
              </button>

              <button
                type="button"
                onClick={() => setRecipientMode('SELECTED')}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  recipientMode === 'SELECTED'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Pilihan Manual ({selectedContactIds.length})
              </button>
            </div>

            {recipientMode === 'GROUP' && (
              <div className="pt-2">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="All">Semua Kumpulan</option>
                  {groups.map(grp => (
                    <option key={grp} value={grp}>
                      {grp} ({contacts.filter(c => c.group === grp && c.optInStatus === 'OPTED_IN').length} kenalan)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Message Composer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
                <span>Kandungan Mesej</span>
              </label>
              <span className="text-xs text-slate-400">Sokongan Format WhatsApp (*bold*, _italic_)</span>
            </div>

            {/* Quick Variable Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">Sisip pembolehubah:</span>
              <button
                type="button"
                onClick={() => insertVariable('name')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 text-xs text-emerald-400 font-mono transition-colors cursor-pointer"
              >
                + {"{{name}}"}
              </button>
              <button
                type="button"
                onClick={() => insertVariable('id')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 text-xs text-emerald-400 font-mono transition-colors cursor-pointer"
              >
                + {"{{id}}"}
              </button>
              <button
                type="button"
                onClick={() => insertVariable('group')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 text-xs text-emerald-400 font-mono transition-colors cursor-pointer"
              >
                + {"{{group}}"}
              </button>
            </div>

            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis mesej anda di sini..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* 3. Action */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <button
              id="execute-text-blast-btn"
              type="button"
              disabled={!message.trim() || activeRecipients.length === 0 || isSubmitting}
              onClick={() => setShowConfirmModal(true)}
              className={`w-full py-4 rounded-xl font-bold text-base shadow-xl flex items-center justify-center space-x-3 transition-all cursor-pointer ${
                !message.trim() || activeRecipients.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 transform hover:-translate-y-0.5'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>🚀 BLAST TEXT KEPADA {activeRecipients.length} PENERIMA</span>
            </button>
          </div>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Live WhatsApp Preview</span>
              </span>
            </div>

            <div className="bg-slate-950 border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm text-white">
                  {previewContact.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold truncate">{previewContact.name}</div>
                  <div className="text-[11px] text-emerald-200 truncate">{previewContact.phone}</div>
                </div>
              </div>

              <div className="bg-[#0b141a] p-4 min-h-[300px] flex flex-col justify-end space-y-4 bg-opacity-95">
                <div className="max-w-[88%] ml-auto bg-[#005c4b] text-white rounded-2xl rounded-tr-none p-3.5 shadow-md space-y-2">
                  <div className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {renderedPreviewMessage}
                  </div>
                  <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-300/80 pt-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-sky-400 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <FileCheck className="w-4 h-4" />
                <span>Pengesahan Text Blast</span>
              </div>
              <h3 className="text-xl font-bold text-white">Sahkan Penghantaran Teks</h3>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between items-center text-slate-300 border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Jumlah Penerima:</span>
                <span className="font-bold text-white">{activeRecipients.length} Kenalan</span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-slate-400 text-xs">Pratonton Teks:</span>
                <div className="text-xs bg-slate-900 p-2.5 rounded-lg text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {renderedPreviewMessage}
                </div>
              </div>
            </div>

            {blastError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
                {blastError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-sm transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteBlast}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center space-x-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Memproses Blast...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Sahkan & Blast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
