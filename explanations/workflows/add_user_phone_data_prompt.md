Implement this feature end-to-end in the current SvelteKit + Svelte + Prisma application. Please first make a plan.

Before coding, inspect and follow the existing patterns in:
- prisma/schema.prisma
- src/app.d.ts
- src/lib/auth.ts
- src/lib/database/database.ts
- src/hooks.server.ts
- src/routes/+layout.server.ts
- src/routes/(internal)/(auth)/+layout.server.ts
- src/routes/(internal)/(auth)/profile/+page.server.ts
- src/routes/(internal)/(auth)/profile/+page.svelte
- src/lib/components/UserCard.svelte
- src/routes/(internal)/claim-participations/+page.server.ts
- src/lib/translations/en/common.json
- src/lib/translations/es/common.json
- src/lib/translations/ca/common.json
- e2e/profile/profile.test.ts

Goal

Add optional phone data to the user profile. The phone must be stored as two separate fields: phonePrefix and phoneNumber. Also add a one-time authenticated onboarding page that asks the user to add their phone number so organizers can contact them if there is a problem with a registration. We require this text in the page so users know when they will be contacted.

Requirements

1. Data model
- Update the User model in prisma/schema.prisma to add nullable phonePrefix and phoneNumber fields.
- Add a persisted one-time flag or timestamp on User, such as phonePromptSeenAt, so the onboarding page is shown only once. Do not rely on in-memory state for this.
- Create a Prisma migration with a descriptive name and regenerate the Prisma client.
- Update all affected types and user hydration code, including src/app.d.ts and src/lib/database/database.ts.

2. Profile page
- Extend the existing profile flow in src/routes/(internal)/(auth)/profile/+page.server.ts, src/routes/(internal)/(auth)/profile/+page.svelte, and src/lib/components/UserCard.svelte. Do not redesign the whole page.
- Add editable fields for phone prefix and phone number.
- Keep the current profile UX pattern based on SvelteKit form actions and progressive enhancement.
- Validation rules:
- the whole phone feature is optional
- if one of prefix or number is provided, the other is required
- prefix must be trimmed and start with +
- number must be trimmed and validated as a phone number string with reasonable normalization
- Saving phone from the profile should also mark phonePromptSeenAt as handled, so the onboarding redirect does not happen later.

3. One-time onboarding page
- Create a new authenticated page under the auth route group, for example /add-phone.
- The page should use the repo’s normal front-end conventions:
- start with an h4 title
- use the Card component instead of ad hoc card divs
- use Skeleton UI form inputs
- The page should explain why the phone is requested, with natural English text:
- Add your phone number
- Add your phone number so organizers can contact you if there is a problem with your registration.
- You can skip this step and update it later from your profile.
- Provide two actions:
- Save phone number
- Skip for now
- Successful save and explicit skip must both mark phonePromptSeenAt so the auto-redirect happens only once.
- If the user already has both phone fields filled, or has already handled the prompt, visiting /add-phone should redirect to /.

4. Redirect behavior
- Reuse the existing first-login redirect approach in src/hooks.server.ts as a reference, but implement the “show once” logic with the persisted DB field, not a Set in memory.
- Preserve the existing claim-participations flow.
- Redirect order should be:
- first, keep the current claim-participations redirect if it applies
- otherwise, redirect authenticated users without phone data and without phonePromptSeenAt to /add-phone
- Avoid redirect loops. Exclude at least /add-phone, /claim-participations, /api/*, and /auth/* from this redirect logic.

5. Copy and translations
- Add translation keys for the new phone/profile/onboarding texts in src/lib/translations/en/common.json, src/lib/translations/es/common.json, and src/lib/translations/ca/common.json.
- Use correct wording. Replace “organizators” with “organizers”.
- Keep the new text consistent with the tone already used in the app.

6. Tests
- Extend e2e/profile/profile.test.ts or add closely related Playwright coverage in the profile area.
- Add data-testid attributes for the new phone inputs and buttons and use them in tests.
- Cover at least these cases:
- an authenticated user can add or update phone data from the profile page
- a new authenticated user without phone data is redirected once to /add-phone
- skipping the onboarding page marks it as handled and prevents future redirects
- a user who already has phone data is not redirected to /add-phone
- the existing claim-participations redirect still works

Constraints
- Do not call auth.api.getSession() in page loaders or form actions. Use event.locals.user, event.locals.session, or await parent() following the performance rules already used in the repo.
- Keep Prisma imports compatible with the repo rules. Do not introduce runtime imports from Prisma into client-side Svelte files.
- Prefer SvelteKit form actions over creating a new API endpoint unless there is a clear reason not to.
- No notification type is needed for this feature.
- Keep the implementation minimal, consistent with the existing structure, and production-ready.

Acceptance criteria
- User can optionally store phonePrefix and phoneNumber in the database.
- User can edit those fields from the profile page.
- Authenticated users who have not provided a phone number see a one-time onboarding page.
- The onboarding page is shown only once, even if the user skips it.
- Existing auth and claim-participations behavior is not broken.
- Phone data is not shown on the public profile.
- Relevant Playwright coverage is added or updated.
