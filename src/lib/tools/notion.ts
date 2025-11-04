import { z } from 'zod';
import { queryComplaintsFormatted, getFormattedSchema } from '../clients/notion';

/**
 * Notion Query Complaints Tool for AI SDK
 */
export const notionQueryComplaintsTool = {
  description: `Query BPA user complaints database. Returns complaint details with correlation keys for Elasticsearch/Prometheus investigation.

Common query patterns:
- By call_id: Query specific complaint when user references "CALL-XXXXX"
- By filters: Find complaints by type, terminal, date range, vehicle number, etc.

Primary use: Extract vehicle_number (PRIMARY KEY), reception_time (time upper bound), and terminals for downstream correlation.`,

  parameters: z.object({
    filter: z.any().optional().describe('Notion filter using English property names (auto-converted to Korean)'),
    sorts: z.any().optional().describe('Sort by English property names'),
    start_cursor: z.string().optional().describe('Pagination cursor from previous response'),
    page_size: z.number().optional().default(10).describe('Items per page (default: 10, max: 100)'),
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
 */
export const notionGetSchemaTool = {
  description: `Get database schema with field types and valid options. Use to discover valid values for complaint_type, terminals, detailed_complaint_types, processing_status, etc.`,

  parameters: z.object({
    field: z.string().optional().describe('Optional field name filter (e.g., "complaint_type", "terminals")'),
  }),

  execute: async (args: any) => {
    const { field } = args;
    const schema = await getFormattedSchema(field);
    return schema;
  },
};
