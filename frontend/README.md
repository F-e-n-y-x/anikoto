# YugenAnime Frontend

Next.js 15 App Router frontend faithful to the original YugenAnime experience.

## Development

```bash
npm install
npm run dev
```

Ensure `.env.local` is present in this directory:

```env
NEXT_PUBLIC_API_BASE=http://localhost:4444/api
```

## Vercel Deployment

Deploy directly to Vercel and set `NEXT_PUBLIC_API_BASE` pointing to your backend server URL in Vercel project environment variables.
