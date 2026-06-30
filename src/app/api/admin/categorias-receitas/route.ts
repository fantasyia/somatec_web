import { makeCrudHandlers } from '@/lib/admin/crud';
export const { POST, PUT, DELETE } = makeCrudHandlers({ table: 'recipe_categories', labelField: 'name' });
