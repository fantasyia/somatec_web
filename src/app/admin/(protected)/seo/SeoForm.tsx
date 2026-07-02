'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import type { Json } from '@/types/database';

type SeoSettings = {
  seo_global_title?: string | null;
  seo_global_title_template?: string | null;
  seo_global_description?: string | null;
  seo_og_default_title?: string | null;
  seo_og_default_description?: string | null;
  seo_og_default_image?: string | null;
  seo_twitter_handle?: string | null;
  seo_google_analytics_id?: string | null;
  seo_robots_index?: boolean | null;
  seo_robots_follow?: boolean | null;
};

type Props = {
  initial: SeoSettings;
};

export function SeoForm({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const fd = new FormData(e.currentTarget);

    // Cada key vai num PUT separado pra `site_settings`. Roda em paralelo,
    // qualquer erro aborta a UX (parcialmente salvo). Trade-off aceitável pra
    // simplicidade — alternativa seria batch endpoint.
    const updates: Array<{ key: string; value: Json }> = [
      { key: 'seo_global_title', value: (fd.get('seo_global_title') as string) || null },
      { key: 'seo_global_title_template', value: (fd.get('seo_global_title_template') as string) || null },
      { key: 'seo_global_description', value: (fd.get('seo_global_description') as string) || null },
      { key: 'seo_og_default_title', value: (fd.get('seo_og_default_title') as string) || null },
      { key: 'seo_og_default_description', value: (fd.get('seo_og_default_description') as string) || null },
      { key: 'seo_og_default_image', value: (fd.get('seo_og_default_image') as string) || null },
      { key: 'seo_twitter_handle', value: (fd.get('seo_twitter_handle') as string) || null },
      { key: 'seo_google_analytics_id', value: (fd.get('seo_google_analytics_id') as string) || null },
      {
        key: 'seo_robots_index',
        value: fd.get('seo_robots_index') === 'on',
      },
      {
        key: 'seo_robots_follow',
        value: fd.get('seo_robots_follow') === 'on',
      },
    ];

    try {
      const results = await Promise.all(
        updates.map((u) =>
          fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(u),
          }).then((res) => res.json() as Promise<{ ok: boolean; message?: string }>),
        ),
      );
      const failed = results.find((r) => !r.ok);
      if (failed) {
        setMsg({ ok: false, text: failed.message ?? 'Algumas configurações falharam ao salvar.' });
      } else {
        setMsg({ ok: true, text: 'SEO global salvo com sucesso.' });
        router.refresh();
      }
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro de rede.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Identidade global" description="Aparece em <title>, descrição padrão e header das páginas que não declararam metadata próprio.">
        <AdminField
          label="Título padrão do site"
          name="seo_global_title"
          defaultValue={initial.seo_global_title ?? ''}
          hint='Ex: "Somatec Blocking — Proteção contra surtos e qualidade de energia"'
        />
        <AdminField
          label="Template do título"
          name="seo_global_title_template"
          defaultValue={initial.seo_global_title_template ?? '%s · Somatec Blocking'}
          hint='Use %s onde entrará o título da página. Ex: "%s · Somatec Blocking"'
        />
        <AdminField
          as="textarea"
          label="Description padrão"
          name="seo_global_description"
          rows={2}
          defaultValue={initial.seo_global_description ?? ''}
          hint="140-160 caracteres. Aparece nos resultados de busca quando a página não declarou description própria."
        />
      </Section>

      <Section title="Open Graph (cards de compartilhamento)" description="Fallback usado quando uma página não define seu próprio OG.">
        <AdminField
          label="OG title padrão"
          name="seo_og_default_title"
          defaultValue={initial.seo_og_default_title ?? ''}
        />
        <AdminField
          as="textarea"
          label="OG description padrão"
          name="seo_og_default_description"
          rows={2}
          defaultValue={initial.seo_og_default_description ?? ''}
        />
        <AdminField
          label="OG image padrão (URL)"
          name="seo_og_default_image"
          defaultValue={initial.seo_og_default_image ?? '/og-default.jpg'}
          hint="Padrão é /og-default.jpg (gerado por scripts/generate-og-default.mjs)."
        />
      </Section>

      <Section title="Twitter / Analytics">
        <div className="grid grid-cols-2 gap-4">
          <AdminField
            label="Twitter / X handle"
            name="seo_twitter_handle"
            defaultValue={initial.seo_twitter_handle ?? ''}
            hint='Ex: "@msmalimentos" (com o @)'
          />
          <AdminField
            label="Google Analytics ID"
            name="seo_google_analytics_id"
            defaultValue={initial.seo_google_analytics_id ?? ''}
            hint='Ex: "G-XXXXXXXXXX"'
          />
        </div>
      </Section>

      <Section title="Robots padrão" description="Pode ser sobrescrito por rota (Páginas / Produtos / etc).">
        <div className="flex items-center gap-6">
          <Toggle name="seo_robots_index" label="Index (indexável)" defaultChecked={initial.seo_robots_index ?? true} />
          <Toggle name="seo_robots_follow" label="Follow (seguir links)" defaultChecked={initial.seo_robots_follow ?? true} />
        </div>
      </Section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="admin-btn-primary inline-flex items-center gap-2"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
          Salvar SEO global
        </button>
        {msg && (
          <p className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h2>
        {description && <p className="text-[11px] text-[rgb(var(--text-muted))]/80 mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))] cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="rounded border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40"
      />
      {label}
    </label>
  );
}
