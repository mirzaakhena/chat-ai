import { z } from 'zod';
import { customQuery } from '../clients/elasticsearch';
import { TIMESTAMP_FIELD_MAP } from '../utils/constants';

/**
 * Elasticsearch Transaction Query Tool for AI SDK
 *
 * PURPOSE: Trace BPA operations, detect errors, analyze patterns
 *
 * WHEN TO USE:
 * - After extracting vehicle_number from Notion (primary correlation)
 * - Investigating "gate entry", "receipt error", "transport order" issues
 * - Detecting excessive API calls (count > 200 in short period)
 *
 * QUERY STRATEGY:
 * 1. COUNT FIRST: {"size": 0, "track_total_hits": true} to detect excessive calls
 * 2. OVERVIEW: {"_source": {"excludes": ["log_data"]}} for fast pattern detection
 * 3. DEEP DIVE: Include log_data only when error details needed
 *
 * CRITICAL HINTS:
 * - Primary search: service_key wildcard "*_{vehicle_number}_*"
 * - Time correlation: Use reception_time as UPPER BOUND (issue happens before complaint)
 * - Performance: ALWAYS exclude log_data initially (large field, several KB per doc)
 * - Excessive calls: count > 200 is NORMAL system behavior, use aggregations
 * - Field types: Use .keyword suffix for exact match (except in_out)
 * - Status codes: type="req" has status=0, check type="res" for actual errors (200/500)
 * - Timestamp: Use @timestamp (UTC) for queries, NOT timestamp (GMT+9 display field)
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
    query: z.any().describe(`Elasticsearch DSL query.

Essential fields:
- service_key: Vehicle journey ID, use wildcard "*_{vehicle}_*" (keyword field)
- @timestamp: UTC time for range filters (NOT 'timestamp' which is GMT+9 display)
- type: "req" (request) or "res" (response) - check "res" for error status
- func_name: Operation like GateIn, GateOut, GetCopinoWithReservation (use .keyword for exact)
- status: 0=request, 200=success, 500=error (integer field)
- session_id: Request-response pairing (keyword)
- channel: Terminal routing, use wildcard "hjnpc010-*" (keyword)
- in_out: "1"=entering, "2"=exiting (text, NO .keyword suffix)

⚠️ PERFORMANCE: Exclude log_data unless specifically needed for error messages
Example: {"_source": {"excludes": ["log_data"]}}

⚠️ EXCESSIVE CALLS: If count > 200, use aggregations instead of fetching all docs`),
    size: z.number().optional().describe('Result count (default: 10). Use 0 with track_total_hits for count-only queries'),
    from: z.number().optional().describe('Starting offset for pagination (default: 0)'),
    sort: z.any().optional().describe('Sort array. Common: [{"@timestamp": "asc"}] for chronological analysis'),
    _source: z.any().optional().describe('Field filtering. CRITICAL: Always use {"excludes": ["log_data"]} initially for performance. Include only for error detail analysis.'),
    track_total_hits: z.union([z.boolean(), z.number()]).optional().describe('Set true for accurate counts >10k (e.g., excessive call detection)'),
    search_after: z.any().optional().describe('Cursor-based pagination (more efficient than from/size). Use sort values from last result'),
    fields: z.array(z.string()).optional().describe('Retrieve specific fields with type mapping'),
    aggs: z.any().optional().describe('Aggregations for pattern analysis (recommended when count > 200). Use fixed_interval for date_histogram'),
    highlight: z.any().optional().describe('Highlight matching text in results'),
    collapse: z.any().optional().describe('Deduplicate by field. Example: {"field": "service_key.keyword"}'),
    timeout: z.string().optional().describe('Query timeout (e.g., "5s", "30s", "1m")'),
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
