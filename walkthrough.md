# Image Generation Backend Walkthrough

This backend service provides a unified API for generating images using OpenAI, Google Gemini, and Stability AI.

## Features
- **Unified API**: Single endpoint `/api/v1/generate-image` for all providers.
- **Provider Abstraction**: Easily switch between OpenAI, Gemini, and Stability AI via configuration.
- **Clean Architecture**: Modular structure with separate controllers, services, and providers.
- **Validation**: Request validation using Zod.
- **Security**: Helmet, CORS, and environment-based configuration.

## Project Structure
- `src/config`: Environment configuration.
- `src/controllers`: Request handling logic.
- `src/providers`: Provider implementations (OpenAI, Gemini, Stability).
- `src/services`: Business logic (Provider selection).
- `src/routes`: API route definitions.
- `src/utils`: Logger and error handling.

## How to Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Copy `.env.example` to `.env` and add your API keys.
    ```bash
    cp .env.example .env
    ```

3.  **Start Server**:
    ```bash
    npm run dev
    ```
    The server will start on port 3000 (default).

4.  **Test Frontend**:
    Open `http://localhost:3000` in your browser to use the simple test interface.

## API Usage

**Endpoint**: `POST /api/v1/generate-image`

**Request Body**:
```json
{
  "prompt": "A futuristic city",
  "referenceImages": [] // Optional
}
```

**Response**:
```json
{
  "success": true,
  "providerUsed": "openai",
  "imageBase64": "..."
}
```

## Configuration
Change the `DEFAULT_PROVIDER` in `.env` to switch providers:
- `openai`
- `gemini`
- `stability`
