import { makeCrudHandlers } from '@/lib/admin/crud';
export const { POST, PUT, DELETE } = makeCrudHandlers({ table: 'product_applications', labelField: 'name' });
