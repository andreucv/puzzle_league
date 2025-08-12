# Creating and Editing a Competition User Experience Analysis

## Purpose
The user needs to create and edit a competition.
This is useful to define the frontend page that will enable these workflows.

## Needed workflows

An Organizer is able to set the name of the Competition
An Organizer is able to set the description of the Competition
An Organizer is able to set the location of the Competition
An Organizer is able to set the start date of the Competition
An Organizer is able to set the end date of the Competition
An Organizer is able to add and remove Categories to the Competition
An Organizer is able to select which type of Category is each Category
An Organizer is able to set the name of each Category
An Organizer is able to set the Start Time of each Category
An Organizer is able to set the End Time of each Category
An Organizer is able to set the Max Parties that can participate in each Category
An Organizer is able to set how many participants are in each Party

## Needed components

### Composite Components
- **CategoryEditor** - A complex component that combines multiple inputs (name, type, times, limits) for managing individual categories
- **CategoryList** - For displaying and managing multiple categories with add/remove functionality

## How the page is structured

### Props
- Competition Data (Optional) - If the data is present, the page will be in Edit mode, and the form will be pre-filled with the data of the Competition. If the ID is not present, the page will be in Create mode, and the form will be empty.

### Logic in the page
The page will have a state with the following properties:
- Name of the Competition
- Description of the Competition
- Location of the Competition
- Start Date of the Competition
- End Date of the Competition
- A list of Categories

Categories need to be binded to the CategoryList component, and the CategoryList component will be responsible for managing the state of the Categories.

### Page Layout
- Header of the page (an h4 element with the text "Create Competition" or "Edit Competition" depending on the context)
- A form with the following fields:
  - Name of the Competition
  - Description of the Competition
  - Location of the Competition
  - Start Date of the Competition
  - End Date of the Competition
  - A Button to add a new Category
  - A CategoryList component
  - A Button to submit the form


