# Create a notification system

In the current system the users are not notified when things happen to their assets. For example, when an organizer accepts or refuses an inscription, the user is not notified about it. This can lead to a bad user experience, as the users need to be checking their inscriptions page to see if they have been accepted or refused.

We need to create a notification system that allows us to notify the users when something happens to their assets. For example, when an organizer accepts or refuses an inscription, the user should receive a notification about it.

There should be a notifications page where the users can see all their notifications. The notifications should have a title, a description, and a link to the asset that triggered the notification (e.g., the inscription that was accepted or refused).
The notifications should also have a "read" status, so that the users can mark them as read when they have seen them. The notifications should be ordered by date, with the most recent ones first.
The notifications should be created in the database and should be associated with the user that triggered the action (e.g., the user that created the inscription) and with the asset that triggered the notification (e.g., the inscription that was accepted or refused). It may contain the user that generated the notification (e.g., the organizer that accepted or refused the inscription). The type of the notification should also be stored in the database (e.g., "inscription accepted", "inscription refused", etc.) to be able to show different messages for each type of notification.

There should be in the header of the page a notifications icon with a red dot when there are unread notifications. When the user clicks on the icon, they should be taken to the notifications page.

The notifications page should be implemented in the #file:src/routes/(internal)/notifications/+page.svelte file. The notifications should be fetched from the database using a GET request to #file:src/routes/(internal)/api/notifications/+server.ts.
