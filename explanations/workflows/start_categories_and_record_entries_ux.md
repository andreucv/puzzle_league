# Starting Categories from a Competition and Recording the results

## Purpose
The organizer and judges of a competition need to start the categories running at that time. We need to do a start and stop of the timer because the categories start times are not always punctual.
Once the categories are started, the judges will be able to record the results of the competitors in each category.

## Needed workflows

An Organizer is able to start the categories start time and stop it.
A Judge is able to record the results of the competitors in each category.

## Needed Data in the Database
- Category:
    - Real Start Time
    - Real End Time
    - Status

- Entries:
    - Table Number
    - Finish Time

- Competition:
    - Roles-Users assigned to the competition (Organizer, Judge)

### Composite Components

- Category Card to start/stop the category

## How the page is structured

### Props

- Competition Data (Mandatory)
- Categories Data including Entries (Mandatory)
- Judges Data (Mandatory)

### Page Layout
- Header
- Competition assigned judges list (add new judge button)
- Categories List about to start with their status
    - Category name
    - Scheduled start time
    - Start button

- Categories List already started with their status
    - Stop button
    - Entries list (sortable by time, table number, name, quick search (name, table number))

- Add new entry result form available from a scanned QR code
