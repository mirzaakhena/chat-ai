import { z } from 'zod';
import { executeQuery, executeRangeQuery } from '../clients/prometheus';

/**
 * Prometheus Node Query Tool for AI SDK
 *
 * PURPOSE: Check server infrastructure metrics (Node Exporter)
 *
 * WHEN TO USE:
 * - Transaction errors detected → check if CPU/memory spike during that time
 * - Suspected performance issue → verify resource usage
 *
 * CORRELATION:
 * - Prometheus instance "10.188.0.10:9200" → node "bpa-orderer1" → kube-event host "accio-bpa-orderer1-*"
 *
 * CRITICAL HINTS:
 * - Retention: 1 day only
 * - Use rate() for counters: rate(node_cpu_seconds_total[5m])
 * - Common thresholds: CPU >80%, Memory <10% available = issue
 */
export const prometheusNodeTool = {
  description: `Query server metrics via Node Exporter. Check CPU, memory, disk, network during error timeframes.

Auto-detects query mode:
- Instant: Current usage (query only)
- Range: Historical trends (query + start/end/step)

Common metrics:
- CPU: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
- Memory: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
- Load: node_load1

⚠️ Retention: 1 day only
⚠️ Use rate() for cumulative counters (node_cpu_seconds_total, node_network_receive_bytes_total)

Correlation: Check during transaction error timeframe to identify infrastructure cause`,

  inputSchema: z.object({
    query: z.string().describe(`PromQL query. Use rate() for counters, filter by instance or accio_server_name.

Label selectors: {instance="10.188.0.10:9200"}, {accio_server_name="accio-bpa-peer0"}`),
    time: z.string().optional().describe('[INSTANT] Optional evaluation timestamp (Unix or RFC3339). Default: now'),
    timeout: z.string().optional().describe("Optional timeout (e.g., '30s', '1m')"),
    start: z.string().optional().describe('[RANGE] Start time (RFC3339 UTC or Unix)'),
    end: z.string().optional().describe('[RANGE] End time'),
    step: z.string().optional().describe("[RANGE] Resolution like '1m', '5m'"),
  }),

  execute: async (args: any) => {
    const { query, time, timeout, start, end, step } = args;

    // Validate query parameter
    if (!query || typeof query !== 'string') {
      throw new Error('Query parameter must be a valid string');
    }

    // Detect query mode based on parameters
    const isRangeQuery = !!(start && end && step);

    if (isRangeQuery) {
      // Range Query Mode
      if (!start || !end || !step) {
        throw new Error('Range query requires start, end, and step parameters');
      }

      const result = await executeRangeQuery(query, start, end, step, timeout);
      return result;
    } else {
      // Instant Query Mode
      const result = await executeQuery(query, time, timeout);
      return result;
    }
  },
};
