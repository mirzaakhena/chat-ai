# Backend Express - Standalone Node.js Backend

This is a standalone Express.js backend application extracted from the Next.js fullstack application. It provides REST API endpoints for AI-powered chat with integrated access to Elasticsearch, Notion, and Prometheus.

## Features

- **Express.js** - Fast, minimalist web framework
- **TypeScript** - Full type safety
- **AI Integration** - OpenRouter API for LLM capabilities
- **External Services**:
  - Elasticsearch - Query BPA transaction logs
  - Notion - Query complaints database
  - Prometheus - Query server metrics
- **SSE Streaming** - Server-Sent Events for real-time AI responses
- **CORS Support** - Configured for Next.js frontend communication

## Architecture

```
backend-express/
├── src/
│   ├── clients/          # External service clients
│   │   ├── elasticsearch.ts
│   │   ├── notion.ts
│   │   └── prometheus.ts
│   ├── config/           # Configuration management
│   │   └── index.ts
│   ├── controllers/      # Request handlers
│   │   └── chat.ts
│   ├── middleware/       # Express middleware
│   │   ├── cors.ts
│   │   └── errorHandler.ts
│   ├── routes/           # Route definitions
│   │   └── chat.ts
│   ├── tools/            # AI tool definitions
│   │   ├── elasticsearch.ts
│   │   ├── notion.ts
│   │   ├── prometheus.ts
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── systemPrompt.ts
│   └── index.ts          # Main application entry
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 18+ or 20+
- npm or yarn or pnpm
- Access to external services (Elasticsearch, Notion, Prometheus)
- OpenRouter API key

## Installation

1. Navigate to the backend directory:
```bash
cd backend-express
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with the required credentials:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# OpenRouter Configuration
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Elasticsearch Configuration
ELASTICSEARCH_URL=https://your-elasticsearch-url:9200
ELASTICSEARCH_USERNAME=your_username
ELASTICSEARCH_PASSWORD=your_password

# Prometheus Configuration
PROMETHEUS_URL=https://your-prometheus-url

# Notion Configuration
NOTION_TOKEN=your_notion_token
NOTION_DATABASE_ID=your_database_id

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Running the Application

### Development Mode
```bash
npm run dev
```
The server will start with hot-reload on `http://localhost:3001`

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status and configuration info.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-06T...",
  "environment": "development"
}
```

### Chat Stream
```
POST /api/chat
```
Streaming chat endpoint with AI tool execution.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Check CALL-21197"
    }
  ]
}
```

**Response:**
Server-Sent Events (SSE) stream with events:
- `text-delta` - Text chunks
- `tool-call` - Tool execution started
- `tool-result` - Tool execution completed
- `finish-step` - Step completed

## Available Tools

The AI has access to the following tools:

1. **notion_query_complaints** - Query BPA complaints database
2. **notion_get_schema** - Get database schema and field options
3. **elasticsearch_transaction_query** - Query BPA transaction logs
4. **prometheus_node_query** - Query server infrastructure metrics

## CORS Configuration

By default, CORS is configured to allow requests from `http://localhost:3000` (Next.js frontend).

To allow multiple origins or modify CORS settings, edit `src/middleware/cors.ts`.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment (development/production) | No (default: development) |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `OPENROUTER_MODEL` | LLM model to use | No (default: anthropic/claude-3.5-sonnet) |
| `ELASTICSEARCH_URL` | Elasticsearch cluster URL | Yes |
| `ELASTICSEARCH_USERNAME` | Elasticsearch username | Yes |
| `ELASTICSEARCH_PASSWORD` | Elasticsearch password | Yes |
| `ELASTICSEARCH_DEFAULT_TIMESTAMP_FIELD` | Default timestamp field | No (default: @timestamp) |
| `PROMETHEUS_URL` | Prometheus server URL | Yes |
| `NOTION_TOKEN` | Notion integration token | Yes |
| `NOTION_DATABASE_ID` | Notion database ID | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | No (default: http://localhost:3000) |

## Logging

The server logs important events to the console:
- 🚀 Server startup information
- 📡 Request logging
- 🔧 Tool execution
- ✅ Tool results
- ❌ Errors

## Error Handling

All errors are caught and handled gracefully:
- 400 - Bad Request (validation errors)
- 404 - Not Found (invalid routes)
- 500 - Internal Server Error (server errors)

In development mode, error stack traces are included in responses.

## Integration with Next.js Frontend

To use this backend with the Next.js frontend:

1. Start the backend server: `npm run dev` (runs on port 3001)
2. Update Next.js environment to point to the backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
3. Modify the Next.js `useChatStream` hook to use the external API:
   ```typescript
   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ messages }),
   });
   ```

## Deployment

### Docker Deployment (Recommended)

Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t backend-express .
docker run -p 3001:3001 --env-file .env backend-express
```

### Traditional Deployment

1. Build the project: `npm run build`
2. Copy `dist/`, `package.json`, `package-lock.json`, and `.env` to server
3. Install production dependencies: `npm ci --only=production`
4. Start with PM2 or similar: `pm2 start dist/index.js --name backend-express`

## Troubleshooting

### Connection Issues

**Elasticsearch connection fails:**
- Verify URL, username, and password
- Check if self-signed certificates are accepted
- Test connection: `curl -u user:pass https://es-url`

**Notion API errors:**
- Verify integration token is valid
- Check database ID is correct
- Ensure integration has access to the database

**Prometheus connection fails:**
- Verify Prometheus URL
- Check if authentication is required
- Test query: `curl https://prometheus-url/api/v1/query?query=up`

### CORS Errors

If you see CORS errors in the browser:
1. Check `CORS_ORIGIN` environment variable matches frontend URL
2. Verify frontend is making requests to the correct backend URL
3. Check browser console for specific CORS error messages

### Port Already in Use

If port 3001 is already in use:
1. Change `PORT` in `.env`
2. Update frontend configuration to match new port

## License

MIT

## Support

For issues and questions, please refer to the main project repository.
