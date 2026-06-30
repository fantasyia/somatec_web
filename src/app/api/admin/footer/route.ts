import { makeCrudHandlers } from '@/lib/admin/crud';
export const { POST, PUT, DELETE } = makeCrudHandlers({ table: 'footer_columns' });
