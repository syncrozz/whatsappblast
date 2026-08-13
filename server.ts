import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-Memory storage for production & dev consistency
interface MediaRecord {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  whatsappMediaId?: string;
  uploadedAt: string;
}

interface RecipientJob {
  id: string;
  campaignId: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactExternalId: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  renderedMessage: string;
  waMessageId?: string;
  errorReason?: string;
  retryCount?: number;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
}

interface ServerCampaign {
  id: string;
  name: string;
  type: 'TEXT' | 'PDF';
  caption: string;
  media?: MediaRecord;
  status: 'DRAFT' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';
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
  recipients: RecipientJob[];
}

const campaigns: Map<string, ServerCampaign> = new Map();
const mediaStore: Map<string, MediaRecord> = new Map();

// Active Worker Queue
let isQueueRunning = false;
const pendingJobQueue: RecipientJob[] = [];

// WhatsApp API configuration
let waConfig = {
  apiToken: process.env.WHATSAPP_API_TOKEN || "",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || "whatsapp_secure_verify_token_123",
  mode: (process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) ? 'LIVE' : 'SIMULATION_TEST'
};

// Queue Processor Worker
async function processQueue() {
  if (isQueueRunning || pendingJobQueue.length === 0) return;
  isQueueRunning = true;

  while (pendingJobQueue.length > 0) {
    const job = pendingJobQueue.shift();
    if (!job) continue;

    const campaign = campaigns.get(job.campaignId);
    if (!campaign || campaign.status === 'CANCELLED') {
      continue;
    }

    if (campaign.status === 'QUEUED') {
      campaign.status = 'PROCESSING';
      campaign.startedAt = new Date().toISOString();
    }

    job.status = 'SENDING';

    try {
      if (waConfig.mode === 'LIVE' && waConfig.apiToken && waConfig.phoneNumberId) {
        // Real WhatsApp Cloud API Call
        const endpoint = `https://graph.facebook.com/v21.0/${waConfig.phoneNumberId}/messages`;
        
        let payload: any = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: job.contactPhone,
        };

        if (campaign.type === 'PDF' && campaign.media) {
          payload.type = "document";
          payload.document = {
            filename: campaign.media.filename,
            caption: job.renderedMessage || undefined
          };
          if (campaign.media.whatsappMediaId) {
            payload.document.id = campaign.media.whatsappMediaId;
          } else if (campaign.media.dataUrl) {
            payload.document.link = campaign.media.dataUrl;
          }
        } else {
          payload.type = "text";
          payload.text = {
            preview_url: true,
            body: job.renderedMessage
          };
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${waConfig.apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();
        if (response.ok && resData.messages?.[0]?.id) {
          job.status = 'SENT';
          job.waMessageId = resData.messages[0].id;
          job.sentAt = new Date().toISOString();
          campaign.sentCount++;
          campaign.pendingCount = Math.max(0, campaign.pendingCount - 1);
        } else {
          job.status = 'FAILED';
          job.errorReason = resData?.error?.message || 'Meta API Error';
          job.failedAt = new Date().toISOString();
          campaign.failedCount++;
          campaign.pendingCount = Math.max(0, campaign.pendingCount - 1);
        }
      } else {
        // High-fidelity Test/Simulation Mode
        await new Promise((r) => setTimeout(r, 60)); // 60ms throttle (~16 msg/sec)
        
        // Check for test errors (e.g. invalid length)
        if (job.contactPhone.length < 9) {
          job.status = 'FAILED';
          job.errorReason = 'Format nombor telefon tidak sah';
          job.failedAt = new Date().toISOString();
          campaign.failedCount++;
          campaign.pendingCount = Math.max(0, campaign.pendingCount - 1);
        } else {
          job.status = 'SENT';
          job.waMessageId = `wamid.HBgM${Date.now()}${Math.floor(Math.random() * 100000)}`;
          job.sentAt = new Date().toISOString();
          campaign.sentCount++;
          campaign.pendingCount = Math.max(0, campaign.pendingCount - 1);

          // Simulate real-world delivery & read status transitions asynchronously
          const targetJob = job;
          const targetCampaignId = campaign.id;
          
          setTimeout(() => {
            if (targetJob.status === 'SENT') {
              targetJob.status = 'DELIVERED';
              targetJob.deliveredAt = new Date().toISOString();
              const c = campaigns.get(targetCampaignId);
              if (c) c.deliveredCount++;
            }
          }, 600 + Math.random() * 1200);

          setTimeout(() => {
            if (targetJob.status === 'DELIVERED' && Math.random() > 0.15) {
              targetJob.status = 'READ';
              targetJob.readAt = new Date().toISOString();
              const c = campaigns.get(targetCampaignId);
              if (c) c.readCount++;
            }
          }, 1800 + Math.random() * 2500);
        }
      }
    } catch (err: any) {
      job.status = 'FAILED';
      job.errorReason = err.message || 'Ralat sambungan rangkaian';
      job.failedAt = new Date().toISOString();
      campaign.failedCount++;
      campaign.pendingCount = Math.max(0, campaign.pendingCount - 1);
    }

    // Check if campaign completed
    if (campaign.pendingCount === 0) {
      campaign.status = campaign.failedCount > 0 && campaign.sentCount === 0 
        ? 'FAILED' 
        : campaign.failedCount > 0 
          ? 'PARTIAL' 
          : 'COMPLETED';
      campaign.completedAt = new Date().toISOString();
    }
  }

  isQueueRunning = false;
}

// ----------------- API ROUTES -----------------

// Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Config & Mode
app.get("/api/config", (_req: Request, res: Response) => {
  res.json({
    isConfigured: Boolean(waConfig.apiToken && waConfig.phoneNumberId),
    phoneNumberId: waConfig.phoneNumberId ? `${waConfig.phoneNumberId.slice(0, 4)}...${waConfig.phoneNumberId.slice(-3)}` : "",
    businessAccountId: waConfig.businessAccountId || "",
    hasToken: Boolean(waConfig.apiToken),
    webhookVerifyToken: waConfig.webhookVerifyToken,
    mode: waConfig.mode,
    appUrl: process.env.APP_URL || ""
  });
});

app.post("/api/config", (req: Request, res: Response) => {
  const { apiToken, phoneNumberId, businessAccountId, webhookVerifyToken, mode } = req.body;
  if (apiToken !== undefined) waConfig.apiToken = apiToken;
  if (phoneNumberId !== undefined) waConfig.phoneNumberId = phoneNumberId;
  if (businessAccountId !== undefined) waConfig.businessAccountId = businessAccountId;
  if (webhookVerifyToken !== undefined) waConfig.webhookVerifyToken = webhookVerifyToken;
  if (mode !== undefined) waConfig.mode = mode;
  
  res.json({ success: true, mode: waConfig.mode });
});

// Media Upload & Validation
app.post("/api/media/upload", (req: Request, res: Response) => {
  try {
    const { filename, mimeType, size, dataUrl } = req.body;

    if (!filename || !mimeType) {
      return res.status(400).json({ error: "Fail tidak sah. Parameter filename dan mimeType diperlukan." });
    }

    if (mimeType !== "application/pdf" && !filename.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "Hanya fail format PDF (.pdf) dibenarkan untuk PDF Blast." });
    }

    const MAX_SIZE = 16 * 1024 * 1024; // 16MB WhatsApp Doc limit
    if (size > MAX_SIZE) {
      return res.status(400).json({ error: "Saiz fail melebihi had maksimum 16MB WhatsApp Business API." });
    }

    const mediaId = `med_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const mediaRecord: MediaRecord = {
      id: mediaId,
      filename: filename.replace(/[^a-zA-Z0-9._-]/g, '_'),
      mimeType: "application/pdf",
      size: Number(size),
      dataUrl,
      whatsappMediaId: `wa_media_${Date.now()}`,
      uploadedAt: new Date().toISOString()
    };

    mediaStore.set(mediaId, mediaRecord);
    res.json({ success: true, media: mediaRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Gagal memproses fail PDF" });
  }
});

// Create & Dispatch Campaign (Text or One-Command PDF Blast)
app.post("/api/campaigns", (req: Request, res: Response) => {
  try {
    const { name, type, caption, mediaId, targetType, targetGroup, recipients } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "Sila pilih sekurang-kurangnya seorang penerima yang sah." });
    }

    let mediaRecord: MediaRecord | undefined;
    if (type === 'PDF') {
      if (!mediaId || !mediaStore.has(mediaId)) {
        return res.status(400).json({ error: "Fail PDF sah diperlukan untuk PDF Blast." });
      }
      mediaRecord = mediaStore.get(mediaId);
    }

    const campaignId = `cmp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const jobs: RecipientJob[] = recipients.map((r: any, idx: number) => {
      // Personalize message with variables {{name}}, {{id}}, {{phone}}, {{group}}
      let rendered = caption || "";
      rendered = rendered.replace(/\{\{\s*name\s*\}\}/gi, r.name || 'Pelanggan');
      rendered = rendered.replace(/\{\{\s*id\s*\}\}/gi, r.externalId || r.id || '');
      rendered = rendered.replace(/\{\{\s*phone\s*\}\}/gi, r.phone || '');
      rendered = rendered.replace(/\{\{\s*group\s*\}\}/gi, r.group || '');

      return {
        id: `job_${campaignId}_${idx + 1}`,
        campaignId,
        contactId: r.id,
        contactName: r.name,
        contactPhone: r.phone,
        contactExternalId: r.externalId || '',
        status: 'QUEUED',
        renderedMessage: rendered,
      };
    });

    const newCampaign: ServerCampaign = {
      id: campaignId,
      name: name || (type === 'PDF' ? `PDF Blast - ${mediaRecord?.filename || 'Document'}` : `Text Blast - ${new Date().toLocaleDateString()}`),
      type,
      caption: caption || "",
      media: mediaRecord,
      status: 'QUEUED',
      targetType: targetType || 'ALL',
      targetGroup,
      targetCount: recipients.length,
      totalCount: recipients.length,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      failedCount: 0,
      pendingCount: recipients.length,
      createdAt: now,
      recipients: jobs
    };

    campaigns.set(campaignId, newCampaign);

    // Enqueue jobs
    pendingJobQueue.push(...jobs);
    processQueue();

    res.json({ success: true, campaign: newCampaign });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Gagal mencipta kempen penghantaran" });
  }
});

