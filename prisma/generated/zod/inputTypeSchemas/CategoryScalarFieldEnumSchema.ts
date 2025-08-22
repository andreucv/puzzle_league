import { z } from 'zod';

export const CategoryScalarFieldEnumSchema = z.enum(['id','name','type','maxPartySize','startTime','endTime','realStartTime','realEndTime','status','maxParties','competitionId']);

export default CategoryScalarFieldEnumSchema;
