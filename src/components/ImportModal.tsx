import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Contact, ColumnMapping } from '../types';
import { sanitizePhoneNumber } from '../utils/phone';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newContacts: Contact[]) => void;
  existingContacts: Contact[];
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingContacts,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    externalIdCol: '',
    nameCol: '',
    phoneCol: '',
    groupCol: '',
    emailCol: '',
  });

  const [step, setStep] = useState<'UPLOAD' | 'MAP' | 'PREVIEW'>('UPLOAD');
  const [importStats, setImportStats] = useState<{
    totalRows: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    parsedContacts: Contact[];
  }>({
    totalRows: 0,
    validCount: 0,
    invalidCount: 0,
    duplicateCount: 0,
    parsedContacts: [],
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (selectedFile: File) => {
    setErrorMsg(null);
    setFile(selectedFile);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (json.length === 0) {
        setErrorMsg('Fail spreadsheet kosong.');
        return;
      }

      const headers = Object.keys(json[0]);
      setRawHeaders(headers);
      setRawData(json);

      // Auto-detect columns intelligently
      const mapping: ColumnMapping = {
        externalIdCol: headers.find(h => /^(id|staff\s*id|no|code|externalid)$/i.test(h)) || headers[0] || '',
        nameCol: headers.find(h => /^(name|nama|full\s*name|penerima)$/i.test(h)) || '',
        phoneCol: headers.find(h => /^(phone|whatsapp|no\s*tel|tel|handphone|mobile|contact)$/i.test(h)) || headers.find(h => /whatsapp/i.test(h)) || '',
        groupCol: headers.find(h => /^(group|kumpulan|jabatan|department|category)$/i.test(h)) || '',
        emailCol: headers.find(h => /^(email|emel|mail)$/i.test(h)) || '',
      };

      // Fallbacks if not detected
      if (!mapping.phoneCol && headers.length > 1) {
        mapping.phoneCol = headers[1];
      }

      setColumnMapping(mapping);
      setStep('MAP');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membaca fail Excel/CSV.');
    }
  };

  const handleAnalyzeAndPreview = () => {
    if (!columnMapping.phoneCol) {
      setErrorMsg('Sila tentukan lajur untuk Nombor Telefon / WhatsApp.');
      return;
    }

    const existingPhones = new Set(existingContacts.map(c => c.phone));
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    const now = new Date().toISOString();

    const parsedContacts: Contact[] = [];

    rawData.forEach((row, idx) => {
      const rawPhone = row[columnMapping.phoneCol];
      const rawName = columnMapping.nameCol ? row[columnMapping.nameCol] : '';
      const rawId = columnMapping.externalIdCol ? row[columnMapping.externalIdCol] : `IMP${idx + 1}`;
      const rawGroup = columnMapping.groupCol && row[columnMapping.groupCol] ? String(row[columnMapping.groupCol]) : 'General';
      const rawEmail = columnMapping.emailCol ? String(row[columnMapping.emailCol]) : undefined;

      const { isValid, sanitized } = sanitizePhoneNumber(rawPhone);

      if (!isValid) {
        invalidCount++;
        return;
      }

      if (existingPhones.has(sanitized)) {
        duplicateCount++;
      }

      validCount++;
      parsedContacts.push({
        id: `cnt_imp_${Date.now()}_${idx}`,
        externalId: String(rawId || `ID${idx + 1}`).trim(),
        name: String(rawName || `Contact ${sanitized.slice(-4)}`).trim(),
        phone: sanitized,
        email: rawEmail,
        group: rawGroup.trim(),
        tags: [rawGroup.toLowerCase(), 'imported-excel'],
        optInStatus: 'OPTED_IN',
        optInSource: `Import (${file?.name || 'Excel'})`,
        optInAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    setImportStats({
      totalRows: rawData.length,
      validCount,
      invalidCount,
      duplicateCount,
      parsedContacts,
    });

    setStep('PREVIEW');
  };

  const handleConfirmImport = () => {
    onImportComplete(importStats.parsedContacts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Import Kenalan (Excel & CSV)</h3>
              <p className="text-xs text-slate-400">Padankan lajur fail kepada struktur sistem secara automatik</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Upload */}
        {step === 'UPLOAD' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileProcess(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-10 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-800/30 transition-all"
            >
              <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <div className="text-sm font-semibold text-white">
                Pilih atau seret fail Excel (.xlsx, .xls) / CSV ke sini
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Menyokong format senarai kenalan organisasi berserta ID dan WhatsApp
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'MAP' && (
          <div className="space-y-5">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Fail: {file?.name}</span>
              <span className="text-emerald-400 font-mono">{rawData.length} baris dijumpai</span>
            </div>

            <div className="space-y-3 text-sm">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pemadanan Lajur (Column Mapping)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    No. Telefon / WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={columnMapping.phoneCol}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, phoneCol: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Lajur --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">ID / Staff No.</label>
                  <select
                    value={columnMapping.externalIdCol}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, externalIdCol: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  >
                    <option value="">-- Tiada (Jana Automatik) --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Nama Penuh</label>
                  <select
                    value={columnMapping.nameCol}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, nameCol: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  >
                    <option value="">-- Tiada (Jana dari Nombor) --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Kumpulan / Jabatan</label>
                  <select
                    value={columnMapping.groupCol}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, groupCol: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500"
                  >
                    <option value="">-- Tiada (Tetapkan 'General') --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('UPLOAD')}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleAnalyzeAndPreview}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Semak & Pratonton</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Validation Preview & Import */}
        {step === 'PREVIEW' && (
          <div className="space-y-5">
            {/* Validation Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <div className="text-xl font-bold text-emerald-400">{importStats.validCount}</div>
                <div className="text-[11px] text-emerald-300 font-medium mt-0.5">Nombor Sah (E.164)</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <div className="text-xl font-bold text-amber-400">{importStats.duplicateCount}</div>
                <div className="text-[11px] text-amber-300 font-medium mt-0.5">Pendua Dijumpai</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <div className="text-xl font-bold text-red-400">{importStats.invalidCount}</div>
                <div className="text-[11px] text-red-300 font-medium mt-0.5">Tidak Sah (Dibuang)</div>
              </div>
            </div>

            {/* Preview of first 5 */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">
                Pratonton 5 Kenalan Pertama:
              </div>
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Nama</th>
                      <th className="p-2.5">WhatsApp</th>
                      <th className="p-2.5">Kumpulan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {importStats.parsedContacts.slice(0, 5).map((c, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono text-slate-400">{c.externalId}</td>
                        <td className="p-2.5 font-medium text-white">{c.name}</td>
                        <td className="p-2.5 font-mono text-emerald-400">+{c.phone}</td>
                        <td className="p-2.5">{c.group}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('MAP')}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Sahkan & Import {importStats.validCount} Kenalan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
