import { animationSchema } from '../schema';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const animationJsonSchema = zodToJsonSchema(animationSchema);
