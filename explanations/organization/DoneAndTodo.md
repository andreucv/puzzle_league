# All possible workflows

## Already implemented

### Authentication & Login
- Given a user is on the login page, When they enter valid credentials, Then they are redirected to the home page
- Given a user is on the login page, When they enter invalid credentials, Then an error message is displayed
- Given a user is logged in, When they click sign out, Then they are redirected to the login page
- Given a user is not logged in, When they access a protected page (profile/admin), Then they are redirected to the login page

### Account Management
- Given a user is on the login page, When they click create account button, Then the password confirmation field becomes visible
- Given a user is logged in, When they navigate to their profile, Then they can view their account information
- Given a user is logged in as Admin/Organizer, When they view their profile, Then their role is displayed

### Role-Based Access Control
- Given a participant user is logged in, When they try to access admin pages, Then they see an "Access Denied" message
- Given an organizer is logged in, When they open the navigation menu, Then they can see the "Create Competition" option
- Given a participant is logged in, When they open the navigation menu, Then they cannot see the "Create Competition" option
- Given an admin user authenticates, When the authentication completes, Then their admin role is verified on the profile page
- Given an organizer user authenticates, When the authentication completes, Then their organizer role is verified on the profile page

### Navigation & UI
- Given a user is not logged in, When they visit the landing page, Then the sign-in button is visible
- Given a user is logged in, When they visit the home page, Then their initials are displayed
- Given a user is on the landing page, When they click the hamburger menu, Then navigation options are displayed
- Given a user is on the landing page, When they open the navigation menu, Then "Home" and "Explorar Concursos" links are visible

### Competitions
- Given a user is logged in, When they navigate to the competitions page, Then they can view a list of competitions
- Given a user is logged in, When they navigate to the competition details page, Then they can view the competition details

# To be implemented

### Authentication & Login & Profile
- Given a user forgot their password, When they request a password reset, Then they receive a reset link via email
- Given a user is logged in, When they change their password, Then they must re-authenticate with the new password
- Given a user is logged in, When they delete their account, Then all their data is removed and they are logged out
- Given a user is logged in, When they update their profile information, Then the changes are saved and reflected in their profile
- Given a user is logged in, When they mark their account private, Then their results are shown as
"Private user" in the leaderboard


### Leagues
- Given a user, When they navigate to the leagues page, Then they can view a list of leagues
- Given a user, When they navigate to the competing leagues page, Then they can view a list of the leagues they are competing in
- Given a user, When they navigate to the league details page, Then they can view the league details

### Competitions
- Given a user is logged in, When they navigate to the competition details page, Then they can view the competition leaderboard
- Given a user is logged in, When they navigate to the competition details page, Then they can view the competition categories
- Given a user is logged in, When they navigate to the competition details page, Then they can sign up for the competition
- Given an Organizer or Judge is logged in, When they navigate to the competition details page, Then they can start the category competition
- Given an Organizer or Judge is logged in, When they navigate to the competition details page, Then they can update the competition results for a category for a party
- Given a user is logged in, When they navigate to the competition details page, Then they can view the competition results

### Translation
- Given a user is on any page, When they change the language in Drawer, Then the page is translated

### Email Notifications
- Given a user non logged in, When they sign up in the platform, Then they receive a welcome email
- Given a user is logged in, When they sign up for a competition, Then they receive a confirmation email
- Given a user is logged in, When they sign up for a competition, Then they receive a reminder email
- Given a user is logged in, When they finish a competition and results are available, Then they receive a notification email
