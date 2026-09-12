# Lumen — landing page clone

Next.js 14 (App Router) + Tailwind CSS.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Where things live

- `app/globals.css` — background color, smooth-scroll, easing curve, focus ring
- `tailwind.config.js` — the full color palette (`bg`, `card`, `lime`, `ink`, `inkdim`, `stroke`) and the `float` / `glow` "comfort" animation keyframes
- `components/DashboardMock.tsx` — the connected-cards hero visual
- `components/Hero.tsx` — headline, copy, CTAs
- `components/FeatureStrip.tsx`, `components/Footer.tsx` — supporting sections
- `components/Reveal.tsx` — the gentle fade/rise-on-scroll used on the lower sections

## Swap in your own brand

Replace "Lumen" in `components/Nav.tsx` and `app/layout.tsx`, and rewrite the
copy in `Hero.tsx` / `FeatureStrip.tsx` / `Footer.tsx` — everything else
(spacing, palette, motion) will carry over automatically.
