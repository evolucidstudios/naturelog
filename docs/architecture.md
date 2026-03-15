# Nature Log architecture

## Product pillars

- Owner-authenticated admin experience
- Public read-only decks and cards
- Image-first nature entry creation
- Deep, upgradeable AI tagging
- Location-aware browsing and map exploration

## Recommended services

- Next.js for app shell and routes
- Supabase Auth for owner login
- Supabase Postgres for entries, tags, decks, and share visibility
- Supabase Storage for uploaded images
- Mapbox for map rendering and clustering
- OpenAI vision + structured outputs for initial taxonomy extraction

## Suggested phases

1. Auth, schema, uploads, and manual entry editing
2. Public read-only decks and card pages
3. Real map with pin clustering and location filters
4. AI ingestion pipeline for image analysis and taxonomy suggestions
5. Tag graph refinements, bulk edits, and smarter search

## Data model direction

- `entries`: one row per nature find
- `entry_images`: one-to-many uploaded images
- `tags`: canonical reusable tags
- `entry_tags`: join table between entries and tags
- `decks`: saved filtered groups or curated groupings
- `deck_entries`: optional manual ordering inside curated decks
- `share_settings`: public/private controls per resource
- `ai_runs`: store model results, versions, and reprocessing history

## AI tagging strategy

- Keep raw model output separate from canonical tags
- Save confidence scores and model version per suggestion
- Allow human approval, rejection, and manual tag additions
- Support reruns with stronger models later without losing edit history
