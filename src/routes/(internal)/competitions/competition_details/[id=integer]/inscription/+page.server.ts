import type { PageServerLoad, Actions } from "./$types";
import { getCompetitionWithCategories, getCompetitionCategories } from "$lib/database/db_competition";
import { getCategoryEntriesFromCompetition, signUpUsersToCompetition, removeRecordById, getInscribedUserIdsByCategory } from "$lib/database/db_inscription_utils";
import { redirect } from "@sveltejs/kit";
import { createNotificationForUsers } from "$lib/notifications/notifications";
import { NotificationType, InscriptionStatus } from "$lib/.prisma/generated/prisma/enums";

export const load: PageServerLoad = async (event) => {
    const user = event.locals.user;

    if (!user) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
    }

    const competitionId = parseInt(event.params.id);
    const competition = await getCompetitionWithCategories(competitionId);

    if (!competition) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const [existingRecords, inscribedUserIds, categoriesWithCounts] = await Promise.all([
        getCategoryEntriesFromCompetition(competitionId, user.id),
        getInscribedUserIdsByCategory(competitionId),
        getCompetitionCategories(competitionId)
    ]);

    return {
        competition,
        existingRecords: existingRecords || [],
        inscribedUserIds,
        categoriesWithCounts,
    };
};

export const actions: Actions = {
    signup: async ({ request, locals }) => {
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

            const result = await signUpUsersToCompetition(signups, user.id);

            if (result.success) {
                // Notify users on waitlisted inscriptions
                if (result.data) {
                    for (const record of result.data) {
                        if (record.status === InscriptionStatus.WAITLISTED) {
                            const userIds = record.users.map((u: { id: string }) => u.id);
                            await createNotificationForUsers(
                                userIds,
                                NotificationType.INSCRIPTION_WAITLISTED,
                                'notifications.titles.inscription_waitlisted',
                                'notifications.messages.inscription_waitlisted',
                                `/competitions/competition_details/${record.category.competition.id}`,
                                { categoryName: record.category.description ?? record.category.type },
                            );
                        }
                    }
                }
                return { success: true, message: result.message };
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
        const recordId = data.get('record_id')?.toString();

        if (!recordId) {
            return { success: false, message: 'Missing record ID' };
        }

        try {
            const result = await removeRecordById(recordId, user.id);
            if (result) {
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
