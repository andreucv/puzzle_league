/**
 * Restore for organizer-driven registration tests.
 * Deletes competitions created by seed-organizer.ts.
 */
import "dotenv/config";
import { restoreCompetitions, ORGANIZER_COMPETITION_NAMES } from './seed-helpers';

restoreCompetitions(ORGANIZER_COMPETITION_NAMES).catch(err => {
    console.error('❌ Restore failed:', err);
    process.exit(1);
});
