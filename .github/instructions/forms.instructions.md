---
applyTo: "**/+page.svelte
---

This file defines how to work with a front-end page that contains a form.

1. Forms should use Skeleton UI components for consistency and accessibility.
2. Each form page must start with an `<h4>` element to indicate the title of the page.
3. If the form creates a new object, make sure you maintain the page in order it can be used to update the object later. We aim for a consistent user experience.
4. Use appropriate input types for form fields (e.g., `type="email"` for email fields).
5. Implement client-side validation to provide immediate feedback to users with zod taking into account the model definitions from Prisma.
6. Ensure that the form is responsive and works well on different screen sizes.
7. On form submission, handle both success and error states gracefully, providing clear feedback to the user.
  7.1 On success, redirect the user to an appropriate page or show a success message.
  7.2 On error, display error messages next to the relevant form fields and focus on the first invalid field.
