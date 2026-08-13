import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Users, 
  History, 
  Settings,
  Radio,
  Lock,
  Unlock,
  ShieldCheck,
  Cloud
} from 'lucide-react';
import { WhatsAppConfig } from '../types';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  config: WhatsAppConfig | null;
  activeCampaignCount: number;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onLockAdmin: () => void;
  isFirebaseSynced: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  config,
  activeCampaignCount,
  isAdmin,
  onOpenAdminModal,
  onLockAdmin,
  isFirebaseSynced,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <MessageSquare className="w-6 h-6 text-slate-950 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg tracking-tight text-slate-100">WhatsApp Hub</span>
                <span className="px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Official Cloud API
                </span>
                {isFirebaseSynced && (
                  <span className="hidden lg:inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                    <Cloud className="w-3 h-3" />
                    <span>Firestore Synced</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Centralised Communication & Blast Engine</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-dashboard-btn"
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-pdf-blast-btn"
              onClick={() => onSelectTab('pdf-blast')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'pdf-blast'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 border border-emerald-500/20'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>PDF Blast</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-emerald-400/20 rounded font-semibold text-emerald-300">Core</span>
            </button>

            <button
              id="nav-text-blast-btn"
              onClick={() => onSelectTab('text-blast')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'text-blast'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Text Blast</span>
            </button>

            <button
              id="nav-contacts-btn"
              onClick={() => onSelectTab('contacts')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'contacts'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Contacts</span>
            </button>

            <button
              id="nav-history-btn"
              onClick={() => onSelectTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                currentTab === 'history'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Campaigns</span>
              {activeCampaignCount > 0 && (
                <span className="inline-flex items-center justify-center w-2 h-2 p-1 text-[10px] font-bold leading-none text-slate-900 bg-amber-400 rounded-full animate-pulse" />
              )}
            </button>
          </nav>

          {/* Right Admin Mode Toggle, Mode Badge & Settings */}
          <div className="flex items-center space-x-2.5">
            {/* Admin Mode Lock Button */}
            {isAdmin ? (
              <button
                id="nav-admin-unlocked-btn"
                onClick={onLockAdmin}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all text-xs font-semibold cursor-pointer shadow-sm shadow-emerald-500/20"
                title="Admin Mode Aktif. Klik untuk mengunci semula."
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Admin Mode (Aktif)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200">Kunci</span>
              </button>
            ) : (
              <button
                id="nav-admin-locked-btn"
                onClick={onOpenAdminModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all text-xs font-medium cursor-pointer"
                title="Klik untuk memasukkan PIN Keselamatan Pentadbir"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Mode</span>
              </button>
            )}

            {/* Cloud / Test Mode Badge */}
            <div 
              onClick={() => onSelectTab('settings')}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-600 cursor-pointer text-xs"
              title="Klik untuk konfigurasi WhatsApp API"
            >
              <Radio className={`w-3.5 h-3.5 ${config?.mode === 'LIVE' ? 'text-emerald-400 animate-pulse' : 'text-sky-400'}`} />
              <span className="hidden lg:inline text-slate-300">
                {config?.mode === 'LIVE' ? 'Live API' : 'Test Mode'}
              </span>
            </div>

            <button
              id="nav-settings-btn"
              onClick={() => onSelectTab('settings')}
              className={`p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
                currentTab === 'settings' ? 'bg-slate-800 text-emerald-400' : ''
              }`}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-900/95 overflow-x-auto px-2 py-1.5 space-x-1">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded text-center whitespace-nowrap ${
            currentTab === 'dashboard' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('pdf-blast')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded text-center whitespace-nowrap ${
            currentTab === 'pdf-blast' ? 'bg-emerald-600 text-white font-semibold' : 'text-emerald-300'
          }`}
        >
          📄 PDF Blast
        </button>
        <button
          onClick={() => onSelectTab('text-blast')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded text-center whitespace-nowrap ${
            currentTab === 'text-blast' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300'
          }`}
        >
          💬 Text
        </button>
        <button
          onClick={() => onSelectTab('contacts')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded text-center whitespace-nowrap ${
            currentTab === 'contacts' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300'
          }`}
        >
          Contacts
        </button>
        <button
          onClick={() => onSelectTab('history')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded text-center whitespace-nowrap ${
            currentTab === 'history' ? 'bg-slate-800 text-emerald-400' : 'text-slate-300'
          }`}
        >
          Campaigns
        </button>
      </div>
    </header>
  );
};
