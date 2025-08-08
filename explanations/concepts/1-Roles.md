# User Roles

Users will hold different roles depending on their privileges inside the system.

### Participant
This is the default user role for every one. Every user logged in our system will hold this role.
It is not used to give any special privileges to the user, but to be able to assign the user to a competition.

### Organizer
This role is gives permission the user to create CRUD competitions and all of their related fields.
The organizer can also assign judges to a given competition.
The organizer of a competitions is also a judge of that competition.

### Judge
A user can be judge of a given competition.
Organizers can select judges. 
The only privilege this role has is that they can write Entries finish times.

### Admin
This role is administrator of the app and can Create, Update and Delete any field of the database.

## Roles Workflows

When a user first login, is assigned a Participant role.
If a user wants to apply for Organizer role, the user needs to apply for it in a form inside (auth)/profile/+page.svelte page.
If a user wants to apply for Judge role in a Competition, the user needs to apply for it in the competitions page.
There is no possibility a user can apply to Admin role.

The roles holded by the user should be shown in their profile page (auth)/profile/+page.svelte
