# Create Review Submissions from Organizers task

This workflow is to define the system of Inscriptions for Categories in Competitions work.

## Steps
1. When an Organizer creates a Competition, they can add Categories to it. Each Category has a type (e.g., Puzzle, Lightning, etc.).
2. The users participants can inscribe to a Category in a Competition. This is done by using the #file:src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.svelte which sends a POST request to #file:src/routes/(internal)/api/inscriptions/[id=integer]/create/+server.ts. This creates an Inscription in the database with status "PENDING".
3. The Organizers can then see the list of Inscriptions for each Category in the Competition. This needs to be implemented in the #file:src/routes/(internal)/(auth)/(organizer)/competition/[id=integer]/manage_inscriptions/+page.svelte page.
In this page the options available are:
    3.1 Listing all the inscriptions in each of the categories of the competition
    3.2 Accepting or refusing each inscription, based on their own criteria.

4. When an Organizer accepts an Inscription, the status of the Inscription is updated to "ACCEPTED" in the database. This is done by sending a POST request to #file:src/routes/(internal)/api/inscriptions/[id=integer]/accept/+server.ts.
5. There needs to be a "wait list" for each Category, so that if the number of total inscriptions exceeds the maximum number of participants allowed for that Category, the additional inscriptions are put in a wait list.

6. When an Organizer refuses an Inscription, the status of the Inscription is removed from the database and a notification is sent to the user (or users from a party) that their inscription has been refused. This is done by sending a POST request to #file:src/routes/(internal)/api/inscriptions/[id=integer]/refuse/+server.ts. Please take into account that the inscription should be removed from the database.
7. Then the "REFUSED" state for inscriptions is not needed. Please remove it.
8. All the inscriptions must be processed by the Organizer of a competition, so that they can manage the number of participants in each Category and ensure that the competition runs smoothly. No automatic acceptance or refusal of inscriptions should be implemented, as the Organizers should have full control over who participates in their competition.
9. When an organizer accepts an inscription, a notification should be sent to the user (or users from a party) that their inscription has been accepted. This is done by sending a POST request to #file:src/routes/(internal)/api/inscriptions/[id=integer]/accept/+server.ts.

