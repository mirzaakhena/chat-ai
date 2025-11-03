# Chat AI - Next.js Application

Aplikasi chat AI interaktif yang dibangun dengan Next.js, menampilkan antarmuka chat yang modern dengan dukungan markdown, syntax highlighting, rendering chart, dan visualisasi tool execution.

## Features

- **Rich Message Rendering** - Dukungan penuh untuk markdown dengan GitHub Flavored Markdown (GFM)
- **Syntax Highlighting** - Code blocks dengan syntax highlighting menggunakan Prism
- **Chart Visualization** - Render charts (line, bar, pie) langsung dalam pesan menggunakan Recharts
- **Tool Execution Display** - Visualisasi tool call dengan status indicator (working, completed, error)
- **JSON Viewer** - Interactive JSON viewer untuk request/response data
- **Dark Mode Support** - Tema gelap dan terang
- **Responsive Design** - Layout yang responsif untuk berbagai ukuran layar

## Getting Started

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat aplikasi.

Edit halaman dengan memodifikasi `src/app/page.tsx`. Halaman akan auto-update saat file diedit.

## Project Structure

```
chat-ai/
├── src/
│   ├── app/
│   │   ├── globals.css       # Global styles dengan Tailwind directives
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Home page dengan demo messages
│   └── components/
│       ├── AssistantMessage.tsx    # Komponen untuk pesan AI
│       ├── UserMessage.tsx         # Komponen untuk pesan user
│       ├── ToolMessage.tsx         # Komponen untuk tool execution display
│       ├── MessageContent.tsx      # Core renderer untuk markdown, code, charts
│       └── InputForm.tsx           # Form input untuk mengirim pesan
├── public/                    # Static files
├── .eslintrc.json            # ESLint configuration
├── .gitignore                # Git ignore rules
├── next.config.js            # Next.js configuration
├── package.json              # Project dependencies dan scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Components

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
- Thinking message (opsional)
- Tool call name
- Status indicator (working/completed/error)
- Expandable request/response dengan JSON viewer
- Color coding berdasarkan status

### MessageContent
Core component yang menangani rendering:
- **Markdown** - Full GFM support (tables, lists, headings, blockquotes, links)
- **Code Blocks** - Syntax highlighting untuk berbagai bahasa
- **Chart Rendering** - Custom chart syntax untuk line, bar, dan pie charts
- **Tables** - Styled markdown tables
- **Inline Code** - Code formatting untuk inline code

### InputForm
Form input sederhana untuk mengirim pesan:
- Textarea untuk input
- Send button dengan icon
- Responsive layout

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build untuk production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Next.js 16** - React framework dengan App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **react-markdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown support
- **react-syntax-highlighter** - Syntax highlighting untuk code blocks
- **recharts** - Chart library untuk visualisasi data
- **@uiw/react-json-view** - JSON viewer untuk tool messages
- **ESLint** - Code linting

## Chart Syntax

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

## Learn More

Untuk mempelajari lebih lanjut tentang teknologi yang digunakan:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Recharts Documentation](https://recharts.org/)
