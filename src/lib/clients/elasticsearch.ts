import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { config } from '../config';

// Use centralized configuration
const ELASTICSEARCH_URL = config.elasticsearch.url;
const ELASTICSEARCH_USERNAME = config.elasticsearch.username;
const ELASTICSEARCH_PASSWORD = config.elasticsearch.password;
const ELASTICSEARCH_DEFAULT_TIMESTAMP_FIELD = config.elasticsearch.defaultTimestampField;

// Create axios instance with Elasticsearch configuration
const esAxios: AxiosInstance = axios.create({
  baseURL: ELASTICSEARCH_URL,
  auth: {
    username: ELASTICSEARCH_USERNAME,
    password: ELASTICSEARCH_PASSWORD,
  },
  headers: {
    'Content-Type': 'application/json',
  },
  // For self-signed certificates
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

/**
 * Test Elasticsearch connection
 * @returns Connection status and cluster info
 */
export async function testConnection() {
  try {
    // Simple GET request to Elasticsearch root
    const response = await esAxios.get('/');

    // Get cluster health
    const healthResponse = await esAxios.get('/_cluster/health');

    return {
      success: true,
      message: 'Connected to Elasticsearch successfully',
      cluster: {
        name: response.data.cluster_name,
        status: healthResponse.data.status,
        numberOfNodes: healthResponse.data.number_of_nodes,
        version: response.data.version.number,
        tagline: response.data.tagline,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to connect to Elasticsearch',
      error: error.message,
      details: error.response?.data || null,
    };
  }
}

/**
 * Query options interface
 */
export interface ElasticsearchQueryOptions {
  /** Number of documents to return (default: 10) */
  size?: number;
  /** Starting offset for pagination (default: 0) */
  from?: number;
  /** Aggregations for analytics */
  aggs?: any;
  /** Custom sort array (if not provided, defaults to timestamp desc) */
  sort?: any[];
  /** Source filtering - specify fields to include/exclude */
  _source?: string[] | { includes?: string[]; excludes?: string[] } | boolean;
  /** Track total hits accurately (default: true for counts > 10k) */
  track_total_hits?: boolean | number;
  /** Cursor-based pagination (more efficient than from/size for deep pagination) */
  search_after?: any[];
  /** Retrieve specific fields with type mapping (modern alternative to _source) */
  fields?: string[];
  /** Highlight matching text in results */
  highlight?: any;
  /** Collapse/deduplicate results by field */
  collapse?: { field: string; inner_hits?: any; max_concurrent_group_searches?: number };
  /** Query timeout (e.g., "5s", "1m") */
  timeout?: string;
  /** Timestamp field for default sorting (default: @timestamp) */
  timestampField?: string;
}

/**
 * Query with custom search parameters
 *
 * @param indexPattern - Elasticsearch index pattern to query
 * @param query - Elasticsearch query DSL object
 * @param options - Query options (size, sort, _source, etc.)
 * @returns Search results
 */
export async function customQuery(
  indexPattern: string,
  query: any,
  options?: ElasticsearchQueryOptions
) {
  try {
    const {
      size = 10,
      from = 0,
      aggs,
      sort,
      _source,
      track_total_hits,
      search_after,
      fields,
      highlight,
      collapse,
      timeout,
      timestampField = ELASTICSEARCH_DEFAULT_TIMESTAMP_FIELD,
    } = options || {};

    // Build request body
    const requestBody: any = {
      size,
      from,
      query,
    };

    // Add sort (custom or default)
    if (sort) {
      requestBody.sort = sort;
    } else {
      // Default sort by timestamp descending
      requestBody.sort = [
        {
          [timestampField]: {
            order: 'desc',
          },
        },
      ];
    }

    // Add optional parameters
    if (aggs) {
      requestBody.aggs = aggs;
    }
    if (_source !== undefined) {
      requestBody._source = _source;
    }
    if (track_total_hits !== undefined) {
      requestBody.track_total_hits = track_total_hits;
    }
    if (search_after) {
      requestBody.search_after = search_after;
    }
    if (fields) {
      requestBody.fields = fields;
    }
    if (highlight) {
      requestBody.highlight = highlight;
    }
    if (collapse) {
      requestBody.collapse = collapse;
    }
    if (timeout) {
      requestBody.timeout = timeout;
    }

    const response = await esAxios.post(`/${indexPattern}/_search`, requestBody);

    return {
      success: true,
      data: {
        total: response.data.hits.total,
        hits: response.data.hits.hits,
        took: response.data.took,
        aggregations: response.data.aggregations || undefined,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Custom query failed',
      error: error.message,
      details: error.response?.data || null,
    };
  }
}

export { esAxios };
