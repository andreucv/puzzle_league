import type { PageServerLoad, Actions } from "./$types";
import { getCompetitionWithCategories, getCompetitionCategories, getDuringCompetitionAccess } from "$lib/database/db_competition";
import { getCategoryEntriesFromCompetition, getRegisteredUserIdsByCategory } from "$lib/database/db_entry";
import { signUpUsersToCompetition, removeEntryById } from "$lib/database/db_registration";
import { notifyWaitlistPromotion } from "$lib/notifications/registration_notifications";
import { redirect } from "@sveltejs/kit";
import { createNotificationForUsers } from "$lib/notifications/notifications";
import { NotificationType, RegistrationStatus } from "$lib/.prisma/generated/prisma/enums";

export const load: PageServerLoad = async (event) => {
    const user = event.locals.user;

    if (!user) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
    }

    // Custom dependency for targeted invalidation (avoids re-running root layout)
    event.depends('data:registration');

    const competitionId = parseInt(event.params.id);
    const competition = await getCompetitionWithCategories(competitionId);

    if (!competition) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const [existingEntries, registeredUserIds, categoriesWithCounts, competitionAccess] = await Promise.all([
        getCategoryEntriesFromCompetition(competitionId, user.id),
        getRegisteredUserIdsByCategory(competitionId),
        getCompetitionCategories(competitionId),
        getDuringCompetitionAccess(competitionId, user.id)
    ]);

    return {
        competition,
        existingEntries: existingEntries || [],
        registeredUserIds,
        categoriesWithCounts,
        isOrganizer: competitionAccess.isOrganizer,
    };
};

export const actions: Actions = {
    signup: async ({ request, locals, params }) => {
        const user = locals.user;

        if (!user) {
            return { success: false, message: 'You must be logged in to sign up' };
        }

        const data = await request.formData();
        const signupsJson = data.get('signups')?.toString();

        if (!signupsJson) {
            return { success: false, message: 'No signup data provided' };
        }

        try {
            const signups = JSON.parse(signupsJson);

            if (!Array.isArray(signups) || signups.length === 0) {
                return { success: false, message: 'No categories selected for signup' };
            }

            // Verify organizer status server-side (never trust the client)
            const competitionId = parseInt(params.id);
            const { isOrganizer } = await getDuringCompetitionAccess(competitionId, user.id);

            const result = await signUpUsersToCompetition(signups, user.id, { isOrganizer });

            if (result.success) {
                // Notify users on waitlisted registrations
                if (result.data) {
                    for (const entry of result.data) {
                        if (entry.status === RegistrationStatus.WAITLISTED) {
                            const userIds = entry.users.map((u: { id: string }) => u.id);
                            await createNotificationForUsers(
                                userIds,
                                NotificationType.REGISTRATION_WAITLISTED,
                                'notifications.titles.registration_waitlisted',
                                'notifications.messages.registration_waitlisted',
                                `/competitions/competition_details/${entry.category.competition.id}`,
                                { categoryName: entry.category.description ?? entry.category.type },
                            );
                        }
                    }
                }
                return { success: true, summary: result.summary };
            } else {
                return { success: false, message: result.error };
            }
        } catch (error) {
            console.error('Error in signup action:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    },

    unregister: async ({ request, locals }) => {
        const user = locals.user;

        if (!user) {
            return { success: false, message: 'You must be logged in' };
        }

        const data = await request.formData();
        const entryId = data.get('entry_id')?.toString();

        if (!entryId) {
            return { success: false, message: 'Missing entry ID' };
        }

        try {
            const result = await removeEntryById(entryId, user.id);
            if (result) {
                // If a waitlisted entry was promoted, notify its participants
                if (result.promotedEntry) {
                    await notifyWaitlistPromotion(result.promotedEntry);
                }
                return { success: true, message: 'Successfully unregistered' };
            }
            return { success: false, message: 'Failed to unregister' };
        } catch (error) {
            console.error('Error in unregister action:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            };
        }
    }
};
