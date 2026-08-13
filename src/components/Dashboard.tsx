import React from 'react';
import { 
  FileText, 
  MessageSquare, 
  Users, 
  Upload, 
  Send, 
  CheckCircle, 
  CheckCheck, 
  Clock, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
import { Contact, Campaign } from '../types';

interface DashboardProps {
  contacts: Contact[];
  campaigns: Campaign[];
  onNavigate: (tab: string, extra?: any) => void;
  onOpenCampaign: (campaign: Campaign) => void;
  onOpenImport: () => void;
  isAdmin: boolean;
  onRequireAdmin: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  contacts,
  campaigns,
  onNavigate,
  onOpenCampaign,
  onOpenImport,
  isAdmin,
  onRequireAdmin,
}) => {
  // Aggregate stats
  const totalContacts = contacts.length;
  const optedInContacts = contacts.filter(c => c.optInStatus === 'OPTED_IN').length;
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'PROCESSING' || c.status === 'QUEUED');
  
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
  const totalRead = campaigns.reduce((acc, c) => acc + c.readCount, 0);
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;

  // Group counts
  const groupCounts = contacts.reduce((acc, c) => {
    acc[c.group] = (acc[c.group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome & Notification Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-6 shadow-xl text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Official WhatsApp Business Cloud API Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            WhatsApp Communication Platform
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Satu tindakan untuk mengurus kenalan, menghantar teks rasmi, dan mengedarkan fail PDF kepada ratusan penerima dengan penjejakan status masa nyata.
          </p>
        </div>

        {/* Hero Quick PDF Blast CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="dash-quick-pdf-btn"
            onClick={() => onNavigate('pdf-blast')}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>🚀 ONE-COMMAND PDF BLAST</span>
          </button>

          <button
            id="dash-quick-text-btn"
            onClick={() => onNavigate('text-blast')}
            className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-sm transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Text Blast</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Contacts</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{totalContacts}</span>
            <span className="text-xs text-emerald-400 ml-2 font-medium">({optedInContacts} Aktif)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span>Directory Seeding</span>
            <button 
              onClick={() => onNavigate('contacts')} 
              className="text-emerald-400 hover:underline font-medium cursor-pointer"
            >
              Urus Kenalan →
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Campaigns</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{totalCampaigns}</span>
            {activeCampaigns.length > 0 ? (
              <span className="text-xs text-amber-400 ml-2 font-medium animate-pulse">({activeCampaigns.length} Berjalan)</span>
            ) : (
              <span className="text-xs text-slate-400 ml-2 font-medium">Semua Selesai</span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span>Penghantaran Kempen</span>
            <button 
              onClick={() => onNavigate('history')} 
              className="text-emerald-400 hover:underline font-medium cursor-pointer"
            >
              Lihat Sejarah →
            </button>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Messages Sent</span>
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{totalSent.toLocaleString()}</span>
            <span className="text-xs text-teal-400 ml-2 font-medium">via Meta Queue</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span>Delivered: {totalDelivered}</span>
            <span className="text-blue-400 font-medium">Read: {totalRead}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Delivery Health</span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white tracking-tight">{deliveryRate}%</span>
            <span className="text-xs text-emerald-400 ml-2 font-medium">Success Rate</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="flex items-center text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> E.164 Validated
            </span>
            <span className="text-slate-400">Cloud Webhook</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Quick Action Banner & Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: PDF Blast Core Action & Groups */}
        <div className="lg:col-span-2 space-y-6">
          {/* PDF Blast Focused Action Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <FileText className="w-48 h-48 text-emerald-400" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-slate-950 font-bold text-xs">
                  FLAGSHIP FEATURE
                </span>
                <span className="text-slate-400 text-xs font-medium">One-Command Action</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Edarkan Surat & Fail PDF kepada Ramai Penerima
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Muat naik fail PDF, tulis kapsyen berserta variabel peribadi (<code className="text-emerald-400 font-mono">{"{{name}}"}</code>, <code className="text-emerald-400 font-mono">{"{{id}}"}</code>), dan hantar serta-merta tanpa perlu manual copy-paste.
                </p>
              </div>

              {/* Steps summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-xs font-semibold text-emerald-400">1. Pilih Penerima</div>
                  <div className="text-xs text-slate-300 mt-1">Semua 75+ kenalan atau mengikut Kumpulan</div>
                </div>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-xs font-semibold text-emerald-400">2. Muat Naik PDF</div>
                  <div className="text-xs text-slate-300 mt-1">Pengesahan saiz & format automatik</div>
                </div>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-xs font-semibold text-emerald-400">3. 🚀 Blast PDF</div>
                  <div className="text-xs text-slate-300 mt-1">Queue & penjejakan status rasmi</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('pdf-blast')}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Buka PDF Blast Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenImport}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Import Excel / CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Blast by Group */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Segmentasi Kumpulan Kenalan</h3>
                <p className="text-xs text-slate-400">Pilih kumpulan untuk memulakan penghantaran pantas</p>
              </div>
              <button
                onClick={() => onNavigate('contacts')}
                className="text-xs font-medium text-emerald-400 hover:underline cursor-pointer"
              >
                Lihat Semua ({totalContacts}) →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(groupCounts).map(([grp, count]) => (
                <div
                  key={grp}
                  className="bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/50 rounded-xl p-3.5 transition-all cursor-pointer group"
                  onClick={() => onNavigate('pdf-blast', { selectedGroup: grp })}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">{grp}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{count}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center group-hover:text-emerald-300">
                    <span>Blast PDF</span>
                    <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Campaigns & Live Tracker */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Kempen Terkini</h3>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Semua ({totalCampaigns})
              </button>
            </div>

            {recentCampaigns.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Belum ada kempen dijalankan.</p>
                <button
                  onClick={() => onNavigate('pdf-blast')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Mulakan PDF Blast Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCampaigns.map((camp) => {
                  const percent = camp.totalCount > 0 
                    ? Math.round(((camp.sentCount + camp.failedCount) / camp.totalCount) * 100) 
                    : 0;

                  return (
                    <div
                      key={camp.id}
                      onClick={() => onOpenCampaign(camp)}
                      className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${camp.type === 'PDF' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'}`}>
                              {camp.type}
                            </span>
                            <h4 className="text-xs font-semibold text-white truncate max-w-[170px]" title={camp.name}>
                              {camp.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-400">{camp.totalCount} Penerima • {new Date(camp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>

                        <div>
                          {camp.status === 'COMPLETED' && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center space-x-1">
                              <CheckCheck className="w-3 h-3" />
                              <span>Selesai</span>
                            </span>
                          )}
                          {camp.status === 'PROCESSING' && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full flex items-center space-x-1 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>Sedang Hantar</span>
                            </span>
                          )}
                          {camp.status === 'PARTIAL' && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Sebahagian</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${camp.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{camp.sentCount} berjaya • {camp.failedCount} gagal</span>
                          <span>{percent}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
