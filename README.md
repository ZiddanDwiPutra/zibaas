# ZiBaaS - Ziddan Backend as a Service

![ZiBaaS Header Image](public/assets/zibaas.png)

ZiBaaS is a powerful, self-hosted, no-code backend engine and database schema generator built on Next.js, Material UI (MUI), and PostgreSQL (Neon / Serverless Pool). It empowers developers to build, deploy, test, and manage RESTful database APIs in seconds without writing a single line of backend code.

### 🌐 Live Demo: [https://zibaas.netlify.app](https://zibaas.netlify.app)

---

## 🚀 Features

- **No-Code Schema Wizard**: Dynamically build database tables with custom column definitions. Supports:
  - Text, Integer, Boolean, Timestamp, and Relational types.
  - Custom Primary Keys: Choose between standard auto-incrementing integer IDs (`SERIAL`) or universally unique IDs (`UUID`).
- **Automatic REST API Generation**: Instantly maps new tables to standard CRUD REST API endpoints (`GET`, `POST`, `PUT`, `DELETE`).
- **Dynamic CORS Whitelist Controller**: Control cross-origin access. Enable public access (`*`) or restrict requests to a whitelist of specific domains.
- **Dynamic Multi-Column Search**: Built-in case-insensitive fuzzy search (`?search=keyword`) querying all text columns automatically.
- **Built-in API Tester (Fetch Playground)**: Test your newly created endpoints directly in the browser with full HTTP method options, request body JSON inputs, and styled JSON responses.
- **Interactive Multi-Page Guide**: Interactive step-by-step documentation detailing Schema Design, API Access, Search & Pagination, and CORS settings.
- **Sleek Dark Mode**: Aesthetic gray, black, and brown dark theme designed for developer comfort.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **UI Components**: [Material UI (MUI)](https://mui.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**: PostgreSQL (via Serverless Neon Database Pool) or built-in fallback memory database.

---

## ⚙️ Getting Started

### 1. Clone & Install

```bash
git clone <repository-url>
cd zibaas
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
# Optional: Neon PostgreSQL connection string (defaults to fallback memory database if omitted)
NEON_DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Optional: API Gateway protection key (if set, requires x-api-key or Authorization Bearer header)
ZIBAAS_API_KEY="your-secret-api-key"
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the ZiBaaS Dashboard.
