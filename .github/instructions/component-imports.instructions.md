# Component Imports Instructions

When importing components, follow these guidelines:
1. **Use Absolute Imports**: Always use absolute imports starting with `$lib` for components within the `src/lib` directory. This improves readability and maintainability.
   ```ts
   // Good
   import MyComponent from '$lib/components/MyComponent.svelte';

   // Bad
   import MyComponent from '../../components/MyComponent.svelte';
   ```
  
2. **Mixed import routes**: Cannot import a component from a different route. This means that shareability of components should be done via the `src/lib/components` directory, and not by importing across different route directories.
   ```ts
   // Good
   import MyComponent from '$lib/components/MyComponent.svelte';

   // Bad - importing from a different route
   import MyComponent from '../(auth)/components/MyComponent.svelte';
   ```
   If you find yourself needing to import a component across routes, you must move it to the `src/lib/components` directory to make it reusable. And also look for usages of the component and update them to the new import path.