/**
 * Timestamp field mapping for different Elasticsearch indices
 */
export const TIMESTAMP_FIELD_MAP: Record<string, string> = {
  "fluentd-bpa.log-*": "@timestamp",
};
