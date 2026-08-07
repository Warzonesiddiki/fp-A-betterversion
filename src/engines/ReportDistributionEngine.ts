import { randomId } from '@/utils/cryptoId';
// =============================================================================
// REPORT DISTRIBUTION ENGINE — Email delivery, recipient management
// Pure TypeScript, deterministic, no external dependencies
// =============================================================================

export type DeliveryMethod = 'email' | 'file' | 'webhook';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  role: string;
  groups: string[];
  active: boolean;
}

export interface DistributionList {
  id: string;
  name: string;
  description: string;
  recipientIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRecord {
  id: string;
  reportId: string;
  distributionListId: string;
  method: DeliveryMethod;
  sentAt: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  error?: string;
}

export interface DeliveryConfig {
  method: DeliveryMethod;
  subject?: string;
  body?: string;
  attachFormats: ('pdf' | 'excel' | 'csv')[];
  priority: 'low' | 'normal' | 'high';
  retryOnFailure: boolean;
  maxRetries: number;
}

export class ReportDistributionEngine {
  private recipients = new Map<string, Recipient>();
  private distributionLists = new Map<string, DistributionList>();
  private deliveryRecords: DeliveryRecord[] = [];

  addRecipient(name: string, email: string, role: string = 'viewer'): Recipient {
    const id = randomId('rcpt');
    const recipient: Recipient = { id, name, email, role, groups: [], active: true };
    this.recipients.set(id, recipient);
    return recipient;
  }

  getRecipient(id: string): Recipient | undefined {
    return this.recipients.get(id);
  }

  listRecipients(): Recipient[] {
    return Array.from(this.recipients.values());
  }

  updateRecipient(
    id: string,
    updates: Partial<Pick<Recipient, 'name' | 'email' | 'role' | 'active'>>
  ): Recipient | null {
    const r = this.recipients.get(id);
    if (!r) return null;
    Object.assign(r, updates);
    return r;
  }

  deleteRecipient(id: string): boolean {
    return this.recipients.delete(id);
  }

  createDistributionList(
    name: string,
    description: string,
    recipientIds: string[] = []
  ): DistributionList {
    const id = randomId('dlist');
    const list: DistributionList = {
      id,
      name,
      description,
      recipientIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.distributionLists.set(id, list);
    return list;
  }

  getDistributionList(id: string): DistributionList | undefined {
    return this.distributionLists.get(id);
  }

  listDistributionLists(): DistributionList[] {
    return Array.from(this.distributionLists.values());
  }

  addToDistributionList(listId: string, recipientId: string): boolean {
    const list = this.distributionLists.get(listId);
    if (!list || list.recipientIds.includes(recipientId)) return false;
    list.recipientIds.push(recipientId);
    list.updatedAt = new Date().toISOString();
    return true;
  }

  removeFromDistributionList(listId: string, recipientId: string): boolean {
    const list = this.distributionLists.get(listId);
    if (!list) return false;
    const idx = list.recipientIds.indexOf(recipientId);
    if (idx === -1) return false;
    list.recipientIds.splice(idx, 1);
    list.updatedAt = new Date().toISOString();
    return true;
  }

  deleteDistributionList(id: string): boolean {
    return this.distributionLists.delete(id);
  }

  recordDelivery(
    reportId: string,
    distributionListId: string,
    config: DeliveryConfig
  ): DeliveryRecord {
    const list = this.distributionLists.get(distributionListId);
    const recipientCount = list
      ? list.recipientIds.filter((rid) => this.recipients.get(rid)?.active).length
      : 0;

    const record: DeliveryRecord = {
      id: randomId('del'),
      reportId,
      distributionListId,
      method: config.method,
      sentAt: new Date().toISOString(),
      status: 'sent',
      recipientCount,
      deliveredCount: recipientCount,
      failedCount: 0,
    };

    this.deliveryRecords.push(record);
    return record;
  }

  updateDeliveryStatus(
    id: string,
    status: DeliveryRecord['status'],
    error?: string
  ): DeliveryRecord | null {
    const record = this.deliveryRecords.find((r) => r.id === id);
    if (!record) return null;
    record.status = status;
    if (error) record.error = error;
    if (status === 'failed') {
      record.failedCount = record.recipientCount;
      record.deliveredCount = 0;
    }
    return record;
  }

  getDeliveryHistory(reportId?: string): DeliveryRecord[] {
    if (reportId) return this.deliveryRecords.filter((r) => r.reportId === reportId);
    return [...this.deliveryRecords];
  }

  getDeliveryStats(): { totalSent: number; totalDelivered: number; totalFailed: number } {
    return {
      totalSent: this.deliveryRecords.length,
      totalDelivered: this.deliveryRecords.filter((r) => r.status === 'delivered').length,
      totalFailed: this.deliveryRecords.filter((r) => r.status === 'failed').length,
    };
  }

  serialize(): string {
    return JSON.stringify({
      recipients: Array.from(this.recipients.entries()),
      distributionLists: Array.from(this.distributionLists.entries()),
      deliveryRecords: this.deliveryRecords,
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.recipients = new Map(parsed.recipients);
    this.distributionLists = new Map(parsed.distributionLists);
    this.deliveryRecords = parsed.deliveryRecords;
  }
}
