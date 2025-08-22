import { z } from 'zod';

export const CompetitionScalarFieldEnumSchema = z.enum(['id','name','description','location','startDate','endDate','status','createdAt','updatedAt','leagueId','creatorId','registrationOpen']);

export default CompetitionScalarFieldEnumSchema;