// List Campaigns
app.get("/api/campaigns", (_req: Request, res: Response) => {
  const list = Array.from(campaigns.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ campaigns: list });
});

// Get Single Campaign with Recipients
app.get("/api/campaigns/:id", (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: "Kempen tidak dijumpai" });
  }
  res.json({ campaign });
});

// Cancel Campaign
app.post("/api/campaigns/:id/cancel", (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: "Kempen tidak dijumpai" });
  }

  if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED') {
    return res.status(400).json({ error: "Kempen telah selesai atau dibatalkan." });
  }

  campaign.status = 'CANCELLED';
  campaign.recipients.forEach(r => {
    if (r.status === 'QUEUED' || r.status === 'SENDING') {
      r.status = 'FAILED';
      r.errorReason = 'Dibatalkan oleh pengguna';
      campaign.failedCount++;
      campaign.pendingCount = Math.max(0, campaign.pendingCount - 1);
    }
  });

  res.json({ success: true, campaign });
});

// Official WhatsApp Webhook Endpoint
app.get("/api/webhook/whatsapp", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === waConfig.webhookVerifyToken) {
    console.log("WhatsApp Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/api/webhook/whatsapp", (req: Request, res: Response) => {
  const body = req.body;
  if (body.object === "whatsapp_business_account") {
    body.entry?.forEach((entry: any) => {
      entry.changes?.forEach((change: any) => {
        const statuses = change.value?.statuses;
        if (statuses && Array.isArray(statuses)) {
          statuses.forEach((statusObj: any) => {
            const waMsgId = statusObj.id;
            const newStatus = statusObj.status; // sent, delivered, read, failed

            // Update matching recipient in active campaigns
            for (const campaign of campaigns.values()) {
              const recipient = campaign.recipients.find(r => r.waMessageId === waMsgId);
              if (recipient) {
                if (newStatus === 'delivered' && recipient.status !== 'READ') {
                  recipient.status = 'DELIVERED';
                  recipient.deliveredAt = new Date().toISOString();
                  campaign.deliveredCount++;
                } else if (newStatus === 'read') {
                  recipient.status = 'READ';
                  recipient.readAt = new Date().toISOString();
                  campaign.readCount++;
                } else if (newStatus === 'failed') {
                  recipient.status = 'FAILED';
                  recipient.errorReason = statusObj.errors?.[0]?.title || 'Penghantaran gagal melalui Meta WhatsApp';
                  campaign.failedCount++;
                }
                break;
              }
            }
          });
        }
      });
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ----------------- VITE & STATIC SERVING -----------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WhatsApp Communication Platform Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
