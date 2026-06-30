import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { LGPD_PUBLIC_DEFAULT } from '@/lib/lgpd-public';

const log = createLogger('lgpd');

// Lê o texto de consentimento LGPD versionado em site_settings.
// Usado em /api/forms/submit para hash/version de auditoria (adendo v1.1 §12).

type LgpdSettingValue = {
  version: string;
  text: string;
};

export async function getLgpdConsentText(): Promise<{ version: string; text: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'lgpd_consent_text')
      .maybeSingle();
    const raw = (data?.value ?? null) as LgpdSettingValue | null;
    if (raw && typeof raw.version === 'string' && typeof raw.text === 'string') {
      return { version: raw.version, text: raw.text };
    }
  } catch (err) {
    log.warn('failed to read site_settings', undefined, err);
  }
  return { ...LGPD_PUBLIC_DEFAULT };
}
