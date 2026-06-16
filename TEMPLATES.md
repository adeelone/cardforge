# Templates

Templates live in `src/editor/templates/templates.ts`.

Each template defines:

- `id`
- `name`
- `notes`
- `theme`
- `elements`

Element IDs should stay semantic and stable:

- `name`
- `title`
- `company`
- `tagline`
- `contact`
- `qr`

Stable IDs let CardForge preserve content when users switch templates. Template text supports tokens like `{name}`, `{title}`, `{company}`, `{tagline}`, `{department}`, `{pronouns}`, and `{contacts}`.

## Add a Template

1. Add a new object to the `templates` array.
2. Use `el(...)` for every element.
3. Include both `front` and `back` elements.
4. Keep the layout inside the `336 x 192` design coordinate system.
5. Add designer notes that explain the intended use.
6. Run `npm run typecheck` and `npm run test`.
