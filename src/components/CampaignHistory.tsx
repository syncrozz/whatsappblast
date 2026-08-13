import React, { useState } from 'react';
import { 
  History, 
  FileText, 
  MessageSquare, 
  CheckCheck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Campaign } from '../types';

interface CampaignHistoryProps {
  campaigns: Campaign[];
  onOpenCampaign: (campaign: Campaign) => void;
  onNavigateToBlast: (type: 'PDF' | 'TEXT') => void;
}

export const CampaignHistory: React.FC<CampaignHistoryProps> = ({
  campaigns,
  onOpenCampaign,
  onNavigateToBlast,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'PDF' | 'TEXT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || c.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Audit & Delivery Logs
            </span>
            <span className="text-xs text-slate-400">{campaigns.length} Jumlah Kempen</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center space-x-3">
            <History className="w-8 h-8 text-emerald-400" />
            <span>Sejarah & Rekod Penghantaran</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau status setiap kempen WhatsApp, peratusan penyerahan, dan log penjejakan rasmi.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateToBlast('PDF')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>🚀 Blast PDF Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama kempen atau dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Jenis Kempen</option>
              <option value="PDF">📄 PDF Blast Sahaja</option>
              <option value="TEXT">💬 Text Blast Sahaja</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="COMPLETED">Selesai (Completed)</option>
              <option value="PROCESSING">Sedang Dihantar (Processing)</option>
              <option value="PARTIAL">Sebahagian Berjaya (Partial)</option>
              <option value="FAILED">Gagal (Failed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-3">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <History className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-base font-semibold text-slate-300">Tiada rekod kempen dijumpai</div>
            <p className="text-xs text-slate-500">Gunakan butang Blast untuk memulakan penghantaran pertama anda.</p>
          </div>
        ) : (
          filteredCampaigns.map((c) => {
            const processed = c.sentCount + c.failedCount;
            const percent = c.totalCount > 0 ? Math.round((processed / c.totalCount) * 100) : 0;
            const deliveryRate = c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0;

            return (
              <div
                key={c.id}
                onClick={() => onOpenCampaign(c)}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all cursor-pointer space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      c.type === 'PDF' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'
                    }`}>
                      {c.type === 'PDF' ? <FileText className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          c.type === 'PDF' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {c.type} BLAST
                        </span>
                        <h3 className="text-base font-bold text-white">{c.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        {c.totalCount} Penerima ({c.targetType === 'GROUP' ? `Kumpulan: ${c.targetGroup}` : 'Semua Sasaran'}) • {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-center">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-400">Kadar Penyerahan</div>
                      <div className="text-sm font-bold text-emerald-400">{deliveryRate}%</div>
                    </div>

                    {c.status === 'COMPLETED' && (
                      <span className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center space-x-1.5">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Selesai</span>
                      </span>
                    )}
                    {c.status === 'PROCESSING' && (
                      <span className="px-3 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full flex items-center space-x-1.5 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Sedang Memproses</span>
                      </span>
                    )}
                    {c.status === 'PARTIAL' && (
                      <span className="px-3 py-1 text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Sebahagian Selesai</span>
                      </span>
                    )}
                    {c.status === 'FAILED' && (
                      <span className="px-3 py-1 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 rounded-full flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Gagal</span>
                      </span>
                    )}

                    <span className="text-slate-500 hover:text-emerald-400 text-xs font-medium flex items-center">
                      Perincian →
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-300">Dihantar: <strong>{c.sentCount}</strong></span>
                      <span className="text-teal-400">Diterima: <strong>{c.deliveredCount}</strong></span>
                      <span className="text-blue-400">Dibaca: <strong>{c.readCount}</strong></span>
                      {c.failedCount > 0 && <span className="text-red-400">Gagal: <strong>{c.failedCount}</strong></span>}
                    </div>
                    <span className="font-mono text-slate-300">{percent}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
