import { Client } from "@notionhq/client";
import { config } from "../config";

// Initialize Notion client with centralized configuration
const notion = new Client({
  auth: config.notion.token,
});

const DATABASE_ID = config.notion.databaseId;

/**
 * Property name mapping: English (user-facing) to Korean (Notion API)
 */
const PROPERTY_MAPPING: Record<string, string> = {
  call_id: "ID-2",
  complaint_content: "민원내용",
  reception_time: "접수일시",
  last_edited_time: "최종편집일시",
  receiver: "접수자",
  handlers: "처리자",
  service_name: "서비스명",
  complaint_type: "민원유형",
  detailed_complaint_types: "상세민원유형",
  terminals: "터미널",
  processing_status: "처리상태",
  callback_status: "콜백 현황",
  reporter_contact: "신고자연락처",
  processing_content: "처리내용",
  container_number: "컨테이너번호",
  vehicle_number: "차량번호",
  terminal_sharing: "터미널 공유여부",
};

/**
 * Query parameters for filtering and pagination
 */
export interface QueryParams {
  filter?: any;
  sorts?: any[];
  start_cursor?: string;
  page_size?: number;
}

/**
 * Response structure with pagination support
 */
export interface QueryResponse {
  results: any[];
  has_more: boolean;
  next_cursor: string | null;
  total_count?: number;
}

/**
 * Convert English property names to Korean (Notion API) property names in filter object
 * Handles nested structures (and/or operators) recursively
 *
 * @param filter - Filter object with English property names
 * @returns Filter object with Korean property names
 */
function convertFilterToNotionProperties(filter: any): any {
  if (!filter) return filter;

  // If filter has 'and' or 'or', recursively convert each condition
  if (filter.and) {
    return {
      and: filter.and.map((f: any) => convertFilterToNotionProperties(f)),
    };
  }

  if (filter.or) {
    return {
      or: filter.or.map((f: any) => convertFilterToNotionProperties(f)),
    };
  }

  // If filter has 'property', convert it
  if (filter.property) {
    const notionProperty = PROPERTY_MAPPING[filter.property] || filter.property;
    return {
      ...filter,
      property: notionProperty,
    };
  }

  return filter;
}

/**
 * Convert English property names to Korean (Notion API) property names in sorts array
 *
 * @param sorts - Sorts array with English property names
 * @returns Sorts array with Korean property names
 */
function convertSortsToNotionProperties(sorts?: any[]): any[] | undefined {
  if (!sorts) return sorts;

  return sorts.map((sort) => {
    if (sort.property) {
      const notionProperty = PROPERTY_MAPPING[sort.property] || sort.property;
      return {
        ...sort,
        property: notionProperty,
      };
    }
    return sort;
  });
}

/**
 * Query the complaints database with filtering, sorting, and pagination
 *
 * @param params - Query parameters (filter, sorts, pagination)
 * @returns Query results with pagination info
 */
export async function queryComplaintsDatabase(
  params: QueryParams = {}
): Promise<QueryResponse> {
  try {
    const { filter, sorts, start_cursor, page_size = 100 } = params;

    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: filter,
      sorts: sorts,
      start_cursor: start_cursor,
      page_size: page_size,
    });

    return {
      results: response.results,
      has_more: response.has_more,
      next_cursor: response.next_cursor,
    };
  } catch (error: any) {
    console.error("Error querying Notion database:", error);
    throw new Error(`Failed to query Notion database: ${error.message}`);
  }
}

/**
 * Get database schema/properties
 *
 * @returns Database structure information
 */
export async function getDatabaseSchema(): Promise<any> {
  try {
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });

    // Check if this is a full database response (not partial)
    const isFullResponse = 'object' in database && database.object === 'database';

    return {
      id: database.id,
      title: (database as any).title,
      properties: (database as any).properties,
      created_time: isFullResponse ? (database as any).created_time : undefined,
      last_edited_time: isFullResponse ? (database as any).last_edited_time : undefined,
    };
  } catch (error: any) {
    console.error("Error getting database schema:", error);
    throw new Error(`Failed to get database schema: ${error.message}`);
  }
}

/**
 * Property field information
 */
export interface PropertyFieldInfo {
  name: string;
  type: string;
  english_name?: string; // Mapped English name if available
  options?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
}

/**
 * Get formatted schema with only field names and their value options
 *
 * @param englishFieldName - Optional English field name to filter (e.g., "complaint_type")
 * @returns Formatted schema with field info and options
 */
