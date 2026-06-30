import { makeCrudHandlers } from '@/lib/admin/crud';
export const { POST, PUT, DELETE } = makeCrudHandlers({ table: 'navigation_items', labelField: 'label' });
