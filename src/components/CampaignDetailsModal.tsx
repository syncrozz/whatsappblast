import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Ban, 
  Search, 
  Send, 
  User, 
  Phone,
  ShieldCheck
} from 'lucide-react';
import { Campaign, CampaignRecipient } from '../types';

interface CampaignDetailsModalProps {
  campaignId: string | null;
  onClose: () => void;
  onCampaignUpdate?: (updated: Campaign) => void;
}

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaignId,
  onClose,
  onCampaignUpdate,
}) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Poll active campaign status
  useEffect(() => {
    if (!campaignId) return;

    let isMounted = true;

    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        const data = await res.json();
        if (isMounted && data.campaign) {
          setCampaign(data.campaign);
          if (onCampaignUpdate) onCampaignUpdate(data.campaign);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCampaign();

    const interval = setInterval(() => {
      if (campaign?.status === 'PROCESSING' || campaign?.status === 'QUEUED' || !campaign) {
        fetchCampaign();
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [campaignId, campaign?.status]);

  if (!campaignId) return null;

  const handleCancelCampaign = async () => {
    if (!campaign) return;
    if (!confirm('Adakah anda pasti ingin membatalkan kempen penghantaran ini?')) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.campaign) {
        setCampaign(data.campaign);
        if (onCampaignUpdate) onCampaignUpdate(data.campaign);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const recipients = campaign?.recipients || [];
  const filteredRecipients = recipients.filter(r => {
    const matchesSearch = 
      r.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contactPhone.includes(searchQuery) ||
      r.contactExternalId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const total = campaign?.totalCount || 1;
  const processed = (campaign?.sentCount || 0) + (campaign?.failedCount || 0);
  const percentage = Math.min(100, Math.round((processed / total) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              campaign?.type === 'PDF' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'
            }`}>
              {campaign?.type === 'PDF' ? <FileText className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white truncate max-w-md">{campaign?.name}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  campaign?.status === 'COMPLETED' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : campaign?.status === 'PROCESSING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-300'
                }`}>
                  {campaign?.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dicipta pada: {campaign ? new Date(campaign.createdAt).toLocaleString() : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Live Counters */}
        <div className="space-y-4 shrink-0">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Status Kemajuan Penghantaran</span>
              <span className="font-mono font-bold text-emerald-400">{percentage}%</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  campaign?.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{processed} daripada {campaign?.totalCount} penerima diproses</span>
              <span>{campaign?.pendingCount} menunggu dalam antrian</span>
            </div>
          </div>

          {/* 4 Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-white">{campaign?.sentCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-center space-x-1">
                <Send className="w-3 h-3 text-emerald-400" />
                <span>Sent</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-teal-400">{campaign?.deliveredCount}</div>
              <div className="text-[11px] text-teal-300 mt-0.5 flex items-center justify-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Delivered</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-blue-400">{campaign?.readCount}</div>
              <div className="text-[11px] text-blue-300 mt-0.5 flex items-center justify-center space-x-1">
                <CheckCheck className="w-3 h-3" />
                <span>Read</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-red-400">{campaign?.failedCount}</div>
              <div className="text-[11px] text-red-300 mt-0.5 flex items-center justify-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Failed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Details & Filter */}
        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Cari penerima..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 text-xs">
              {['ALL', 'READ', 'DELIVERED', 'SENT', 'FAILED', 'QUEUED'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 border border-slate-800 rounded-xl overflow-y-auto bg-slate-950/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 sticky top-0 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nama Penerima</th>
                  <th className="p-3">WhatsApp</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Masa / Ralat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecipients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      Tiada rekod penerima ditemui.
                    </td>
                  </tr>
                ) : (
                  filteredRecipients.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono text-slate-400">{r.contactExternalId || '-'}</td>
                      <td className="p-3 font-semibold text-white">{r.contactName}</td>
                      <td className="p-3 font-mono text-emerald-400">+{r.contactPhone}</td>
                      <td className="p-3">
                        {r.status === 'READ' && (
                          <span className="inline-flex items-center space-x-1 text-blue-400 font-semibold">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </span>
                        )}
                        {r.status === 'DELIVERED' && (
                          <span className="inline-flex items-center space-x-1 text-teal-400 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </span>
                        )}
                        {r.status === 'SENT' && (
                          <span className="inline-flex items-center space-x-1 text-slate-300 font-semibold">
                            <Send className="w-3.5 h-3.5 text-slate-400" />
                            <span>Sent</span>
                          </span>
                        )}
                        {r.status === 'SENDING' && (
                          <span className="inline-flex items-center space-x-1 text-amber-400 font-semibold animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Sending...</span>
                          </span>
                        )}
                        {r.status === 'QUEUED' && (
                          <span className="text-slate-500">Dalam antrian</span>
                        )}
                        {r.status === 'FAILED' && (
                          <span className="inline-flex items-center space-x-1 text-red-400 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">
                        {r.status === 'FAILED' ? (
                          <span className="text-red-400">{r.errorReason || 'Ralat penghantaran'}</span>
                        ) : r.readAt ? (
                          <span>Dibaca: {new Date(r.readAt).toLocaleTimeString()}</span>
                        ) : r.deliveredAt ? (
                          <span>Diterima: {new Date(r.deliveredAt).toLocaleTimeString()}</span>
                        ) : r.sentAt ? (
                          <span>Dihantar: {new Date(r.sentAt).toLocaleTimeString()}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0 text-xs">
          <div className="text-slate-400">
            {campaign?.status === 'PROCESSING' && (
              <span className="flex items-center space-x-1.5 text-amber-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sedang menyelaraskan status webhook WhatsApp Cloud API...</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {campaign?.status === 'PROCESSING' && (
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelCampaign}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 font-medium cursor-pointer"
              >
                {isCancelling ? 'Membatalkan...' : 'Batal Penghantaran'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
