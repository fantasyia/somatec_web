'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import type { Json } from '@/types/database';

type Certification = {
  label: string;
  src: string;
};

type CompanyInfo = {
  legal_name?: string | null;
  cnpj?: string | null;
  address?: string | null;
  email?: string | null;
  whatsapp?: string | null;
};

type Socials = {
  linkedin?: string | null;
  instagram?: string | null;
  youtube?: string | null;
};

type LgpdText = {
  text?: string | null;
  version?: string | null;
};

type CookieBanner = {
  body?: string | null;
  accept_label?: string | null;
  essential_only_label?: string | null;
};

type Props = {
  initial: {
    company_info: CompanyInfo | null;
    socials: Socials | null;
    lgpd_consent_text: LgpdText | null;
    cookie_banner_text: CookieBanner | null;
    certifications: Certification[] | null;
  };
};

export function ConfiguracoesForm({ initial }: Props) {
  return (
    <div className="space-y-8">
      <Section
        title="Dados da empresa"
        description="Aparece em formulários, footer e structured data (LocalBusiness/Organization)."
      >
        <CompanyForm initial={initial.company_info ?? {}} />
      </Section>

      <Section
        title="Redes sociais"
        description="URLs completas. Aparecem no footer e structured data sameAs."
      >
        <SocialsForm initial={initial.socials ?? {}} />
      </Section>

      <Section
        title="WhatsApp comercial"
        description="O botão flutuante e os CTAs comerciais usam essas configurações."
      >
        <Link
          href="/admin/whatsapp"
          className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] px-4 py-3 text-sm text-[rgb(var(--text))] hover:border-gold/60 hover:text-gold transition-colors"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
          Abrir editor do WhatsApp
        </Link>
      </Section>

      <Section
        title="Texto LGPD"
        description="Texto de consentimento enviado junto com os formulários (incluído no payload do MullerBot)."
      >
        <LgpdForm initial={initial.lgpd_consent_text ?? {}} />
      </Section>

      <Section
        title="Banner de cookies"
        description="Textos do banner LGPD exibido no primeiro acesso."
      >
        <CookieBannerForm initial={initial.cookie_banner_text ?? {}} />
      </Section>

      <Section
        title="Certificações"
        description="Selos exibidos no footer. Faça upload do logo em Mídias e cole a URL aqui (SVG/PNG monocromático funciona melhor)."
      >
        <CertificationsForm initial={initial.certifications ?? []} />
      </Section>
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/30 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h2>
        {description && <p className="text-[11px] text-[rgb(var(--text-muted))]/80 mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// ─── Helper hook genérico de save ────────────────────────────────────────────

function useSettingSaver(key: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(value: Json) {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (data.ok) {
        setMsg({ ok: true, text: 'Salvo com sucesso.' });
        router.refresh();
      } else {
        setMsg({ ok: false, text: data.message ?? 'Erro ao salvar.' });
      }
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro de rede.' });
    } finally {
      setLoading(false);
    }
  }

  return { save, loading, msg };
}

function SaveBar({ loading, msg }: { loading: boolean; msg: { ok: boolean; text: string } | null }) {
  return (
    <div className="flex items-center gap-3 pt-3">
      <button
        type="submit"
        disabled={loading}
        className="admin-btn-primary inline-flex items-center gap-2"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
        Salvar
      </button>
      {msg && (
        <p className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
      )}
    </div>
  );
}

// ─── Company form ───────────────────────────────────────────────────────────

function CompanyForm({ initial }: { initial: CompanyInfo }) {
  const { save, loading, msg } = useSettingSaver('company_info');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await save({
      legal_name: (fd.get('legal_name') as string) || null,
      cnpj: (fd.get('cnpj') as string) || null,
      address: (fd.get('address') as string) || null,
      email: (fd.get('email') as string) || null,
      whatsapp: (fd.get('whatsapp') as string) || null,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminField label="Razão social" name="legal_name" defaultValue={initial.legal_name ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="CNPJ" name="cnpj" defaultValue={initial.cnpj ?? ''} hint="Ex: 12.345.678/0001-90" />
        <AdminField label="WhatsApp comercial" name="whatsapp" defaultValue={initial.whatsapp ?? ''} hint="Formato internacional, ex: +5511999999999" />
      </div>
      <AdminField label="E-mail comercial" name="email" type="email" defaultValue={initial.email ?? ''} />
      <AdminField as="textarea" label="Endereço" name="address" rows={2} defaultValue={initial.address ?? ''} />
      <SaveBar loading={loading} msg={msg} />
    </form>
  );
}

// ─── Socials form ───────────────────────────────────────────────────────────

function SocialsForm({ initial }: { initial: Socials }) {
  const { save, loading, msg } = useSettingSaver('socials');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await save({
      linkedin: (fd.get('linkedin') as string) || null,
      instagram: (fd.get('instagram') as string) || null,
      youtube: (fd.get('youtube') as string) || null,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminField label="LinkedIn (URL)" name="linkedin" defaultValue={initial.linkedin ?? ''} hint="https://linkedin.com/company/..." />
      <AdminField label="Instagram (URL)" name="instagram" defaultValue={initial.instagram ?? ''} hint="https://instagram.com/..." />
      <AdminField label="YouTube (URL)" name="youtube" defaultValue={initial.youtube ?? ''} hint="https://youtube.com/@..." />
      <SaveBar loading={loading} msg={msg} />
    </form>
  );
}

// ─── LGPD form ──────────────────────────────────────────────────────────────

function LgpdForm({ initial }: { initial: LgpdText }) {
  const { save, loading, msg } = useSettingSaver('lgpd_consent_text');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await save({
      text: (fd.get('text') as string) || null,
      version: (fd.get('version') as string) || null,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminField as="textarea" label="Texto de consentimento" name="text" rows={5} defaultValue={initial.text ?? ''} hint="Aparece junto ao checkbox LGPD em todos os formulários." />
      <AdminField label="Versão" name="version" defaultValue={initial.version ?? 'v1.0'} hint='Ex: "v1.0" — incrementar quando o texto mudar (gera novo hash no payload).' />
      <SaveBar loading={loading} msg={msg} />
    </form>
  );
}

// ─── Cookie banner form ────────────────────────────────────────────────────

function CookieBannerForm({ initial }: { initial: CookieBanner }) {
  const { save, loading, msg } = useSettingSaver('cookie_banner_text');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await save({
      body: (fd.get('body') as string) || null,
      accept_label: (fd.get('accept_label') as string) || null,
      essential_only_label: (fd.get('essential_only_label') as string) || null,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminField as="textarea" label="Corpo do banner" name="body" rows={3} defaultValue={initial.body ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label='Botão "Aceitar"' name="accept_label" defaultValue={initial.accept_label ?? 'Aceitar cookies'} />
        <AdminField label='Botão "Apenas essenciais"' name="essential_only_label" defaultValue={initial.essential_only_label ?? 'Apenas essenciais'} />
      </div>
      <SaveBar loading={loading} msg={msg} />
    </form>
  );
}

// ─── Certifications form ────────────────────────────────────────────────────

function CertificationsForm({ initial }: { initial: Certification[] }) {
  const { save, loading, msg } = useSettingSaver('certifications');
  const [items, setItems] = useState<Certification[]>(initial);

  function update(index: number, patch: Partial<Certification>) {
    setItems((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }
  function add() {
    setItems((prev) => [...prev, { label: '', src: '' }]);
  }
  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Filtra linhas incompletas antes de salvar.
    const clean = items.filter((c) => c.label.trim() && c.src.trim());
    await save(clean as unknown as Json);
    setItems(clean);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-[rgb(var(--text-muted))]/70 py-2">
          Nenhuma certificação. Adicione abaixo (ou deixe vazio para usar os selos padrão).
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((cert, i) => (
            <div key={i} className="flex items-end gap-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))]/40 p-3">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-[10px] uppercase tracking-widest text-[rgb(var(--text-muted))]/80 mb-1">Nome</span>
                  <input
                    type="text"
                    value={cert.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                    placeholder="Ex: ABNT NBR 5410"
                    className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2.5 py-1.5 text-sm text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:outline-none focus:border-gold/60"
                  />
                </label>
                <label className="block">
                  <span className="block text-[10px] uppercase tracking-widest text-[rgb(var(--text-muted))]/80 mb-1">URL do logo</span>
                  <input
                    type="text"
                    value={cert.src}
                    onChange={(e) => update(i, { src: e.target.value })}
                    placeholder="/certifications/norma.svg"
                    className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2.5 py-1.5 text-sm text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))]/50 focus:outline-none focus:border-gold/60"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remover ${cert.label || 'certificação'}`}
                className="mb-1.5 rounded-md p-1.5 text-[rgb(var(--text-muted))]/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Adicionar certificação
      </button>

      <SaveBar loading={loading} msg={msg} />
    </form>
  );
}