export async function getFormattedSchema(englishFieldName?: string): Promise<Record<string, PropertyFieldInfo>> {
  try {
    const schema = await getDatabaseSchema();
    const properties = schema.properties;
    const formattedSchema: Record<string, PropertyFieldInfo> = {};

    // Create reverse mapping: Korean -> English
    const reverseMapping: Record<string, string> = {};
    for (const [englishName, koreanName] of Object.entries(PROPERTY_MAPPING)) {
      reverseMapping[koreanName] = englishName;
    }

    // If filtering by English field name, get the Korean name first
    let targetKoreanName: string | null = null;
    if (englishFieldName) {
      targetKoreanName = PROPERTY_MAPPING[englishFieldName] || null;
      if (!targetKoreanName) {
        throw new Error(`Unknown English field name: ${englishFieldName}`);
      }
    }

    for (const [fieldName, fieldData] of Object.entries(properties)) {
      const field = fieldData as any;

      // Skip if filtering and this field doesn't match
      if (targetKoreanName && fieldName !== targetKoreanName) {
        continue;
      }

      const fieldInfo: PropertyFieldInfo = {
        name: fieldName,
        type: field.type,
      };

      // Add English name mapping if available
      if (reverseMapping[fieldName]) {
        fieldInfo.english_name = reverseMapping[fieldName];
      }

      // Extract options based on field type
      if (field.type === 'select' && field.select?.options) {
        fieldInfo.options = field.select.options.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          color: opt.color,
        }));
      } else if (field.type === 'multi_select' && field.multi_select?.options) {
        fieldInfo.options = field.multi_select.options.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          color: opt.color,
        }));
      } else if (field.type === 'status' && field.status?.options) {
        fieldInfo.options = field.status.options.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          color: opt.color,
        }));
      }

      formattedSchema[fieldName] = fieldInfo;
    }

    return formattedSchema;
  } catch (error: any) {
    console.error("Error getting formatted schema:", error);
    throw new Error(`Failed to get formatted schema: ${error.message}`);
  }
}

/**
 * Formatted complaint record with English field names
 */
export interface FormattedComplaint {
  id: string;
  call_id: string;
  complaint_content: string;
  reception_time: string;
  last_edited_time: string;
  receiver: string | null;
  handlers: string[];
  service_name: string | null;
  complaint_type: string | null;
  detailed_complaint_types: string[];
  terminals: string[];
  processing_status: string | null;
  callback_status: string | null;
  reporter_contact: string;
  processing_content: string;
  container_number: string;
  vehicle_number: string;
  terminal_sharing: string | null;
  url: string;
}

/**
 * Helper function to extract plain text from rich_text property
 */
function extractRichText(richTextArray: any[]): string {
  if (!richTextArray || richTextArray.length === 0) return "";
  return richTextArray.map((rt: any) => rt.plain_text).join("");
}

/**
 * Transform a raw Notion page object to formatted complaint record
 */
export function transformComplaintRecord(page: any): FormattedComplaint {
  const props = page.properties;

  return {
    id: page.id,
    call_id: props["ID-2"]?.unique_id
      ? `${props["ID-2"].unique_id.prefix}-${props["ID-2"].unique_id.number}`
      : "",
    complaint_content: extractRichText(props["민원내용"]?.title || []),
    reception_time: props["접수일시"]?.created_time || "",
    last_edited_time: props["최종편집일시"]?.last_edited_time || "",
    receiver: props["접수자"]?.select?.name || null,
    handlers:
      props["처리자"]?.multi_select?.map((h: any) => h.name) || [],
    service_name: props["서비스명"]?.select?.name || null,
    complaint_type: props["민원유형"]?.select?.name || null,
    detailed_complaint_types:
      props["상세민원유형"]?.multi_select?.map((d: any) => d.name) || [],
    terminals:
      props["터미널"]?.multi_select?.map((t: any) => t.name) || [],
    processing_status: props["처리상태"]?.status?.name || null,
    callback_status: props["콜백 현황"]?.status?.name || null,
    reporter_contact: extractRichText(props["신고자연락처"]?.rich_text || []),
    processing_content: extractRichText(props["처리내용"]?.rich_text || []),
    container_number: extractRichText(props["컨테이너번호"]?.rich_text || []),
    vehicle_number: extractRichText(props["차량번호"]?.rich_text || []),
    terminal_sharing: props["터미널 공유여부"]?.select?.name || null,
    url: page.url,
  };
}

/**
 * Query complaints with formatted output (English field names)
 * Accepts English property names in filter and sorts, converts them to Korean for Notion API
 *
 * @param params - Query parameters with English property names (filter, sorts, pagination)
 * @returns Formatted complaints with English field names
 */
export async function queryComplaintsFormatted(
  params: QueryParams = {}
): Promise<{
  results: FormattedComplaint[];
  has_more: boolean;
  next_cursor: string | null;
}> {
  try {
    // Convert English property names to Korean before querying
    const convertedParams: QueryParams = {
      ...params,
      filter: convertFilterToNotionProperties(params.filter),
      sorts: convertSortsToNotionProperties(params.sorts),
    };

    const response = await queryComplaintsDatabase(convertedParams);

    const formattedResults = response.results.map((page: any) =>
      transformComplaintRecord(page)
    );

    return {
      results: formattedResults,
      has_more: response.has_more,
      next_cursor: response.next_cursor,
    };
  } catch (error: any) {
    console.error("Error querying formatted complaints:", error);
    throw new Error(`Failed to query formatted complaints: ${error.message}`);
  }
}
