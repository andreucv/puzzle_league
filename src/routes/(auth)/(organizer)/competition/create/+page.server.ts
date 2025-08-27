import { fail } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { createCompetition } from '$lib/database';
import { type Competition, type Category, type Prisma, CategoryType } from '@prisma/client';
import { auth } from '$lib/auth';
import { message } from 'sveltekit-superforms';

import { CompetitionCreateInputSchema } from '../../../../../../prisma/generated/zod';

import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async (event) => {
    try {
        // Get the current session
        const session = await auth.api.getSession(event.request);
        if (!session?.user) {
            throw new Error('User not authenticated');
        }

        const categoryTypes = Object.values(CategoryType);

        const form = await superValidate(zod4(CompetitionCreateInputSchema));
        return {
            form,
            props: {
                categoryTypes
            }
        };

    } catch (error) {
        console.error('Error loading competition for edit:', error);
        return fail(404, { error_message: error instanceof Error ? error.message : "Competition not found" });
    }
}

const create_competition: Action = async ({ request }) => {
    let user = null;
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });
        user = session?.user;
    } catch (error) {
        console.error('Error getting user session:', error);
        return fail(401, { error_message: "User not authenticated" });
    }

    // TODO:  check that user has rights to create competition

    const form = await superValidate(request, zod4(CompetitionCreateInputSchema));
    console.log('competition/edit/+page.server.ts: after validate form', form);

    if (!form.valid) {
        return { form };
    }

    const result = await createCompetition(form.data);
    console.log('competition/edit/+page.server.ts: on createCompetition result', result);

    form.data.categories = { createMany : { data: form.data.categories } };

    console.log('competition/edit/+page.server.ts: after createCompetition form', form);
    return message(form, {message: 'Competition created successfully', id: result.data?.id});
}

export const actions: Actions = { create_competition }
