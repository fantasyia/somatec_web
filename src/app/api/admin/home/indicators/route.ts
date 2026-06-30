import { makeCrudHandlers } from '@/lib/admin/crud';
export const { POST, PUT, DELETE } = makeCrudHandlers({ table: 'home_indicators', labelField: 'main_text' });
