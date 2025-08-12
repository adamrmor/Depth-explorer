# Depth Explorer Kiosk

Static kiosk built for gallery use. Landing screen is Explore by Depth with a vertical depth slider that filters species from a JSON file.

## Structure
- `index.html` Explore by Depth
- `grid.html` All species view
- `item.html` Species detail
- `styles.css` High-contrast, glass-inspired styling
- `app.js` Depth slider logic and filtering
- `grid.js` Grid listing logic
- `item.js` Detail page rendering
- `data/species.json` Content
- `assets/` Images and icons

## Local run
```bash
npm install
npm start
```
Open the URL printed by serve.

## Deploy to Railway
1. Create a new project and link to this repo.
2. Set the start command to `npm start` if needed.
3. Railway will install dependencies and run the server. No build step required.

## Content editing
Edit `data/species.json`. Each entry supports:
- id, common_name, also_known_as, group
- depth_min_m, depth_max_m
- regions[], summary, body[], look_for[], display_note, image

Images go in `/assets` and are referenced by relative path.
