import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { PdfBlastView } from './components/PdfBlastView';
import { TextBlastView } from './components/TextBlastView';
import { ContactsManager } from './components/ContactsManager';
import { CampaignHistory } from './components/CampaignHistory';
import { CampaignDetailsModal } from './components/CampaignDetailsModal';
import { ImportModal } from './components/ImportModal';
import { SettingsModal } from './components/SettingsModal';
import { Contact, Campaign, WhatsAppConfig } from './types';
import { generateInitialContacts } from './utils/seedData';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [initialGroupForBlast, setInitialGroupForBlast] = useState<string | undefined>(undefined);

  // Contacts Store (Persisted to localStorage with Seed Fallback)
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('wa_hub_contacts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return generateInitialContacts();
  });

  // Save contacts on change
  useEffect(() => {
    try {
      localStorage.setItem('wa_hub_contacts', JSON.stringify(contacts));
    } catch (e) {
      console.error(e);
    }
  }, [contacts]);

  // Campaigns Store (Fetched from Backend API)
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeModalCampaignId, setActiveModalCampaignId] = useState<string | null>(null);

  // WhatsApp Config
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Fetch initial config & campaigns
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchCampaigns();

    // Periodic campaign polling
    const interval = setInterval(fetchCampaigns, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Navigation
  const handleNavigate = (tab: string, extra?: any) => {
    if (extra?.selectedGroup) {
      setInitialGroupForBlast(extra.selectedGroup);
    } else {
      setInitialGroupForBlast(undefined);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Contacts CRUD
  const handleAddContact = (newContactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newContact: Contact = {
      ...newContactData,
      id: `cnt_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setContacts(prev => [newContact, ...prev]);
  };

  const handleUpdateContact = (updated: Contact) => {
    setContacts(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteBulk = (ids: string[]) => {
    setContacts(prev => prev.filter(c => !ids.includes(c.id)));
  };

  const handleImportComplete = (imported: Contact[]) => {
    setContacts(prev => [...imported, ...prev]);
  };

  // Blast Trigger Success Handler
  const handleBlastSuccess = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
    setActiveModalCampaignId(campaign.id);
  };

  // Update Config
  const handleUpdateConfig = async (newConfig: Partial<WhatsAppConfig> & { apiToken?: string }) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    const data = await res.json();
    if (data.success) {
      await fetchConfig();
    }
  };

  const activeCampaignCount = campaigns.filter(
    c => c.status === 'PROCESSING' || c.status === 'QUEUED'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header & Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        config={config}
        activeCampaignCount={activeCampaignCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            contacts={contacts}
            campaigns={campaigns}
            onNavigate={handleNavigate}
            onOpenCampaign={(camp) => setActiveModalCampaignId(camp.id)}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {currentTab === 'pdf-blast' && (
          <PdfBlastView
            contacts={contacts}
            initialGroup={initialGroupForBlast}
            onBlastSuccess={handleBlastSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'text-blast' && (
          <TextBlastView
            contacts={contacts}
            onBlastSuccess={handleBlastSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'contacts' && (
          <ContactsManager
            contacts={contacts}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onDeleteBulk={handleDeleteBulk}
            onOpenImport={() => setIsImportModalOpen(true)}
            onNavigateToBlast={(grp) => handleNavigate('pdf-blast', { selectedGroup: grp })}
          />
        )}

        {currentTab === 'history' && (
          <CampaignHistory
            campaigns={campaigns}
            onOpenCampaign={(camp) => setActiveModalCampaignId(camp.id)}
            onNavigateToBlast={(type) => handleNavigate(type === 'PDF' ? 'pdf-blast' : 'text-blast')}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsModal
            config={config}
            onUpdateConfig={handleUpdateConfig}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WhatsApp Communication Platform • Official Cloud API Integration</span>
          <span>Simple by Default • Powerful When Needed</span>
        </div>
      </footer>

      {/* Real-Time Live Delivery Progress Modal */}
      {activeModalCampaignId && (
        <CampaignDetailsModal
          campaignId={activeModalCampaignId}
          onClose={() => {
            setActiveModalCampaignId(null);
            fetchCampaigns();
          }}
          onCampaignUpdate={(updated) => {
            setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
          }}
        />
      )}

      {/* Excel/CSV Smart Importer Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
        existingContacts={contacts}
      />
    </div>
  );
}
