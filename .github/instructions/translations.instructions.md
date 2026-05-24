## Translations

Translations must be added to the appropriate JSON files in `src/lib/translations/`. Each language has its own folder (e.g., `en`, `es`, `ca`), and within each folder, there are JSON files that group related translations (e.g., `common.json`, `explore_competitions.json`).

When adding a new translation, follow these steps:
1. Identify the appropriate JSON file for the translation. If it doesn't exist, create a new one with a descriptive name.
2. Add the new translation key and its corresponding value in the JSON file. Use a consistent naming convention for keys (e.g., snake_case).
3. If the translation includes dynamic values (e.g., counts, dates), use placeholders (e.g., `{{count}}`) in the translation string. Names of the interpolation variables should be at least 2 characters long.
