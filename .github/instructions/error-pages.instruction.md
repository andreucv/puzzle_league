# Error pages

All error pages should be designed to be helpful and informative to the user. They should provide clear information about the error that occurred and offer suggestions for how to resolve the issue.

When designing error pages, consider the following:
1. There is an error dictionary in [src/app.t.ds] that contains all the error messages used in the application. When creating a new error page, make sure to add the corresponding error message to this dictionary.
2. There is an error component in [src/lib/components/common/ErrorPage.svelte] that must be used to display the error message on the error page. This component is designed to provide a consistent look and feel across all error pages in the application.
3. When creating a load error redirection from a +page.server.ts file, use the throw error function to throw an error with the appropriate status code and message. This will ensure that the error is properly handled and displayed on the error page.

Other considerations:
  - In [hooks.server.ts] there is an error handle function that can be used to catch and handle errors globally. This can be useful for logging errors or providing a fallback error page for unexpected errors.
