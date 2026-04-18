---
description: Button styling guidelines for CineCasa
---

# Button Styling Guidelines

## Assistir (Play) Button

**Colors:**
- Background: `#00A8E1` (cyan/blue - CineCasa logo color)
- Hover: `#00A8E1`/80 (80% opacity)
- Text: white

**Border Radius:** `20px` (`rounded-[20px]`)

**Example:**
```tsx
<button className="flex items-center gap-2 px-5 py-2 bg-[#00A8E1] hover:bg-[#00A8E1]/80 text-white rounded-[20px] font-semibold text-sm transition-all">
  <Play className="w-4 h-4 fill-white" />
  <span>Assistir</span>
</button>
```

## Trailer Button

**Colors:**
- Background: `#FF0000` (red - YouTube brand color)
- Hover: `#CC0000` (darker red)
- Text: white

**Border Radius:** `20px` (`rounded-[20px]`)

**Example:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-[20px] font-medium text-sm transition-all">
  <Film className="w-4 h-4" />
  <span>Trailer</span>
</button>
```

## Files to Update

When adding new buttons, ensure these files have consistent styling:

- `src/components/MobileNetflixHero.tsx` - Mobile banner buttons
- `src/components/PremiumHeroBanner.tsx` - Desktop banner buttons
- `src/pages/Details.tsx` - Details page buttons
- `src/pages/MovieDetails.tsx` - Movie details buttons
- `src/pages/SeriesDetails.tsx` - Series details buttons

## Responsive Considerations

- Mobile: Smaller padding (`px-4 py-2`)
- Desktop: Larger padding (`px-6 py-3`)
- Always use `sm:` and `md:` prefixes for responsive sizing
