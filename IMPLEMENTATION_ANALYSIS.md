# Implementation Analysis - Image Generation API

## Task Requirements (Excluding AWS & Infrastructure)

### Functional Requirements:
1. ✅ Secure deployed API endpoint for image generation
2. ✅ Text-only prompts supported
3. ✅ Text + reference images supported (optional `referenceImages` array)
4. ✅ Returns permanent URL of generated image
5. ⚠️ Scalability for thousands of requests (needs improvement)

### Technical Requirements:
1. ✅ NodeJS + TypeScript
2. ❌ **SQL Database - NOT IMPLEMENTED YET**

---

## What's Currently Implemented

### ✅ Core Features
- **Image Generation Endpoint**: `POST /api/v1/generate-image`
  - Validates requests using Zod
  - Supports text prompts
  - Supports optional reference images (base64)
  - Returns permanent URL via storage service

- **Multiple AI Providers**: 
  - OpenAI (DALL-E)
  - Google Gemini
  - Stability AI
  - Provider abstraction layer for easy switching

- **Storage Service**:
  - Supabase Storage (implemented)
  - AWS S3 (needs to be removed per requirements)
  - Returns permanent URLs

- **Authentication**:
  - Google OAuth via Passport.js
  - Session-based authentication
  - Protected routes with `requireAuth` middleware

- **Error Handling**:
  - Global error handler
  - Custom AppError class
  - Proper HTTP status codes

- **Logging**:
  - Pino logger with pretty formatting
  - Structured logging

---

## What's Missing / Needs Work

### ❌ Database Implementation (REQUIRED)

**Current State**: No database is being used. Authentication is session-based only (no user persistence).

**Where Database Should Be Used**:

#### 1. **User Management** (HIGH PRIORITY)
   - **Current**: Users are stored only in session (in-memory)
   - **Needed**: 
     - Store user profiles in database
     - Track user registration/login history
     - Store user preferences/settings
     - **Tables Needed**:
       ```sql
       users (
         id UUID PRIMARY KEY,
         email VARCHAR UNIQUE,
         name VARCHAR,
         picture_url VARCHAR,
         google_id VARCHAR UNIQUE,
         created_at TIMESTAMP,
         updated_at TIMESTAMP
       )
       ```

#### 2. **Request History & Audit Log** (HIGH PRIORITY)
   - **Current**: No tracking of generated images
   - **Needed**:
     - Track all image generation requests
     - Store prompt, provider used, timestamp
     - Link requests to users
     - **Tables Needed**:
       ```sql
       image_generations (
         id UUID PRIMARY KEY,
         user_id UUID REFERENCES users(id),
         prompt TEXT,
         provider_used VARCHAR,
         image_url VARCHAR,
         reference_images_count INT,
         status VARCHAR, -- 'pending', 'completed', 'failed'
         created_at TIMESTAMP,
         completed_at TIMESTAMP,
         error_message TEXT
       )
       ```

#### 3. **Rate Limiting & Quotas** (MEDIUM PRIORITY)
   - **Current**: No rate limiting implemented
   - **Needed**:
     - Track requests per user per time period
     - Implement daily/monthly quotas
     - Prevent abuse
     - **Tables Needed**:
       ```sql
       rate_limits (
         id UUID PRIMARY KEY,
         user_id UUID REFERENCES users(id),
         request_count INT,
         window_start TIMESTAMP,
         window_type VARCHAR -- 'daily', 'monthly'
       )
       ```

#### 4. **Job Queue for Scalability** (MEDIUM PRIORITY)
   - **Current**: Synchronous processing (blocks until image is generated)
   - **Needed for Scale**:
     - Queue image generation jobs
     - Process jobs asynchronously
     - Track job status
     - **Tables Needed**:
       ```sql
       jobs (
         id UUID PRIMARY KEY,
         user_id UUID REFERENCES users(id),
         type VARCHAR, -- 'image_generation'
         status VARCHAR, -- 'queued', 'processing', 'completed', 'failed'
         payload JSONB, -- request data
         result JSONB, -- response data
         created_at TIMESTAMP,
         started_at TIMESTAMP,
         completed_at TIMESTAMP,
         error_message TEXT
       )
       ```

#### 5. **Analytics & Metrics** (LOW PRIORITY)
   - Track provider usage statistics
   - Track average generation time
   - Track success/failure rates
   - Can be derived from `image_generations` table

---

## Action Items

### Immediate (Required)
1. **Remove AWS Storage Provider**
   - Remove `AwsStorageProvider.ts`
   - Remove AWS config from `env.ts`
   - Update `StorageService.ts` to only use Supabase

2. **Add SQL Database**
   - Choose database: PostgreSQL (recommended) or MySQL
   - Set up database connection (use `pg` or `mysql2`)
   - Create database schema/migrations
   - Implement user persistence in Passport callback

### High Priority
3. **User Persistence**
   - Save users to database on first login
   - Update session to use database user ID
   - Add user lookup by Google ID

4. **Request Tracking**
   - Log all image generation requests to database
   - Link requests to users
   - Store metadata (prompt, provider, URL, status)

### Medium Priority
5. **Rate Limiting**
   - Implement database-backed rate limiting
   - Add middleware to check quotas
   - Return appropriate error messages

6. **Scalability Improvements**
   - Implement job queue (Bull/BullMQ with Redis, or database-backed queue)
   - Make image generation asynchronous
   - Add job status endpoint

### Low Priority
7. **Analytics Endpoints**
   - User dashboard with generation history
   - Admin endpoints for metrics

---

## Database Schema Summary

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture_url VARCHAR(500),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Image generations table
CREATE TABLE image_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    provider_used VARCHAR(50) NOT NULL,
    image_url VARCHAR(500),
    reference_images_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Rate limiting table
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP NOT NULL,
    window_type VARCHAR(20) NOT NULL, -- 'daily', 'monthly'
    UNIQUE(user_id, window_start, window_type)
);

-- Jobs table (for async processing)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'queued',
    payload JSONB,
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Indexes for performance
CREATE INDEX idx_image_generations_user_id ON image_generations(user_id);
CREATE INDEX idx_image_generations_created_at ON image_generations(created_at);
CREATE INDEX idx_rate_limits_user_window ON rate_limits(user_id, window_start, window_type);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
```

---

## Recommended Database: PostgreSQL

**Why PostgreSQL?**
- Excellent JSON support (JSONB for job payloads)
- UUID support out of the box
- Great performance for concurrent requests
- Strong ecosystem (Prisma, TypeORM, Knex.js)
- Works well with Supabase (if you want to use Supabase for both storage and database)

**Alternative**: MySQL/MariaDB (also acceptable per requirements)

---

## Next Steps

1. Choose database (PostgreSQL recommended)
2. Set up database connection library (pg, Prisma, or TypeORM)
3. Create migration files for schema
4. Update Passport callback to persist users
5. Add request logging to ImageService
6. Implement rate limiting middleware
7. Remove AWS dependencies

