# Migration Guide: Next.js API Routes → Express Backend

This document explains what was extracted from the Next.js application and how it maps to the Express backend.

## What Was Migrated

### 1. Configuration (`src/lib/config.ts`)
- **From:** `/src/lib/config.ts`
- **To:** `/src/config/index.ts`
- **Changes:**
  - Added server configuration (port, CORS origin)
  - Imports `dotenv` to load `.env` file
  - All environment variables remain the same

### 2. External Service Clients

#### Elasticsearch Client
- **From:** `/src/lib/clients/elasticsearch.ts`
- **To:** `/src/clients/elasticsearch.ts`
- **Changes:** Import paths updated, functionality identical

#### Notion Client
- **From:** `/src/lib/clients/notion.ts`
- **To:** `/src/clients/notion.ts`
- **Changes:** Import paths updated, functionality identical

#### Prometheus Client
- **From:** `/src/lib/clients/prometheus.ts`
- **To:** `/src/clients/prometheus.ts`
- **Changes:** Import paths updated, functionality identical

### 3. AI Tools

#### Elasticsearch Tool
- **From:** `/src/lib/tools/elasticsearch.ts`
- **To:** `/src/tools/elasticsearch.ts`
- **Changes:** Import paths updated, functionality identical

#### Notion Tools
- **From:** `/src/lib/tools/notion.ts`
- **To:** `/src/tools/notion.ts`
- **Changes:** Import paths updated, functionality identical

#### Prometheus Tool
- **From:** `/src/lib/tools/prometheus.ts`
- **To:** `/src/tools/prometheus.ts`
- **Changes:** Import paths updated, functionality identical

### 4. System Prompt
- **From:** `/src/lib/systemPrompt.ts`
- **To:** `/src/utils/systemPrompt.ts`
- **Changes:** Import paths updated, functionality identical

### 5. Constants
- **From:** `/src/lib/constants.ts`
- **To:** `/src/utils/constants.ts`
- **Changes:** Import paths updated, functionality identical

### 6. API Route Logic

#### Next.js Route Handler
- **From:** `/src/app/api/chat/route.ts`
- **To:** `/src/controllers/chat.ts` + `/src/routes/chat.ts`
- **Changes:**
  - Next.js `POST` function → Express controller `handleChatStream`
  - Next.js `Request` → Express `Request`/`Response`
  - Next.js `Response` with `ReadableStream` → Express `res.write()` for SSE
  - Response headers set via Express `res.setHeader()`
  - Same streaming logic and tool execution

#### Helper Functions
- **From:** `/src/app/api/chat/helpers.ts`
- **To:** `/src/utils/helpers.ts`
- **Changes:**
  - Adapted for Express response handling
  - Removed direct controller access, returns formatted strings instead
  - Same validation and message preparation logic

## Architecture Comparison

### Next.js Structure
```
src/
├── app/
│   └── api/
│       └── chat/
│           ├── route.ts       # API route handler
│           └── helpers.ts     # Helper functions
└── lib/
    ├── clients/               # External service clients
    ├── tools/                 # AI tools
    ├── config.ts              # Configuration
    ├── constants.ts           # Constants
    └── systemPrompt.ts        # System prompt
```

### Express Structure
```
backend-express/src/
├── routes/
│   └── chat.ts               # Route definitions
├── controllers/
│   └── chat.ts               # Request handlers
├── clients/                  # External service clients
├── tools/                    # AI tools
├── config/
│   └── index.ts              # Configuration
├── utils/
│   ├── constants.ts          # Constants
│   ├── helpers.ts            # Helper functions
│   └── systemPrompt.ts       # System prompt
├── middleware/               # Express middleware
└── index.ts                  # Main server
```

## Key Differences

### 1. Request Handling

**Next.js:**
```typescript
export async function POST(req: Request) {
  const { messages } = await req.json();
  // ...
  return new Response(readable, { headers });
}
```

**Express:**
```typescript
export async function handleChatStream(req: Request, res: Response) {
  const { messages } = req.body;
  // ...
  res.setHeader('Content-Type', 'text/event-stream');
  res.write(data);
  res.end();
}
```

### 2. Streaming Responses

**Next.js:**
```typescript
const readable = new ReadableStream({
  async start(controller) {
    for await (const chunk of stream) {
      controller.enqueue(encoder.encode(data));
    }
    controller.close();
  },
});
return new Response(readable);
```

