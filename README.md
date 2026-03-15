# Nature Log

Local starter for a high-end nature collection app with decks, card detail
views, public sharing, location browsing, and an upgrade-ready AI tagging
architecture.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current starter includes

- Custom landing page and product direction
- Deck routes at `/deck/[slug]`
- Card detail routes at `/card/[id]`
- Map route at `/map`
- Sample data model for entries, decks, tags, and GPS locations
- `.env.example` placeholders for Supabase, Mapbox, and OpenAI

## Next build steps

1. Connect Supabase auth and create owner-only editing
2. Add database tables and storage buckets
3. Replace placeholder image panels with uploads
4. Add Mapbox for real interactive pins
5. Add AI tagging pipeline and editable tag approvals
