import { z } from 'zod';
import { customQuery } from '../clients/elasticsearch';
import { TIMESTAMP_FIELD_MAP } from '../constants';

/**
 * Elasticsearch Transaction Query Tool for AI SDK
 */
export const elasticsearchTransactionTool = {
  description: `Query BPA transaction logs (fluentd-bpa.log-*). Primary tool for investigating operational issues.

Core workflow:
1. Count first (detect excessive calls if >200)
2. Query with _source exclusion (fast overview)
3. Analyze errors via status=500, func_name patterns
4. Include log_data only for error detail analysis

Index: fluentd-bpa.log-* (date-based)
Retention: Depends on Fluentd health (check kube-events if logs missing)

Primary correlation: service_key wildcard "*_{vehicle_number}_*" from Notion
Time strategy: Use reception_time as upper bound, issue occurs BEFORE complaint`,

  inputSchema: z.object({
    query: z.any().describe(`Elasticsearch DSL query object`),
    size: z.number().optional().describe('Result count (default: 10)'),
    from: z.number().optional().describe('Starting offset for pagination'),
    sort: z.any().optional().describe('Sort array'),
    _source: z.any().optional().describe('Field filtering'),
    track_total_hits: z.union([z.boolean(), z.number()]).optional(),
    search_after: z.any().optional(),
    fields: z.array(z.string()).optional(),
    aggs: z.any().optional(),
    highlight: z.any().optional(),
    collapse: z.any().optional(),
    timeout: z.string().optional(),
  }),

  execute: async (args: any) => {
    const {
      query,
      size,
      from,
      sort,
      _source,
      track_total_hits,
      search_after,
      fields,
      aggs,
      highlight,
      collapse,
      timeout,
    } = args;

    const indexPattern = "fluentd-bpa.log-*";
    const timestampField = TIMESTAMP_FIELD_MAP[indexPattern];

    const result = await customQuery(indexPattern, query, {
      size,
      from,
      aggs,
      sort,
      _source,
      track_total_hits,
      search_after,
      fields,
      highlight,
      collapse,
      timeout,
      timestampField,
    });

    return result;
  },
};
