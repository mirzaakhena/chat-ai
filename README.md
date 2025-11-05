# BPA Operational Analysis Chat - Next.js AI Application

Aplikasi chat AI interaktif untuk analisis operasional BPA (Blockchain-based Port Automation) di Pelabuhan Busan, Korea. Dibangun dengan Next.js, AI SDK, dan integrasi dengan Notion dan Elasticsearch untuk investigasi komplain teknis.

## 🚀 Features

### Frontend
- **Rich Message Rendering** - Dukungan penuh untuk markdown dengan GitHub Flavored Markdown (GFM)
- **Syntax Highlighting** - Code blocks dengan syntax highlighting menggunakan Prism
- **Chart Visualization** - Render charts (line, bar, pie) langsung dalam pesan menggunakan Recharts
- **Tool Execution Display** - Visualisasi tool call dengan status indicator (working, completed, error)
- **JSON Viewer** - Interactive JSON viewer untuk request/response data
- **Dark Mode Support** - Tema gelap dan terang
- **Responsive Design** - Layout yang responsif untuk berbagai ukuran layar
- **Real-time Streaming** - Server-Sent Events (SSE) untuk streaming response word-by-word
- **Stop Button** - Kemampuan untuk membatalkan request yang sedang berjalan

### Backend
- **AI SDK Integration** - Vercel AI SDK v5 dengan streaming support dan multi-step execution (up to 20 steps)
- **OpenRouter Integration** - LLM provider menggunakan Claude Sonnet 4.5 via OpenRouter
- **Notion API** - Query complaints database untuk investigasi operasional
- **Elasticsearch** - Query transaction logs (fluentd-bpa.log-*) untuk analisis teknis
- **Prometheus** - Monitor server infrastructure metrics (Node Exporter) untuk CPU, memory, disk, network
- **Tool Calling** - Autonomous multi-step tool execution dengan intelligent correlation
- **System Prompt** - Expert methodology untuk BPA operational analysis
- **TypeScript** - Full type safety dengan Zod schema validation

## 🏗️ Backend Architecture

### Multi-Step Execution Flow
```
User Query → AI Agent → Tool Selection → Tool Execution → Result Analysis → Response
     ↓                                           ↓
     └──────────────────────────────────────────┘
              (Up to 20 iterative steps)
```

### Investigation Methodology
1. **Notion Query** - Extract complaint details (vehicle_number, reception_time, terminals)
2. **Elasticsearch Search** - Find transaction logs using vehicle-centric correlation
3. **Prometheus Monitoring** - Check server metrics (CPU, memory, load) during error timeframe
4. **Analysis** - Identify errors, patterns, and root causes (application vs infrastructure)
5. **Report** - Generate timeline and recommendations

### Tool Correlation Strategy
```
Notion Complaint
  ↓ Extract: vehicle_number (PRIMARY KEY)
  ↓ Extract: reception_time (UPPER BOUND)
  ↓
Elasticsearch Query
  ↓ service_key: "*_{vehicle_number}_*" (wildcard)
  ↓ @timestamp: start_of_day to reception_time
  ↓
Prometheus Query (if errors found)
  ↓ Check: CPU, memory, load during error timeframe
  ↓ Correlate: Infrastructure issues with transaction errors
  ↓
Analysis & Report
```

## 📁 Project Structure

```
chat-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts        # Streaming API endpoint with SSE
│   │   ├── globals.css             # Global styles dengan Tailwind directives
│   │   ├── layout.tsx              # Root layout component
│   │   └── page.tsx                # Chat interface dengan streaming integration
│   ├── components/
│   │   ├── AssistantMessage.tsx    # Komponen untuk pesan AI
│   │   ├── UserMessage.tsx         # Komponen untuk pesan user
│   │   ├── ToolMessage.tsx         # Komponen untuk tool execution display
│   │   ├── MessageContent.tsx      # Core renderer untuk markdown, code, charts
│   │   └── InputForm.tsx           # Form input dengan stop button support
│   └── lib/
│       ├── clients/
│       │   ├── elasticsearch.ts    # Elasticsearch client & query utilities
│       │   ├── notion.ts           # Notion client & complaint formatter
│       │   └── prometheus.ts       # Prometheus client & PromQL queries
│       ├── tools/
│       │   ├── elasticsearch.ts    # Elasticsearch tool definition
│       │   ├── notion.ts           # Notion tool definitions
│       │   ├── prometheus.ts       # Prometheus Node Exporter tool
│       │   └── index.ts            # Tool exports
│       ├── config.ts               # Environment configuration
│       ├── constants.ts            # Application constants
│       └── systemPrompt.ts         # BPA operational analysis expert prompt
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── next.config.js                  # Next.js configuration
├── package.json                    # Project dependencies dan scripts
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.ts              # Tailwind CSS configuration
└── tsconfig.json                   # TypeScript configuration
```

