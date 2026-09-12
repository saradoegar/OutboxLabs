import { config } from '../config/env.js';

export interface IndexedEmail {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export const elasticsearchService = {
  baseUrl: config.elasticsearch.url,
  indexName: 'emails',

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/_cluster/health`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async ensureIndex(): Promise<void> {
    try {
      const checkRes = await fetch(`${this.baseUrl}/${this.indexName}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });

      if (checkRes.status === 404) {
        // Create index with mapping
        await fetch(`${this.baseUrl}/${this.indexName}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mappings: {
              properties: {
                id: { type: 'keyword' },
                sender: { type: 'keyword' },
                recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                subject: { type: 'text' },
                body: { type: 'text' },
                status: { type: 'keyword' },
                scheduledAt: { type: 'date' },
                sentAt: { type: 'date' },
                createdAt: { type: 'date' },
              },
            },
          }),
        });
        console.log(`[Elasticsearch] Index '${this.indexName}' created successfully.`);
      }
    } catch (e: any) {
      console.warn('[Elasticsearch] Could not ensure index:', e.message);
    }
  },

  async indexEmail(email: IndexedEmail): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/${this.indexName}/_doc/${encodeURIComponent(email.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email),
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch (err: any) {
      console.warn(`[Elasticsearch] Failed to index email ${email.id}:`, err.message);
      return false;
    }
  },

  async searchEmails(queryText: string): Promise<{
    total: number;
    hits: IndexedEmail[];
  }> {
    const isUp = await this.isHealthy();
    if (!isUp) {
      throw new Error('Elasticsearch cluster is unreachable at ' + this.baseUrl);
    }

    const query = {
      query: {
        multi_match: {
          query: queryText,
          fields: ['subject^3', 'body', 'recipient^2', 'sender'],
          fuzziness: 'AUTO',
        },
      },
    };

    const res = await fetch(`${this.baseUrl}/${this.indexName}/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Elasticsearch query error: ${errText}`);
    }

    const data = (await res.json()) as any;
    const hits = (data.hits?.hits || []).map((hit: any) => hit._source as IndexedEmail);

    return {
      total: data.hits?.total?.value || hits.length,
      hits,
    };
  },
};
