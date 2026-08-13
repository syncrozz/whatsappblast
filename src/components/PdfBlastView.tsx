import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Users, 
  Check, 
  AlertTriangle, 
  Send, 
  Trash2, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  Info,
  ChevronRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { Contact, MediaFile, Campaign } from '../types';

interface PdfBlastViewProps {
  contacts: Contact[];
  initialGroup?: string;
  onBlastSuccess: (campaign: Campaign) => void;
  onNavigate: (tab: string) => void;
}

export const PdfBlastView: React.FC<PdfBlastViewProps> = ({
  contacts,
  initialGroup,
  onBlastSuccess,
  onNavigate,
}) => {
  // Recipient selection mode
  const [recipientMode, setRecipientMode] = useState<'ALL' | 'GROUP' | 'SELECTED'>(
    initialGroup ? 'GROUP' : 'ALL'
  );
  const [selectedGroup, setSelectedGroup] = useState<string>(initialGroup || 'All');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfMedia, setPdfMedia] = useState<MediaFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Caption state
  const [caption, setCaption] = useState<string>(
    `Assalamualaikum & Salam Sejahtera {{name}},\n\nSila rujuk dokumen rasmi yang dilampirkan bagi rujukan anda (No. ID: {{id}}).\n\nSekian, terima kasih.`
  );

  // Blast confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blastError, setBlastError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available groups
  const groups = Array.from(new Set(contacts.map(c => c.group))).filter(Boolean);

  // Filtered active recipients (excluding opted-out contacts)
  const activeRecipients = contacts.filter(c => {
    if (c.optInStatus === 'OPTED_OUT') return false;
    if (recipientMode === 'ALL') return true;
    if (recipientMode === 'GROUP') return selectedGroup === 'All' || c.group === selectedGroup;
    if (recipientMode === 'SELECTED') return selectedContactIds.includes(c.id);
    return true;
  });

  // Handle PDF file selection & validation
  const handleFileChange = async (file: File) => {
    setUploadError(null);

    // Validate type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('❌ PDF tidak dapat digunakan. Sila pilih fail PDF (.pdf) yang sah.');
      return;
    }

    // Validate size (16MB limit)
    const MAX_SIZE = 16 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`❌ Saiz fail (${(file.size / (1024 * 1024)).toFixed(1)}MB) melebihi had maksimum 16MB.`);
      return;
    }

    setPdfFile(file);
    setIsUploading(true);

    try {
      // Read data url for preview
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;

        // Post to backend media engine
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: 'application/pdf',
            size: file.size,
            dataUrl
          })
        });

        const resData = await response.json();
        if (response.ok && resData.media) {
          setPdfMedia(resData.media);
        } else {
          setUploadError(resData.error || 'Gagal memuat naik fail PDF ke pelayan.');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || 'Ralat membaca fail');
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const insertVariable = (variable: string) => {
    setCaption(prev => prev + ` {{${variable}}}`);
  };

  // Sample recipient for live preview
  const previewContact = activeRecipients[0] || {
    name: 'Ahmad Faiz bin Zulkifli',
    externalId: 'ST001',
    group: 'Management',
    phone: '60139500149'
  };

  const renderedPreviewCaption = caption
    .replace(/\{\{\s*name\s*\}\}/gi, previewContact.name)
    .replace(/\{\{\s*id\s*\}\}/gi, previewContact.externalId || 'ST001')
    .replace(/\{\{\s*group\s*\}\}/gi, previewContact.group || 'Staff')
    .replace(/\{\{\s*phone\s*\}\}/gi, previewContact.phone || '');

  // Dispatch One-Command PDF Blast
  const handleExecuteBlast = async () => {
    if (!pdfMedia) {
      setBlastError('Sila muat naik fail PDF yang sah sebelum meneruskan.');
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
          name: `PDF Blast: ${pdfMedia.filename}`,
          type: 'PDF',
          caption,
          mediaId: pdfMedia.id,
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
      {/* Title & Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              One-Command Blast
            </span>
            <span className="text-xs text-slate-400">Official WhatsApp Cloud Media API</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center space-x-3">
            <FileText className="w-8 h-8 text-emerald-400" />
            <span>PDF Blast Studio</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pilih penerima, muat naik fail PDF, dan lancarkan penghantaran dokumen serentak dengan satu tindakan.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
          <Users className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs text-slate-400">Sasaran Penerima</div>
            <div className="text-base font-bold text-white">
              {activeRecipients.length} <span className="text-xs font-normal text-slate-400">kenalan aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Left (Form Controls) / Right (WhatsApp Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Step-less Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Recipient Selection Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
                <span>Pilih Penerima Dokumen</span>
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
                Semua Kenalan ({contacts.filter(c => c.optInStatus === 'OPTED_IN').length})
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
                Mengikut Kumpulan
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
                <label className="text-xs text-slate-400 mb-1.5 block">Pilih Kumpulan Sasaran:</label>
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

            {recipientMode === 'SELECTED' && (
              <div className="pt-2 space-y-2">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Pilih individu dari senarai:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedContactIds(contacts.map(c => c.id))}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto bg-slate-950/60 border border-slate-800 rounded-xl p-2 space-y-1 divide-y divide-slate-800/40">
                  {contacts.map(c => {
                    const isChecked = selectedContactIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center space-x-3 p-1.5 hover:bg-slate-800/60 rounded-lg cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContactIds(prev => [...prev, c.id]);
                            } else {
                              setSelectedContactIds(prev => prev.filter(id => id !== c.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-800"
                        />
                        <span className="font-medium text-slate-200">{c.name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">({c.externalId})</span>
                        <span className="text-slate-400 ml-auto">{c.phone}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. PDF Document Upload Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <label className="text-sm font-semibold text-white flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
              <span>Muat Naik Dokumen PDF</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {!pdfMedia ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  uploadError
                    ? 'border-red-500/60 bg-red-500/5'
                    : 'border-slate-700 hover:border-emerald-500/60 hover:bg-slate-800/40 bg-slate-950/40'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-white">
                  Klik untuk memilih fail atau seret fail PDF ke sini
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Format disokong: <strong className="text-slate-300">.PDF</strong> (Maksimum 16MB mengikut had WhatsApp Cloud API)
                </p>

                {isUploading && (
                  <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-emerald-400">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span>Mengesahkan & memproses PDF...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center font-bold">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-md">
                        {pdfMedia.filename}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded">
                        DISAHKAN
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Saiz: {(pdfMedia.size / (1024 * 1024)).toFixed(2)} MB • WhatsApp Ready
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPdfMedia(null);
                    setPdfFile(null);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Buang fail & muat naik semula"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* 3. Caption & Variable Customization */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">3</span>
                <span>Kapsyen Mesej Dokumen</span>
              </label>
              <span className="text-xs text-slate-400">Variabel Peribadi Dinamik</span>
            </div>

            {/* Quick Variable Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">Klik untuk sisip:</span>
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
              <button
                type="button"
                onClick={() => insertVariable('phone')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 text-xs text-emerald-400 font-mono transition-colors cursor-pointer"
              >
                + {"{{phone}}"}
              </button>
            </div>

            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tulis mesej pengiring dokumen PDF anda di sini..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* 4. One-Command Blast Confirmation Bar */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Sedia untuk Penghantaran Rasmi</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Satu tindakan untuk mengedarkan fail kepada <strong>{activeRecipients.length}</strong> penerima melalui sistem antrian automatik.
                </p>
              </div>
            </div>

            <button
              id="execute-pdf-blast-btn"
              type="button"
              disabled={!pdfMedia || activeRecipients.length === 0 || isSubmitting}
              onClick={() => setShowConfirmModal(true)}
              className={`w-full py-4 rounded-xl font-bold text-base shadow-xl flex items-center justify-center space-x-3 transition-all cursor-pointer ${
                !pdfMedia || activeRecipients.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 transform hover:-translate-y-0.5'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>🚀 BLAST PDF SEKARANG ({activeRecipients.length} PENERIMA)</span>
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Interactive WhatsApp Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Live WhatsApp Preview</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Penerima Contoh: <strong className="text-slate-300">{previewContact.name.split(' ')[0]}</strong>
              </span>
            </div>

            {/* Smartphone Shell Mockup */}
            <div className="bg-slate-950 border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm text-white">
                  {previewContact.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold truncate">{previewContact.name}</div>
                  <div className="text-[11px] text-emerald-200 truncate">{previewContact.phone}</div>
                </div>
              </div>

              {/* Chat Canvas (WhatsApp classic background color) */}
              <div className="bg-[#0b141a] p-4 min-h-[380px] flex flex-col justify-end space-y-4 bg-opacity-95 relative">
                {/* Incoming / Outgoing Bubble */}
                <div className="max-w-[88%] ml-auto bg-[#005c4b] text-white rounded-2xl rounded-tr-none p-3 shadow-md space-y-2.5">
                  {/* PDF Document Attachment Card */}
                  <div className="bg-[#025143] rounded-xl p-3 flex items-center space-x-3 border border-emerald-600/30">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate text-slate-100">
                        {pdfMedia ? pdfMedia.filename : 'Surat_Pemberitahuan_Rasmi.pdf'}
                      </div>
                      <div className="text-[10px] text-emerald-300">
                        {pdfMedia ? `${(pdfMedia.size / (1024 * 1024)).toFixed(1)} MB` : '2.4 MB'} • PDF Document
                      </div>
                    </div>
                  </div>

                  {/* Caption Text with Variable Replacement */}
                  <div className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {renderedPreviewCaption}
                  </div>

                  {/* Message Timestamp & Double Blue Ticks */}
                  <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-300/80 pt-1">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-sky-400 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note on Queue Throttling */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-start space-x-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Sistem menghantar melalui WhatsApp Cloud API menggunakan antrian terkawal (~15-20 msg/saat) bagi memastikan kadar penghantaran 100% selamat tanpa sekatan.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <FileCheck className="w-4 h-4" />
                <span>Pengesahan Akhir PDF Blast</span>
              </div>
              <h3 className="text-xl font-bold text-white">Sahkan Penghantaran Dokumen</h3>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between items-center text-slate-300 border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Jumlah Penerima:</span>
                <span className="font-bold text-white">{activeRecipients.length} Kenalan</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Fail PDF:</span>
                <span className="font-semibold text-emerald-400 truncate max-w-[200px]">{pdfMedia?.filename}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Saiz Fail:</span>
                <span className="text-slate-300">{pdfMedia ? (pdfMedia.size / (1024 * 1024)).toFixed(2) : 0} MB</span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-slate-400 text-xs">Pratonton Kapsyen:</span>
                <div className="text-xs bg-slate-900 p-2.5 rounded-lg text-slate-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {renderedPreviewCaption}
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
                    <span>Sahkan & Blast PDF</span>
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
