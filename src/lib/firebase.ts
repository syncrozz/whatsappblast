import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Contact, Campaign, WhatsAppConfig } from '../types';
import { generateInitialContacts } from '../utils/seedData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Database ID if specified
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const CONTACTS_COLLECTION = 'contacts';
const CAMPAIGNS_COLLECTION = 'campaigns';
const SETTINGS_COLLECTION = 'system_settings';
const CONFIG_DOC_ID = 'whatsapp_config';

/**
 * Fetch all contacts from Firestore. If collection is empty, seed with initial 75+ contacts.
 */
export async function loadPersistentContacts(): Promise<{ contacts: Contact[]; fromCloud: boolean }> {
  try {
    const contactsRef = collection(db, CONTACTS_COLLECTION);
    const snapshot = await getDocs(contactsRef);

    if (!snapshot.empty) {
      const cloudContacts: Contact[] = [];
      snapshot.forEach((docSnap) => {
        cloudContacts.push(docSnap.data() as Contact);
      });
      // Sort by externalId or name
      cloudContacts.sort((a, b) => a.externalId.localeCompare(b.externalId, undefined, { numeric: true }));
      return { contacts: cloudContacts, fromCloud: true };
    }

    // If Firestore is empty (first launch for Owner), seed initial 75+ contacts
    const initialSeed = generateInitialContacts();
    await saveBulkContactsToFirestore(initialSeed);
    return { contacts: initialSeed, fromCloud: true };
  } catch (error) {
    console.warn('Firebase Firestore unavailable or offline, fallback to local store:', error);
    // Fallback to local storage or seed
    const localSaved = localStorage.getItem('wa_hub_contacts');
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { contacts: parsed, fromCloud: false };
        }
      } catch (e) {}
    }
    return { contacts: generateInitialContacts(), fromCloud: false };
  }
}

/**
 * Save single contact to Firestore
 */
export async function saveContactToFirestore(contact: Contact): Promise<void> {
  try {
    const docRef = doc(db, CONTACTS_COLLECTION, contact.id);
    await setDoc(docRef, contact, { merge: true });
  } catch (error) {
    console.error('Error saving contact to Firestore:', error);
  }
}

/**
 * Save multiple contacts in batch (e.g. initial seed or CSV import)
 */
export async function saveBulkContactsToFirestore(contacts: Contact[]): Promise<void> {
  try {
    const chunks = [];
    const CHUNK_SIZE = 450; // Firestore batch limit is 500
    for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
      chunks.push(contacts.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const contact of chunk) {
        const docRef = doc(db, CONTACTS_COLLECTION, contact.id);
        batch.set(docRef, contact, { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    console.error('Error bulk saving contacts to Firestore:', error);
  }
}

/**
 * Delete single contact from Firestore
 */
export async function deleteContactFromFirestore(contactId: string): Promise<void> {
  try {
    const docRef = doc(db, CONTACTS_COLLECTION, contactId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting contact from Firestore:', error);
  }
}

/**
 * Delete multiple contacts in batch
 */
export async function deleteBulkContactsFromFirestore(contactIds: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const id of contactIds) {
      const docRef = doc(db, CONTACTS_COLLECTION, id);
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (error) {
    console.error('Error bulk deleting contacts from Firestore:', error);
  }
}

/**
 * Save campaign record to Firestore
 */
export async function saveCampaignToFirestore(campaign: Campaign): Promise<void> {
  try {
    // Strip large media dataUrl to prevent exceeding 1MB Firestore document limit
    const cleanMedia = campaign.media ? {
      id: campaign.media.id,
      filename: campaign.media.filename,
      mimeType: campaign.media.mimeType,
      size: campaign.media.size,
      whatsappMediaId: campaign.media.whatsappMediaId,
      uploadedAt: campaign.media.uploadedAt
    } : undefined;

    const campaignToSave: Partial<Campaign> = {
      ...campaign,
      media: cleanMedia as any
    };

    const docRef = doc(db, CAMPAIGNS_COLLECTION, campaign.id);
    await setDoc(docRef, campaignToSave, { merge: true });
  } catch (error) {
    console.error('Error saving campaign to Firestore:', error);
  }
}

/**
 * Load campaigns from Firestore
 */
export async function loadCampaignsFromFirestore(): Promise<Campaign[]> {
  try {
    const campaignsRef = collection(db, CAMPAIGNS_COLLECTION);
    const q = query(campaignsRef, limit(50));
    const snapshot = await getDocs(q);
    const list: Campaign[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Campaign);
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    console.warn('Could not load campaigns from Firestore:', error);
    return [];
  }
}

/**
 * Save WhatsApp Config to Firestore
 */
export async function saveConfigToFirestore(config: Partial<WhatsAppConfig>): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    await setDoc(docRef, config, { merge: true });
  } catch (error) {
    console.error('Error saving config to Firestore:', error);
  }
}

/**
 * Load WhatsApp Config from Firestore
 */
export async function loadConfigFromFirestore(): Promise<Partial<WhatsAppConfig> | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Partial<WhatsAppConfig>;
    }
    return null;
  } catch (error) {
    console.warn('Could not load config from Firestore:', error);
    return null;
  }
}
