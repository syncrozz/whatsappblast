import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Phone, 
  Tag, 
  MoreVertical,
  CheckSquare,
  Square,
  ShieldCheck,
  Lock,
  Unlock
} from 'lucide-react';
import { Contact } from '../types';
import { sanitizePhoneNumber, formatPhoneDisplay } from '../utils/phone';

interface ContactsManagerProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onDeleteBulk: (ids: string[]) => void;
  onOpenImport: () => void;
  onNavigateToBlast: (group?: string) => void;
  isAdmin: boolean;
  onRequireAdmin: () => void;
}

export const ContactsManager: React.FC<ContactsManagerProps> = ({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onDeleteBulk,
  onOpenImport,
  onNavigateToBlast,
  isAdmin,
  onRequireAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add/Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formExternalId, setFormExternalId] = useState('');
  const [formGroup, setFormGroup] = useState('Staff');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const groups = Array.from(new Set(contacts.map(c => c.group))).filter(Boolean);

  // Filtered contacts
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.externalId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGroup = selectedGroup === 'All' || c.group === selectedGroup;
    const matchesStatus = selectedStatus === 'All' || c.optInStatus === selectedStatus;

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map(c => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenAdd = () => {
    if (!isAdmin) {
      onRequireAdmin();
      return;
    }
    setEditingContact(null);
    setFormName('');
    setFormPhone('');
    setFormExternalId(`ST${(contacts.length + 1).toString().padStart(3, '0')}`);
    setFormGroup('Staff');
    setFormEmail('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    if (!isAdmin) {
      onRequireAdmin();
      return;
    }
    setEditingContact(contact);
    setFormName(contact.name);
    setFormPhone(contact.phone);
    setFormExternalId(contact.externalId);
    setFormGroup(contact.group);
    setFormEmail(contact.email || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Sila masukkan nama kenalan.');
      return;
    }

    const { isValid, sanitized, error } = sanitizePhoneNumber(formPhone);
    if (!isValid) {
      setFormError(error || 'Nombor telefon tidak sah untuk WhatsApp.');
      return;
    }

    if (editingContact) {
      onUpdateContact({
        ...editingContact,
        name: formName.trim(),
        phone: sanitized,
        externalId: formExternalId.trim(),
        group: formGroup,
        email: formEmail.trim(),
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddContact({
        name: formName.trim(),
        phone: sanitized,
        externalId: formExternalId.trim(),
        group: formGroup,
        email: formEmail.trim(),
        tags: [formGroup.toLowerCase()],
        optInStatus: 'OPTED_IN',
        optInSource: 'Manual Entry',
        optInAt: new Date().toISOString()
      });
    }

    setIsFormOpen(false);
  };

  const handleExportCSV = () => {
    if (!isAdmin) {
      onRequireAdmin();
      return;
    }
    const headers = ['ID', 'Name', 'WhatsApp', 'Email', 'Group', 'OptInStatus'];
    const rows = filteredContacts.map(c => [
      c.externalId,
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone,
      c.email || '',
      c.group,
      c.optInStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `whatsapp_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Directory Manager
            </span>
            <span className="text-xs text-slate-400">{contacts.length} Jumlah Kenalan</span>
            {isAdmin ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Unlock className="w-3 h-3" />
                <span>Admin Mode Aktif</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Mod Baca Sahaja</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center space-x-3">
            <Users className="w-8 h-8 text-emerald-400" />
            <span>Pengurusan Kenalan WhatsApp</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Urus pangkalan data kenalan, semak nombor E.164, dan import terus daripada spreadsheet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <>
              <button
                id="contacts-import-btn"
                onClick={onOpenImport}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors cursor-pointer flex items-center space-x-2 shadow-sm"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Import Excel / CSV</span>
              </button>

              <button
                id="contacts-add-btn"
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kenalan</span>
              </button>
            </>
          ) : (
            <button
              onClick={onRequireAdmin}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700 font-medium text-sm transition-all cursor-pointer flex items-center space-x-2"
              title="Masukkan PIN Admin (5313) untuk mengimport CSV dan mengurus kenalan"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Buka Admin Mode (PIN)</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Notice Banner when locked */}
      {!isAdmin && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 text-slate-300">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white">Mod Terkunci:</span> Butang import CSV, eksport, dan ubah data dilindungi dengan PIN keselamatan. Anda masih boleh memilih penerima untuk WhatsApp Blast.
            </div>
          </div>
          <button
            onClick={onRequireAdmin}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold transition-colors cursor-pointer shrink-0"
          >
            Aktifkan Admin Mode →
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, ID (cth. ST001), atau nombor telefon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Group Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">Semua Kumpulan ({contacts.length})</option>
              {groups.map(grp => (
                <option key={grp} value={grp}>
                  {grp} ({contacts.filter(c => c.group === grp).length})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">Semua Status</option>
              <option value="OPTED_IN">Opted-In (Aktif)</option>
              <option value="OPTED_OUT">Opted-Out (Dinyahaktifkan)</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
              <CheckSquare className="w-4 h-4" />
              <span>{selectedIds.length} kenalan dipilih</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigateToBlast()}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                🚀 Blast PDF kepada Pilihan
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    if (confirm(`Padamkan ${selectedIds.length} kenalan yang dipilih?`)) {
                      onDeleteBulk(selectedIds);
                      setSelectedIds([]);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Padam Pilihan</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Menunjukkan {filteredContacts.length} daripada {contacts.length} kenalan</span>
          {isAdmin ? (
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1 text-slate-300 hover:text-emerald-400 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksport CSV</span>
            </button>
          ) : (
            <button
              onClick={onRequireAdmin}
              className="flex items-center space-x-1 text-slate-500 hover:text-slate-400 cursor-pointer font-medium"
              title="Aktifkan Admin Mode untuk mengeksport CSV"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Eksport CSV (Admin)</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredContacts.length > 0 && selectedIds.length === filteredContacts.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-800 cursor-pointer"
                  />
                </th>
                <th className="p-4">ID</th>
                <th className="p-4">Nama Penuh</th>
                <th className="p-4">WhatsApp (E.164)</th>
                <th className="p-4">Kumpulan</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Tiada kenalan dijumpai mengikut tapisan.
                  </td>
                </tr>
              ) : (
                filteredContacts.map(c => {
                  const isChecked = selectedIds.includes(c.id);
                  return (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${isChecked ? 'bg-emerald-500/5' : ''}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(c.id)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-800 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-slate-300">
                        {c.externalId}
                      </td>
                      <td className="p-4 font-medium text-white">
                        <div>{c.name}</div>
                        {c.email && <div className="text-xs text-slate-500">{c.email}</div>}
                      </td>
                      <td className="p-4 font-mono text-xs text-emerald-400">
                        {formatPhoneDisplay(c.phone)}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-800 text-slate-200 border border-slate-700/60">
                          {c.group}
                        </span>
                      </td>
                      <td className="p-4">
                        {c.optInStatus === 'OPTED_IN' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            <span>Opted In</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/30">
                            <XCircle className="w-3 h-3" />
                            <span>Opted Out</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Ubah Maklumat Kenalan"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Padamkan ${c.name}?`)) {
                                  onDeleteContact(c.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Padam Kenalan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={onRequireAdmin}
                            className="p-1.5 text-slate-600 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Aktifkan Admin Mode untuk mengubah data kenalan ini"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Contact Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white">
              {editingContact ? 'Kemaskini Maklumat Kenalan' : 'Tambah Kenalan Baru'}
            </h3>

            <form onSubmit={handleSaveContact} className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">ID / Staff No.</label>
                <input
                  type="text"
                  required
                  value={formExternalId}
                  onChange={(e) => setFormExternalId(e.target.value)}
                  placeholder="Contoh: ST001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nama Penuh</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama penerima..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nombor WhatsApp (Format Malaysia / Antarabangsa)</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 60139500149 atau 013-9500149"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Sistem akan menapis dan menukar nombor ke piawaian E.164 secara automatik.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Kumpulan</label>
                  <input
                    type="text"
                    required
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value)}
                    placeholder="Staff / Faculty"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email (Pilihan)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@gov.my"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Simpan Kenalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
