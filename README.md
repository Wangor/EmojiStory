# Emoji Movie MVP — with GPT-5 nano integration

## Setup
1) Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`.
2) Install & run:
```bash
yarn && yarn dev
# or pnpm i && pnpm dev
# or npm i && npm run dev
```
Open http://localhost:3000 and click **Generate with AI**.

## Notes
- Uses OpenAI Responses API with `gpt-5-nano` and JSON Schema to guarantee valid output.
- Server validates with Zod before sending to the client.
- Emoji actors and backgrounds can use any Unicode emoji. The `lib/assets` module
  contains example emoji with suggested default scales, but the model is free to
  infer real-world size relationships when new emoji are used.

## Video Endpoint
Clients can request a rendered MP4 for any clip by calling:

```
GET /api/video/<clipId>
```

The server generates each frame on the fly using the clip's animation data and returns
an H.264 MP4 stream that clients can download or play directly.
