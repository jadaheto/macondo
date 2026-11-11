import { CatalogQuerySchema, ResourceStatusSchema, TvSlideInputSchema } from '@macondo/shared';
import { z } from 'zod';

/** ResourcePatchSchema vive en el contrato compartido (objeto base en parcial); se reexporta por compatibilidad. */
export { ResourcePatchSchema, type ResourcePatch } from '@macondo/shared';

export const StatusChangeSchema = z.object({ status: ResourceStatusSchema });

export const AdminResourceQuerySchema = CatalogQuerySchema.extend({ status: ResourceStatusSchema.optional() });
export type AdminResourceQuery = z.infer<typeof AdminResourceQuerySchema>;

export const TvSlidePatchSchema = TvSlideInputSchema.partial();

export const AuditQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(500).default(100) });
