/**
 * Configuration for backend services
 */
export const config = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
  },
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || '',
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
    defaultTimestampField: process.env.ELASTICSEARCH_DEFAULT_TIMESTAMP_FIELD || '@timestamp',
  },
  notion: {
    token: process.env.NOTION_TOKEN || '',
    databaseId: process.env.NOTION_DATABASE_ID || '',
  },
  prometheus: {
    url: process.env.PROMETHEUS_URL || '',
  },
};