## ⚙️ Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables:**

   ```env
   # OpenRouter Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=anthropic/claude-sonnet-4.5

   # Elasticsearch Configuration
   ELASTICSEARCH_URL=https://your-elasticsearch-url:9200
   ELASTICSEARCH_USERNAME=your_username
   ELASTICSEARCH_PASSWORD=your_password
   ELASTICSEARCH_DEFAULT_TIMESTAMP_FIELD=@timestamp

   # Prometheus Configuration
   PROMETHEUS_URL=https://your-prometheus-url

   # Notion Configuration
   NOTION_TOKEN=your_notion_integration_token
   NOTION_DATABASE_ID=your_database_id
   ```

3. **Get API Keys:**
   - **OpenRouter**: Sign up at [openrouter.ai](https://openrouter.ai)
   - **Notion**: Create integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
   - **Elasticsearch**: Get credentials from your cluster admin
   - **Prometheus**: Get server URL from your infrastructure team

## 🚦 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat aplikasi.

Edit halaman dengan memodifikasi `src/app/page.tsx`. Halaman akan auto-update saat file diedit.

### Production Build

```bash
npm run build
npm start
```

## 🔧 API Routes

### POST /api/chat

Endpoint untuk streaming chat dengan AI.

**Request:**
```typescript
{
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
}
```

**Response:** Server-Sent Events (SSE) stream

**Event Types:**
- `text-delta` - Streaming text chunks
- `tool-call` - Tool execution started
- `tool-result` - Tool execution completed
- `tool-error` - Tool execution failed
- `finish-step` - Step completed
- `finish` - Conversation finished

**Example:**
```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [
      { role: "user", content: "Pilih satu komplain technical hari ini" }
    ]
  })
});

const reader = response.body.getReader();
// Parse SSE stream...
```

## 🛠️ Available Tools

### 1. notion_query_complaints

Query BPA user complaints database.

**Input Schema:**
```typescript
{
  filter?: any;      // Notion filter object
  sorts?: any;       // Sort configuration
  start_cursor?: string;  // Pagination cursor
  page_size?: number;     // Results per page (default: 10)
}
```

**Output:**
```typescript
{
  results: Array<{
    id: string;
    call_id: string;
    vehicle_number: string;
    reception_time: string;
    complaint_type: string;
    terminals: string[];
    // ... other fields
  }>;
  has_more: boolean;
  next_cursor?: string;
}
```

**Example Usage:**
```typescript
// Query by call_id
{
  filter: {
    property: "call_id",
    unique_id: { equals: 21197 }
  }
}

// Query by date range
{
  filter: {
    and: [
      { property: "complaint_type", select: { equals: "장애" } },
      { property: "reception_time", date: { on_or_after: "2025-11-03" } }
    ]
  }
}
```

### 2. notion_get_schema

Get database schema with field types and valid options.

**Output:**
```typescript
{
  database_id: string;
  fields: Array<{
    name: string;
    type: string;
    options?: string[];
  }>;
}
```

### 3. elasticsearch_transaction_query

Query BPA transaction logs (fluentd-bpa.log-*).

**Input Schema:**
```typescript
{
  query: any;       // Elasticsearch DSL query
  size?: number;    // Number of results (default: 10)
  from?: number;    // Pagination offset
  sort?: any;       // Sort configuration
  _source?: any;    // Field filtering
  aggs?: any;       // Aggregations
}
```

**Example Usage:**
```typescript
// Vehicle-centric search
{
  query: {
    bool: {
      must: [
        { wildcard: { "service_key.keyword": "*_부산99사7744_*" } },
        {
          range: {
            "@timestamp": {
              gte: "2025-11-03T00:00:00.000Z",
              lte: "2025-11-03T06:27:00.000Z"
            }
          }
        }
      ]
    }
  },
  _source: { excludes: ["log_data"] },
  size: 100,
  sort: [{ "@timestamp": "asc" }]
}
```

### 4. prometheus_node_query

Query server infrastructure metrics via Prometheus Node Exporter.

**Input Schema:**
```typescript
{
  query: string;    // PromQL query string
  time?: string;    // [INSTANT] Evaluation timestamp (Unix or RFC3339)
  timeout?: string; // Query timeout (e.g., "30s", "1m")
  start?: string;   // [RANGE] Start time (RFC3339 UTC or Unix)
  end?: string;     // [RANGE] End time
  step?: string;    // [RANGE] Resolution (e.g., "1m", "5m")
}
```

**Output:**
```typescript
{
  success: boolean;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value?: [number, string];       // Instant query
      values?: Array<[number, string]>; // Range query
    }>;
  };
  status: string;
}
```

**Example Usage:**
```typescript
// Instant query - Current CPU usage
{
  query: "100 - (avg(rate(node_cpu_seconds_total{mode='idle'}[5m])) * 100)"
}

// Range query - Memory usage over time
{
  query: "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
  start: "2025-11-03T00:00:00Z",
  end: "2025-11-03T06:00:00Z",
  step: "5m"
}

// Check specific server load
{
  query: "node_load1{instance='10.188.0.10:9200'}"
}
```

## 📦 Tech Stack

### Core Framework
- **Next.js 16** - React framework dengan App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### AI & Backend
- **Vercel AI SDK 5.0.87** - AI SDK untuk streaming dan tool calling
- **OpenRouter** - LLM provider untuk Claude Sonnet 4.5
- **Zod 3.24.1** - Schema validation

### Data Sources
- **@notionhq/client 2.2.15** - Notion API client
- **@elastic/elasticsearch 8.16.1** - Elasticsearch client
- **axios 1.7.8** - HTTP client (for Prometheus queries)

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **react-markdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown support
- **react-syntax-highlighter** - Syntax highlighting untuk code blocks
- **recharts** - Chart library untuk visualisasi data
- **@uiw/react-json-view** - JSON viewer untuk tool messages

### Development
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## 💡 Components

### AssistantMessage
Menampilkan pesan dari AI assistant dengan:
- Avatar AI
- Support markdown rendering via MessageContent
- Styling dengan bubble chat kiri

### UserMessage
Menampilkan pesan dari user dengan:
- Bubble chat biru di kanan
- Support markdown rendering
- Custom styling untuk code blocks

### ToolMessage
Menampilkan detail eksekusi tool dengan:
- Tool call name
- Status indicator (working/completed/error) dengan color coding
- Expandable request/response dengan JSON viewer
- Real-time status updates

### MessageContent
Core component yang menangani rendering:
- **Markdown** - Full GFM support (tables, lists, headings, blockquotes, links)
- **Code Blocks** - Syntax highlighting untuk berbagai bahasa
- **Chart Rendering** - Custom chart syntax untuk line, bar, dan pie charts
- **Tables** - Styled markdown tables
- **Inline Code** - Code formatting untuk inline code

### InputForm
Form input untuk mengirim pesan:
- Textarea dengan keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Toggle button: Send (blue) / Stop (red)
- Responsive layout
- AbortController support untuk cancel requests

## 📊 Chart Syntax

MessageContent mendukung custom chart syntax menggunakan code block dengan language `chart`:

```chart
{
  "type": "bar",
  "data": [
    { "name": "Next.js", "performance": 95, "seo": 98 },
    { "name": "Create React App", "performance": 70, "seo": 65 }
  ],
  "options": {
    "xKey": "name",
    "bars": [
      { "dataKey": "performance", "name": "Performance", "color": "#8884d8" },
      { "dataKey": "seo", "name": "SEO Score", "color": "#82ca9d" }
    ]
  }
}
```

Supported chart types:
- `line` - Line chart
- `bar` - Bar chart
- `pie` - Pie chart

## 🎯 Example Queries

### Query Complaints
```
Pilih satu data komplain yang bertipe technical 3 hari yang lalu
```

### Investigate Specific Complaint
```
Cek komplain CALL-21566
```

### Analyze Transaction Logs
```
Analisa transaksi untuk kendaraan 부산99사9474
```

### Monitor Server Metrics
```
Cek CPU dan memory usage server bpa-orderer1 saat jam 2 siang
```

## 🐛 Troubleshooting

### Tool Results Not Displaying
- Check that `.env` file is configured correctly
- Verify Notion integration has access to the database
- Check Elasticsearch credentials and network connectivity
- Look at browser console for frontend errors
- Check server logs for backend errors

### Streaming Not Working
- Ensure Next.js is running in development mode (`npm run dev`)
- Check browser console for SSE connection errors
- Verify API route is responding (check Network tab)

### Notion API Errors
- Verify `NOTION_TOKEN` is correct
- Ensure database is shared with integration
- Check `NOTION_DATABASE_ID` matches your database

## 📚 Learn More

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Notion API](https://developers.notion.com/)
- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Technologies
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Recharts Documentation](https://recharts.org/)
- [Zod Schema Validation](https://zod.dev/)

## 🤝 Contributing

This is a specialized application for BPA operational analysis. For questions or contributions, please contact the development team.

## 📝 License

Copyright © 2025 BPA Operations Team

---

🤖 Built with [Claude Code](https://claude.com/claude-code)
