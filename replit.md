# PayorSync - Contract Management & Variance Analysis Platform

## Overview

PayorSync is a comprehensive contract management and payment variance analysis platform designed for dialysis service providers. The application enables end-to-end workflow management for payor contracts, including contract drafting with AI-powered clause suggestions, variance identification and analysis, and integration with healthcare systems like Oracle/Cerner EHR.

The platform addresses key challenges in healthcare revenue cycle management:
- Digitizing and structuring executed payor contracts
- Calculating expected reimbursement accurately
- Automating payment variance identification and classification
- Providing AI-enabled insights for root-cause analysis

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables
- **Build Tool**: Vite with custom plugins for meta images and Replit integrations

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **File Uploads**: Multer for handling PDF contract uploads
- **AI Integration**: OpenAI API (via Replit AI Integrations) for clause extraction and suggestions

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Connection**: Connection pooling via `pg` package

### Key Data Models
- **Clause Library**: Categories and templates for contract clauses with versioning
- **Contracts**: Full contract lifecycle tracking with payor associations
- **Variances**: Payment variance records with status tracking and root cause analysis
- **Payors**: Healthcare payor/insurance company records

### Application Structure
```
client/src/          - React frontend application
  pages/             - Route components (dashboard, contracts, variances, etc.)
  components/        - Reusable UI components
  lib/               - Utilities and query client configuration

server/              - Express backend
  routes.ts          - API endpoint definitions
  storage.ts         - Database operations interface
  replit_integrations/ - AI chat and image generation modules

shared/              - Shared code between client/server
  schema.ts          - Drizzle database schema and Zod validators
```

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with PostgreSQL dialect

### AI Services
- **OpenAI API**: Accessed through Replit AI Integrations for:
  - Contract clause extraction from PDFs
  - AI-powered clause suggestions during contract drafting
  - Chat-based assistance
  - Image generation capabilities
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### PDF Processing
- **pdf-parse**: Server-side PDF text extraction for contract ingestion

### Session Management
- **connect-pg-simple**: PostgreSQL-backed session storage

### Third-Party UI Libraries
- **Recharts**: Data visualization for analytics dashboards
- **Lucide React**: Icon library
- **React Day Picker**: Calendar/date selection components
- **Embla Carousel**: Carousel functionality