**Express:**
```typescript
for await (const chunk of stream) {
  res.write(data);
}
res.end();
```

### 3. Configuration Loading

**Next.js:**
```typescript
// Uses Next.js built-in env loading
process.env.VARIABLE_NAME
```

**Express:**
```typescript
// Requires explicit dotenv import
import dotenv from 'dotenv';
dotenv.config();
```

### 4. CORS Handling

**Next.js:**
```typescript
// Handled automatically for same-origin or via next.config.js
```

**Express:**
```typescript
// Requires explicit CORS middleware
import cors from 'cors';
app.use(cors({ origin: corsOrigin }));
```

## What Was NOT Migrated

The following frontend-specific code was NOT migrated:

1. **React Components** (`src/components/`)
2. **React Hooks** (`src/app/hooks/useChatStream.ts`)
3. **Frontend Utils** (`src/app/utils/streamReader.ts`, `streamEventHandlers.ts`)
4. **UI Pages** (`src/app/page.tsx`, `layout.tsx`)
5. **Next.js Configuration** (`next.config.js`)

## Integration Steps

To use the Express backend with the existing Next.js frontend:

### Step 1: Start Backend
```bash
cd backend-express
npm install
cp .env.example .env
# Configure .env with your credentials
npm run dev
```

### Step 2: Update Frontend Environment
Create/update `chat-ai/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Modify Frontend Hook
Update `src/app/hooks/useChatStream.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const response = await fetch(`${API_URL}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ messages: chatHistory }),
});
```

### Step 4: Remove Original Next.js API Route
You can optionally remove or comment out:
- `src/app/api/chat/route.ts`
- `src/app/api/chat/helpers.ts`

## Testing the Migration

1. **Health Check:**
```bash
curl http://localhost:3001/health
```

2. **Chat Endpoint:**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

3. **Frontend Integration:**
- Start both servers (Next.js and Express)
- Open `http://localhost:3000` in browser
- Send a message and verify streaming works

## Rollback Plan

If you need to rollback to the original Next.js API:

1. Stop the Express backend
2. Remove `NEXT_PUBLIC_API_URL` from `.env.local`
3. Revert changes to `useChatStream.ts` hook
4. Restart Next.js: `npm run dev`

## Benefits of Separation

1. **Independent Scaling** - Scale backend separately from frontend
2. **Technology Flexibility** - Can replace frontend without touching backend
3. **Deployment Options** - Deploy on different platforms/regions
4. **Development Speed** - Backend and frontend teams can work independently
5. **Resource Management** - Different memory/CPU configurations
6. **Multiple Clients** - Same backend can serve web, mobile, desktop apps

## Potential Issues

### 1. CORS Errors
**Solution:** Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL

### 2. SSE Connection Issues
**Solution:** Some proxies/load balancers may not support SSE. Consider:
- Using WebSockets instead
- Configuring proxy timeouts
- Direct connection without proxy

### 3. Environment Variables
**Solution:** Remember to set all required env vars in both applications

### 4. Port Conflicts
**Solution:** Use different ports (3000 for Next.js, 3001 for Express)

## Performance Considerations

### Next.js Integrated (Original)
- **Pros:** Single deployment, no network overhead
- **Cons:** Coupled scaling, shared resources

### Separated Express Backend
- **Pros:** Independent scaling, specialized optimization
- **Cons:** Additional network latency (minimal on localhost/same region)

## Security Considerations

1. **API Keys:** Never expose in frontend, keep in backend `.env`
2. **CORS:** Restrict to specific frontend origins in production
3. **Rate Limiting:** Add rate limiting middleware to Express
4. **Authentication:** Consider adding auth middleware if needed

## Future Enhancements

Potential improvements for the Express backend:

1. **Add Authentication/Authorization**
2. **Implement Rate Limiting**
3. **Add Request Validation Middleware**
4. **Set up Monitoring/Logging (e.g., Winston, Morgan)**
5. **Add API Documentation (e.g., Swagger)**
6. **Implement Caching Layer**
7. **Add WebSocket Support**
8. **Set up Load Balancing**

## Conclusion

The migration successfully extracts all backend functionality into a standalone Express application while maintaining 100% feature parity with the original Next.js implementation. The Express backend can run independently and serve the Next.js frontend via API calls.
