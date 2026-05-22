/**
 * Restore for participant-driven registration tests.
 * Deletes competitions created by seed-participant.ts.
 */
import "dotenv/config";
import { restoreCompetitions, PARTICIPANT_COMPETITION_NAMES } from './seed-helpers';

restoreCompetitions(PARTICIPANT_COMPETITION_NAMES).catch(err => {
    console.error('❌ Restore failed:', err);
    process.exit(1);
});
