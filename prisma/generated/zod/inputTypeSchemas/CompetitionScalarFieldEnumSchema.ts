import { z } from 'zod';

export const CompetitionScalarFieldEnumSchema = z.enum(['id','name','description','location','image_cld_id','startDate','endDate','status','createdAt','updatedAt','leagueId','creatorId','registrationOpen']);

export default CompetitionScalarFieldEnumSchema;
