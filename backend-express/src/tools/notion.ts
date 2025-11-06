import { z } from 'zod';
import { queryComplaintsFormatted, getFormattedSchema } from '../clients/notion';

/**
 * Notion Query Complaints Tool for AI SDK
 *
 * PURPOSE: Retrieve user complaints that trigger investigations
 *
 * WHEN TO USE:
 * - Starting investigation (get complaint details)
 * - Finding recent technical issues (filter by complaint_type="장애")
 * - Extracting correlation keys (vehicle_number, reception_time, terminals)
 *
 * CRITICAL HINTS:
 * - Data quality: Manual CS entry, expect typos/missing fields
 * - Date filters: MUST separate on_or_after and on_or_before in 'and' array (Notion API limitation)
 * - Technical filter: complaint_type="장애" or error keywords in detailed_complaint_types
 * - Primary exports: vehicle_number (for ES correlation), reception_time (upper bound), terminals (for channel mapping)
 */
export const notionQueryComplaintsTool = {
  description: `Query BPA user complaints database. Returns complaint details with correlation keys for Elasticsearch/Prometheus investigation.

Common query patterns:
- By call_id: Query specific complaint when user references "CALL-XXXXX" (e.g., "check CALL-21197", "analyze CALL-21408")
- By filters: Find complaints by type, terminal, date range, vehicle number, etc.

Primary use: Extract vehicle_number (PRIMARY KEY), reception_time (time upper bound), and terminals for downstream correlation.

Data quality note: Manual entry by CS staff - validate for typos, missing fields, inconsistent formatting.`,

  inputSchema: z.object({
    filter: z.any().optional().describe(`Notion filter using English property names (auto-converted to Korean).

Key properties for technical investigation:
- call_id: Unique complaint identifier like "CALL-21408" (unique_id, numeric). Use when user references specific CALL-XXXXX.
- complaint_type: "장애" for technical issues (select field)
- vehicle_number, container_number: For ES correlation (rich_text)
- reception_time: Complaint time, use as search END time (created_time)
- terminals: Terminal codes like "HJNPC010", "HPNT" (multi_select)
- detailed_complaint_types: Specific error types (multi_select)

Example - Query by call_id (extract number from "CALL-21197" → 21197):
{"property": "call_id", "unique_id": {"equals": 21197}}

⚠️ CRITICAL: For date ranges, separate on_or_after and on_or_before into different objects in 'and' array.
CORRECT: {"and": [{"property": "reception_time", "date": {"on_or_after": "2025-10-20"}}, {"property": "reception_time", "date": {"on_or_before": "2025-10-27"}}]}
WRONG: {"property": "reception_time", "date": {"on_or_after": "...", "on_or_before": "..."}}

Combine filters: {"and": [...]} or {"or": [...]}`),
    sorts: z.any().optional().describe('Sort by English property names. Common: [{"property": "reception_time", "direction": "descending"}]'),
    start_cursor: z.string().optional().describe('Pagination cursor from previous response'),
    page_size: z.number().optional().default(10).describe('Items per page (default: 10, max: 100). Recommend 50-100 for batch analysis'),
  }),

  execute: async (args: any) => {
    const { filter, sorts, start_cursor, page_size } = args;

    const result = await queryComplaintsFormatted({
      filter,
      sorts,
      start_cursor,
      page_size,
    });

    return result;
  },
};

/**
 * Notion Schema Tool for AI SDK
 *
 * PURPOSE: Understand available fields and valid options
 * WHEN TO USE: When you need to know valid values for filters (complaint types, terminals, statuses)
 */
export const notionGetSchemaTool = {
  description: `Get database schema with field types and valid options. Use to discover valid values for complaint_type, terminals, detailed_complaint_types, processing_status, etc.`,

  inputSchema: z.object({
    field: z.string().optional().describe('Optional field name filter (e.g., "complaint_type", "terminals"). Omit to get all fields.'),
  }),

  execute: async (args: any) => {
    const { field } = args;
    const schema = await getFormattedSchema(field);
    return schema;
  },
};
