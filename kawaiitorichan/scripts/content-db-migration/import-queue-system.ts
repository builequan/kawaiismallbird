import { GenericArticle } from './multi-database-connection';
import { batchUpload, type MigrationConfig, type UploadResult } from './upload-to-payload';
import { articleToLexical, applyLanguageFormatting } from './article-to-lexical';
import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

// Queue item interface
export interface QueueItem {
  id: string;
  article: GenericArticle;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  result?: UploadResult;
  error?: string;
  retryCount: number;
  addedAt: Date;
  processedAt?: Date;
  customData?: Record<string, any>;
}

// Import queue interface
export interface ImportQueue {
  id: string;
  name: string;
  description?: string;
  items: QueueItem[];
  config: MigrationConfig;
  status: 'idle' | 'processing' | 'paused' | 'completed' | 'failed';
  schedule?: {
    type: 'immediate' | 'scheduled' | 'recurring';
    time?: Date;
    interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    lastRun?: Date;
    nextRun?: Date;
  };
  settings: {
    batchSize: number;
    maxRetries: number;
    pauseOnError: boolean;
    skipDuplicates: boolean;
    autoMapping: boolean;
    notifyOnComplete: boolean;
  };
  statistics: {
    totalItems: number;
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
    startTime?: Date;
    endTime?: Date;
    estimatedTimeRemaining?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Queue events
export interface QueueEvents {
  'item:start': (item: QueueItem) => void;
  'item:complete': (item: QueueItem, result: UploadResult) => void;
  'item:error': (item: QueueItem, error: Error) => void;
  'item:retry': (item: QueueItem, attempt: number) => void;
  'queue:start': (queue: ImportQueue) => void;
  'queue:pause': (queue: ImportQueue) => void;
  'queue:resume': (queue: ImportQueue) => void;
  'queue:complete': (queue: ImportQueue) => void;
  'queue:error': (queue: ImportQueue, error: Error) => void;
  'progress': (current: number, total: number, percentage: number) => void;
}

// Import queue manager class
export class ImportQueueManager extends EventEmitter {
  private queues: Map<string, ImportQueue> = new Map();
  private activeQueue: ImportQueue | null = null;
  private isProcessing: boolean = false;
  private isPaused: boolean = false;
  private queueStoragePath: string;
  private processInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.queueStoragePath = path.join(__dirname, 'import-queues');
    this.ensureStorageDirectory();
    this.loadQueues();
    this.startScheduler();
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.queueStoragePath)) {
      fs.mkdirSync(this.queueStoragePath, { recursive: true });
    }
  }

  // Create a new import queue
  createQueue(
    name: string,
    articles: GenericArticle[],
    config: MigrationConfig,
    settings?: Partial<ImportQueue['settings']>,
    schedule?: ImportQueue['schedule']
  ): ImportQueue {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queue: ImportQueue = {
      id: queueId,
      name,
      items: articles.map(article => ({
        id: `item_${article.id}_${Date.now()}`,
        article,
        status: 'pending',
        retryCount: 0,
        addedAt: new Date(),
      })),
      config,
      status: 'idle',
      schedule,
      settings: {
        batchSize: 10,
        maxRetries: 3,
        pauseOnError: false,
        skipDuplicates: true,
        autoMapping: true,
        notifyOnComplete: true,
        ...settings,
      },
      statistics: {
        totalItems: articles.length,
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queues.set(queueId, queue);
    this.saveQueue(queue);

    return queue;
  }

  // Add items to existing queue
  addToQueue(queueId: string, articles: GenericArticle[]): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    const newItems: QueueItem[] = articles.map(article => ({
      id: `item_${article.id}_${Date.now()}`,
      article,
      status: 'pending' as const,
      retryCount: 0,
      addedAt: new Date(),
    }));

    queue.items.push(...newItems);
    queue.statistics.totalItems += articles.length;
    queue.updatedAt = new Date();

    this.saveQueue(queue);
    return true;
  }

  // Start processing a queue
  async startQueue(queueId: string): Promise<void> {
    const queue = this.queues.get(queueId);
    if (!queue) throw new Error(`Queue ${queueId} not found`);

    if (this.isProcessing) {
      throw new Error('Another queue is already being processed');
    }

    this.activeQueue = queue;
    this.isProcessing = true;
    this.isPaused = false;

    queue.status = 'processing';
    queue.statistics.startTime = new Date();

    this.emit('queue:start', queue);

    try {
      await this.processQueue(queue);
    } catch (error) {
      queue.status = 'failed';
      this.emit('queue:error', queue, error as Error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.activeQueue = null;
    }
  }

  // Process queue items
  private async processQueue(queue: ImportQueue): Promise<void> {
    const pendingItems = queue.items.filter(item =>
      item.status === 'pending' || (item.status === 'failed' && item.retryCount < queue.settings.maxRetries)
    );

    // Process in batches
    for (let i = 0; i < pendingItems.length; i += queue.settings.batchSize) {
      if (this.isPaused) {
        queue.status = 'paused';
        this.emit('queue:pause', queue);
        return;
      }

      const batch = pendingItems.slice(i, i + queue.settings.batchSize);
      await this.processBatch(queue, batch);

      // Update progress
      const processed = queue.items.filter(item =>
        ['completed', 'failed', 'skipped'].includes(item.status)
      ).length;

      const percentage = (processed / queue.statistics.totalItems) * 100;
      this.emit('progress', processed, queue.statistics.totalItems, percentage);

      // Estimate time remaining
      if (queue.statistics.startTime) {
        const elapsed = Date.now() - queue.statistics.startTime.getTime();
        const rate = processed / elapsed;
        const remaining = queue.statistics.totalItems - processed;
        queue.statistics.estimatedTimeRemaining = remaining / rate;
      }

      this.saveQueue(queue);
    }

    // Mark queue as completed
    queue.status = 'completed';
    queue.statistics.endTime = new Date();
    this.saveQueue(queue);

    this.emit('queue:complete', queue);

    if (queue.settings.notifyOnComplete) {
      this.sendNotification(queue);
    }
  }

  // Process a batch of items
  private async processBatch(queue: ImportQueue, items: QueueItem[]): Promise<void> {
    const promises = items.map(async item => {
      try {
        item.status = 'processing';
        this.emit('item:start', item);

        // Convert article to required format
        const lexicalContent = await articleToLexical(item.article as any);
        const formattedContent = applyLanguageFormatting(lexicalContent, queue.config.language);

        // Simulate upload (replace with actual upload logic)
        const result = await this.uploadArticle(item.article, formattedContent, queue.config);

        if (result.success) {
          item.status = 'completed';
          item.result = result;
          queue.statistics.succeeded++;
          this.emit('item:complete', item, result);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        item.retryCount++;

        if (item.retryCount < queue.settings.maxRetries) {
          item.status = 'pending'; // Will be retried
          this.emit('item:retry', item, item.retryCount);
        } else {
          item.status = 'failed';
          item.error = error instanceof Error ? error.message : String(error);
          queue.statistics.failed++;
          this.emit('item:error', item, error as Error);

          if (queue.settings.pauseOnError) {
            this.pauseQueue();
          }
        }
      } finally {
        item.processedAt = new Date();
        queue.statistics.processed++;
      }
    });

    await Promise.all(promises);
  }

  // Upload article (placeholder - integrate with actual upload logic)
  private async uploadArticle(
    article: GenericArticle,
    lexicalContent: any,
    config: MigrationConfig
  ): Promise<UploadResult> {
    // This should integrate with the actual upload-to-payload.ts logic
    // For now, returning a mock result
    return {
      success: true,
      articleId: Number(article.id),
      payloadId: `payload_${article.id}`,
      title: article.title,
    };
  }

  // Pause queue processing
  pauseQueue(): void {
    if (this.isProcessing && !this.isPaused) {
      this.isPaused = true;
      if (this.activeQueue) {
        this.activeQueue.status = 'paused';
        this.emit('queue:pause', this.activeQueue);
      }
    }
  }

  // Resume queue processing
  async resumeQueue(): Promise<void> {
    if (this.isPaused && this.activeQueue) {
      this.isPaused = false;
      this.activeQueue.status = 'processing';
      this.emit('queue:resume', this.activeQueue);
      await this.processQueue(this.activeQueue);
    }
  }

  // Cancel queue processing
  cancelQueue(queueId: string): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    if (this.activeQueue?.id === queueId) {
      this.isProcessing = false;
      this.activeQueue = null;
    }

    queue.status = 'idle';
    queue.items.forEach(item => {
      if (item.status === 'processing') {
        item.status = 'pending';
      }
    });

    this.saveQueue(queue);
    return true;
  }

  // Delete queue
  deleteQueue(queueId: string): boolean {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    if (this.activeQueue?.id === queueId) {
      this.cancelQueue(queueId);
    }

    this.queues.delete(queueId);
    const filePath = path.join(this.queueStoragePath, `${queueId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return true;
  }

  // Get queue by ID
  getQueue(queueId: string): ImportQueue | undefined {
    return this.queues.get(queueId);
  }

  // Get all queues
  getAllQueues(): ImportQueue[] {
    return Array.from(this.queues.values());
  }

  // Get queue statistics
  getQueueStats(queueId: string): ImportQueue['statistics'] | undefined {
    return this.queues.get(queueId)?.statistics;
  }

  // Save queue to file
  private saveQueue(queue: ImportQueue): void {
    const filePath = path.join(this.queueStoragePath, `${queue.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(queue, null, 2));
  }

  // Load queues from storage
  private loadQueues(): void {
    if (!fs.existsSync(this.queueStoragePath)) return;

    const files = fs.readdirSync(this.queueStoragePath);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(this.queueStoragePath, file);
          const data = fs.readFileSync(filePath, 'utf-8');
          const queue = JSON.parse(data) as ImportQueue;

          // Convert date strings back to Date objects
          queue.createdAt = new Date(queue.createdAt);
          queue.updatedAt = new Date(queue.updatedAt);
          queue.items.forEach(item => {
            item.addedAt = new Date(item.addedAt);
            if (item.processedAt) item.processedAt = new Date(item.processedAt);
          });

          this.queues.set(queue.id, queue);
        } catch (error) {
          console.error(`Error loading queue from ${file}:`, error);
        }
      }
    });
  }

  // Start scheduler for recurring queues
  private startScheduler(): void {
    this.processInterval = setInterval(() => {
      this.checkScheduledQueues();
    }, 60000); // Check every minute
  }

  // Check for scheduled queues
  private checkScheduledQueues(): void {
    const now = new Date();

    this.queues.forEach(queue => {
      if (queue.schedule && queue.status === 'idle') {
        const shouldRun = this.shouldRunScheduledQueue(queue, now);

        if (shouldRun && !this.isProcessing) {
          this.startQueue(queue.id).catch(error => {
            console.error(`Error running scheduled queue ${queue.id}:`, error);
          });
        }
      }
    });
  }

  // Check if scheduled queue should run
  private shouldRunScheduledQueue(queue: ImportQueue, now: Date): boolean {
    if (!queue.schedule) return false;

    switch (queue.schedule.type) {
      case 'immediate':
        return !queue.schedule.lastRun;

      case 'scheduled':
        return queue.schedule.time && new Date(queue.schedule.time) <= now && !queue.schedule.lastRun;

      case 'recurring':
        if (!queue.schedule.lastRun) return true;

        const lastRun = new Date(queue.schedule.lastRun);
        const interval = queue.schedule.interval;

        switch (interval) {
          case 'hourly':
            return now.getTime() - lastRun.getTime() >= 3600000;
          case 'daily':
            return now.getTime() - lastRun.getTime() >= 86400000;
          case 'weekly':
            return now.getTime() - lastRun.getTime() >= 604800000;
          case 'monthly':
            return now.getMonth() !== lastRun.getMonth() || now.getFullYear() !== lastRun.getFullYear();
          default:
            return false;
        }

      default:
        return false;
    }
  }

  // Send notification (placeholder)
  private sendNotification(queue: ImportQueue): void {
    console.log(`\n📢 Queue "${queue.name}" completed!`);
    console.log(`   Total: ${queue.statistics.totalItems}`);
    console.log(`   Succeeded: ${queue.statistics.succeeded}`);
    console.log(`   Failed: ${queue.statistics.failed}`);
    console.log(`   Skipped: ${queue.statistics.skipped}`);
  }

  // Export queue data
  exportQueue(queueId: string): string | null {
    const queue = this.queues.get(queueId);
    if (!queue) return null;

    return JSON.stringify(queue, null, 2);
  }

  // Import queue data
  importQueue(data: string): ImportQueue | null {
    try {
      const queue = JSON.parse(data) as ImportQueue;
      queue.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.queues.set(queue.id, queue);
      this.saveQueue(queue);
      return queue;
    } catch (error) {
      console.error('Error importing queue:', error);
      return null;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }
    this.removeAllListeners();
  }
}