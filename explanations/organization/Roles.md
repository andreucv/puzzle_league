I need to create user roles.
There are 4 main roles:
1. Participant: This is the default user role for every one. They can List all the competitions.
2. Organizer: This role is the one that is needed to be able to access the create competition form. Enables users to Create, Update and Delete their competitions.
3. Judge: A user can be judge of a Competition. Organizers can select judges. They only can write Participants finish times.
4. Admin: This role is administrator of the app and can Create, Update and Delete any field of a competition.

When a user first login, is assigned a Participant role.
If a user wants to apply for Organizer role, the user needs to apply for it in a form inside (auth)/profile/+page.svelte page.
If a user wants to apply for Judge role in a Competition, the user needs to apply for it in the competitions page.
There is no possibility a user can apply to Admin role.

The roles holded by the user should be shown in their profile page (auth)/profile/+page.svelte
