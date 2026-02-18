---
applyTo: "**/+page.svelte
---

# Types of pages in the front-end

There are two types of front-end pages.
1. Pages to show information.
To show information, use the appropriate components to ensure a consistent design across the application. For example, use the CompetitionTitle component to display the title of a competition, and use the Card component to display information in a visually appealing way.

2. Action pages to start a process (forms or other interactions)
In action pages, the main focus is on the user interaction. Use the appropriate components to guide users through the process and make it easy for them to complete their tasks. For example, use the TitleBackButton component to provide a clear way for users to navigate back to the previous page.
Sometimes will be used form actions, and sometimes will be used api endpoints.

In both types of pages, it's important to maintain a consistent design and user experience. Use the components provided in the lib/components directory to ensure that your pages fit seamlessly into the overall design of the application. Additionally, make sure to follow the design guidelines and best practices for front-end development to create a user-friendly and visually appealing interface.

## Using the Card component

When you need to display information in a card format, use the Card component from lib/components/common/card/Card.svelte. This component provides a consistent design and makes it easier to maintain the code. Instead of creating a new div with card classes, simply wrap your content inside the Card component. This ensures that all cards across the application have a uniform appearance and behavior, and it also allows for easier updates in the future if the card design needs to be changed.

## Using the ExploreCompetitionCard component

When displaying a list of competitions, use the ExploreCompetitionCard component from lib/components/competition/explore/ExploreCompetitionCard.svelte. This component is specifically designed to display competition information in a card format and provides a consistent design for all competition cards across the application. By using this component, you can ensure that the competition information is presented in a visually appealing way and that users can easily navigate to the competition details page by clicking on the card.
