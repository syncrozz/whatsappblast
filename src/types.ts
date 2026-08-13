export type OptInStatus = 'OPTED_IN' | 'OPTED_OUT';

export interface Contact {
  id: string;
  externalId: string;
  name: string;
  phone: string; // Sanitized E.164 (e.g. 60139500149)
  email?: string;
  group: string;
  tags: string[];
  optInStatus: OptInStatus;
  optInSource: string;
  optInAt: string;
  optOutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CampaignType = 'TEXT' | 'PDF';

export type CampaignStatus = 
  | 'DRAFT' 
  | 'QUEUED' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'PARTIAL' 
  | 'FAILED' 
  | 'CANCELLED';

export type RecipientStatus = 
  | 'QUEUED' 
  | 'SENDING' 
  | 'SENT' 
  | 'DELIVERED' 
  | 'READ' 
  | 'FAILED';

export interface MediaFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  dataUrl?: string; // For client preview
  storagePath?: string;
  whatsappMediaId?: string;
  uploadedAt: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactExternalId: string;
  status: RecipientStatus;
  renderedMessage: string;
  waMessageId?: string;
  errorReason?: string;
  retryCount?: number;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  caption: string;
  media?: MediaFile;
  status: CampaignStatus;
  targetType: 'ALL' | 'GROUP' | 'SELECTED';
  targetGroup?: string;
  targetCount: number;
  totalCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  pendingCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  recipients?: CampaignRecipient[];
}

export interface ColumnMapping {
  externalIdCol: string;
  nameCol: string;
  phoneCol: string;
  groupCol: string;
  emailCol: string;
}

export interface WhatsAppConfig {
  isConfigured: boolean;
  phoneNumberId: string;
  businessAccountId: string;
  hasToken: boolean;
  webhookVerifyToken: string;
  mode: 'LIVE' | 'SIMULATION_TEST';
  appUrl?: string;
}
