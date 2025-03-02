// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User, Profile, Participant, Session } from '@prisma/client';

// You can now use these types in your application
// For example:
type UserWithProfile = User & {
  profile: Profile;
};

declare global {
	namespace App {
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			user: User & {
				profile: Profile;
			};
		}
	}
}

export {};

export {};
