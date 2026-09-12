import { Router, Request, Response } from 'express';
import { elasticsearchService } from '../services/elasticsearch.service.js';

export const searchRouter = Router();

searchRouter.get('/', async (req: Request, res: Response) => {
  const queryText = (req.query.q as string) || '';

  if (!queryText.trim()) {
    return res.status(400).json({ error: { message: "Query parameter 'q' is required for search" } });
  }

  try {
    const results = await elasticsearchService.searchEmails(queryText);
    res.json({
      query: queryText,
      total: results.total,
      results: results.hits,
    });
  } catch (err: any) {
    res.status(503).json({
      error: {
        message: err.message || 'Elasticsearch search service error',
        status: 503,
      },
    });
  }
});
