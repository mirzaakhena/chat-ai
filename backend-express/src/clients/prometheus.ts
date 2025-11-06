import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

// Use centralized configuration
const PROMETHEUS_URL = config.prometheus.url;

// Log configuration for debugging
console.log('📊 Prometheus Configuration:');
console.log('   URL:', PROMETHEUS_URL);

// Create axios instance with Prometheus configuration
const promAxios: AxiosInstance = axios.create({
  baseURL: PROMETHEUS_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  // No authentication required based on user confirmation
});

/**
 * Test Prometheus connection
 * @returns Connection status and build info
 */
export async function testConnection() {
  try {
    // Query Prometheus build info
    const response = await promAxios.get('/api/v1/query', {
      params: {
        query: 'prometheus_build_info',
      },
    });

    // Get runtime info
    const runtimeInfo = await promAxios.get('/api/v1/status/runtimeinfo');

    return {
      success: true,
      message: 'Connected to Prometheus successfully',
      buildInfo: response.data.data?.result?.[0]?.metric || {},
      runtimeInfo: runtimeInfo.data.data || {},
      status: response.data.status,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to connect to Prometheus',
      error: error.message,
      details: error.response?.data || null,
    };
  }
}

/**
 * Execute PromQL query
 *
 * @param query - PromQL query string (e.g., "probe_success", "node_cpu_seconds_total")
 * @param time - Optional evaluation timestamp (Unix timestamp or RFC3339)
 * @param timeout - Optional query timeout (e.g., "30s")
 * @returns Query results
 */
export async function executeQuery(
  query: string,
  time?: string,
  timeout?: string
) {
  try {
    const params: any = {
      query,
    };

    if (time) {
      params.time = time;
    }

    if (timeout) {
      params.timeout = timeout;
    }

    const response = await promAxios.get('/api/v1/query', {
      params,
    });

    return {
      success: true,
      data: {
        resultType: response.data.data?.resultType,
        result: response.data.data?.result || [],
      },
      status: response.data.status,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Query execution failed',
      error: error.message,
      details: error.response?.data || null,
    };
  }
}

/**
 * Execute PromQL range query (time series data)
 *
 * @param query - PromQL query string
 * @param start - Start timestamp (Unix timestamp or RFC3339)
 * @param end - End timestamp (Unix timestamp or RFC3339)
 * @param step - Query resolution step (e.g., "15s", "1m", "1h")
 * @param timeout - Optional query timeout
 * @returns Range query results
 */
export async function executeRangeQuery(
  query: string,
  start: string,
  end: string,
  step: string,
  timeout?: string
) {
  try {
    const params: any = {
      query,
      start,
      end,
      step,
    };

    if (timeout) {
      params.timeout = timeout;
    }

    const response = await promAxios.get('/api/v1/query_range', {
      params,
    });

    return {
      success: true,
      data: {
        resultType: response.data.data?.resultType,
        result: response.data.data?.result || [],
      },
      status: response.data.status,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Range query execution failed',
      error: error.message,
      details: error.response?.data || null,
    };
  }
}

/**
 * Get list of metric names (labels)
 *
 * @param match - Optional label matcher (e.g., "{job='blackbox'}")
 * @returns List of metric names
 */
export async function getMetricNames(match?: string) {
  try {
    const params: any = {};

    if (match) {
      params['match[]'] = match;
    }

    const response = await promAxios.get('/api/v1/label/__name__/values', {
      params,
    });

    return {
      success: true,
      data: response.data.data || [],
      status: response.data.status,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to get metric names',
      error: error.message,
      details: error.response?.data || null,
    };
  }
}

export { promAxios };
