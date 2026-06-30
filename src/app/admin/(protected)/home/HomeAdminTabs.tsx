'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { AdminField } from '@/components/admin/AdminField';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SortableAdminList } from '@/components/admin/SortableAdminList';
import type { HomeHero, HomeSliderItem, HomeIndicator, HomeCtaCard } from '@/types/database';

type Props = {
  hero: HomeHero | null;
  slider: HomeSliderItem[];
  indicators: HomeIndicator[];
  ctaCards: HomeCtaCard[];
};

type Tab = 'hero' | 'slider' | 'indicators' | 'cta';

export function HomeAdminTabs({ hero, slider, indicators, ctaCards }: Props) {
  const [tab, setTab] = useState<Tab>('hero');
  const router = useRouter();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'hero', label: 'Hero' },
    { id: 'slider', label: `Carrossel (${slider.length})` },
    { id: 'indicators', label: `Indicadores (${indicators.length})` },
    { id: 'cta', label: `CTA (${ctaCards.length})` },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[rgb(var(--border))] pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'text-gold border-gold bg-gold/5'
                : 'text-[rgb(var(--text-muted))] border-transparent hover:text-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && <HeroTab hero={hero} onRefresh={() => router.refresh()} />}
      {tab === 'slider' && <SliderTab items={slider} onRefresh={() => router.refresh()} />}
      {tab === 'indicators' && <IndicatorsTab items={indicators} onRefresh={() => router.refresh()} />}
      {tab === 'cta' && <CtaTab items={ctaCards} onRefresh={() => router.refresh()} />}
    </div>
  );
}

// ─── Hero Tab ────────────────────────────────────────────────────────────────

function HeroTab({ hero, onRefresh }: { hero: HomeHero | null; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      id: hero?.id,
      title: fd.get('title'),
      subtitle: fd.get('subtitle') || null,
      description: fd.get('description') || null,
      video_url: fd.get('video_url') || null,
      fallback_image_url: fd.get('fallback_image_url') || null,
      primary_cta_label: fd.get('primary_cta_label') || null,
      primary_cta_url: fd.get('primary_cta_url') || null,
      secondary_cta_label: fd.get('secondary_cta_label') || null,
      secondary_cta_url: fd.get('secondary_cta_url') || null,
      active: fd.get('active') === 'on',
    };
    const res = await fetch('/api/admin/home/hero', {
      method: hero ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; message?: string };
    setMsg({ ok: data.ok, text: data.ok ? 'Salvo.' : (data.message ?? 'Erro.') });
    if (data.ok) onRefresh();
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <AdminField label="Título" name="title" required defaultValue={hero?.title} />
      <AdminField label="Subtítulo" name="subtitle" defaultValue={hero?.subtitle ?? ''} />
      <AdminField as="textarea" label="Descrição" name="description" rows={3} defaultValue={hero?.description ?? ''} />
      <AdminField label="URL do vídeo" name="video_url" defaultValue={hero?.video_url ?? ''} hint="≤8MB recomendado, 8–15s em loop. Toca no desktop e no mobile (sem autoplay se 'reduzir movimento' estiver ativo)." />
      <AdminField label="Imagem de fallback" name="fallback_image_url" defaultValue={hero?.fallback_image_url ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="CTA primário — label" name="primary_cta_label" defaultValue={hero?.primary_cta_label ?? ''} />
        <AdminField label="CTA primário — URL" name="primary_cta_url" defaultValue={hero?.primary_cta_url ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="CTA secundário — label" name="secondary_cta_label" defaultValue={hero?.secondary_cta_label ?? ''} />
        <AdminField label="CTA secundário — URL" name="secondary_cta_url" defaultValue={hero?.secondary_cta_url ?? ''} />
      </div>
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" name="active" defaultChecked={hero?.active ?? true} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
        Ativo
      </label>
      <SaveBar loading={loading} msg={msg} />
    </form>
  );
}

// ─── Slider Tab ───────────────────────────────────────────────────────────────

function SliderTab({ items, onRefresh }: { items: HomeSliderItem[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<HomeSliderItem | 'new' | null>(null);

  if (editing) {
    return (
      <SliderItemForm
        item={editing === 'new' ? null : editing}
        onSaved={() => { setEditing(null); onRefresh(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing('new')} className="admin-btn-primary">
          <Plus className="h-4 w-4" strokeWidth={2} /> Novo slide
        </button>
      </div>
      <SortableAdminList
        initial={items}
        table="home_slider_items"
        empty="Nenhum slide cadastrado."
        renderItem={(item) => (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[rgb(var(--text))]/90 truncate">{item.title}</p>
              <p className="text-[11px] text-[rgb(var(--text-muted))]/70">{item.transition_seconds}s</p>
            </div>
            <StatusBadge status={item.active} />
            <button onClick={() => setEditing(item)} className="text-xs text-gold hover:underline">Editar</button>
          </>
        )}
      />
    </div>
  );
}

function SliderItemForm({ item, onSaved, onCancel }: { item: HomeSliderItem | null; onSaved: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      id: item?.id,
      title: fd.get('title'),
      subtitle: fd.get('subtitle') || null,
      description: fd.get('description') || null,
      image_url: fd.get('image_url') || null,
      cta_label: fd.get('cta_label') || null,
      cta_url: fd.get('cta_url') || null,
      transition_seconds: Number(fd.get('transition_seconds')) || 7,
      display_order: Number(fd.get('display_order')) || 0,
      active: fd.get('active') === 'on',
    };
    const res = await fetch('/api/admin/home/slider', {
      method: item ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { onSaved(); } else { setMsg({ ok: false, text: data.message ?? 'Erro.' }); }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button type="button" onClick={onCancel} className="text-sm text-[rgb(var(--text-muted))] hover:text-white/80">← Voltar</button>
        <span className="text-sm text-[rgb(var(--text-muted))]/80">/</span>
        <span className="text-sm text-white/70">{item ? 'Editar slide' : 'Novo slide'}</span>
      </div>
      <AdminField label="Título" name="title" required defaultValue={item?.title} />
      <AdminField label="Subtítulo" name="subtitle" defaultValue={item?.subtitle ?? ''} />
      <AdminField as="textarea" label="Descrição" name="description" rows={2} defaultValue={item?.description ?? ''} />
      <AdminField label="URL da imagem" name="image_url" defaultValue={item?.image_url ?? ''} />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="CTA — label" name="cta_label" defaultValue={item?.cta_label ?? ''} />
        <AdminField label="CTA — URL" name="cta_url" defaultValue={item?.cta_url ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Duração (segundos)" name="transition_seconds" type="number" min="3" max="30" defaultValue={String(item?.transition_seconds ?? 7)} />
        <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
        Ativo
      </label>
      <SaveBar loading={loading} msg={msg} />
    </form>
  );
}

// ─── Indicators Tab ───────────────────────────────────────────────────────────

function IndicatorsTab({ items, onRefresh }: { items: HomeIndicator[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<HomeIndicator | 'new' | null>(null);

  if (editing) {
    return (
      <IndicatorForm
        item={editing === 'new' ? null : editing}
        onSaved={() => { setEditing(null); onRefresh(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing('new')} className="admin-btn-primary">
          <Plus className="h-4 w-4" strokeWidth={2} /> Novo indicador
        </button>
      </div>
      <SortableAdminList
        initial={items}
        table="home_indicators"
        empty="Nenhum indicador."
        renderItem={(item) => (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gold truncate">{item.main_text}</p>
              <p className="text-[11px] text-[rgb(var(--text-muted))]/70 truncate">{item.description}</p>
            </div>
            <StatusBadge status={item.active} />
            <button onClick={() => setEditing(item)} className="text-xs text-gold hover:underline">Editar</button>
          </>
        )}
      />
    </div>
  );
}

function IndicatorForm({ item, onSaved, onCancel }: { item: HomeIndicator | null; onSaved: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      id: item?.id,
      main_text: fd.get('main_text'),
      description: fd.get('description') || null,
      internal_note: fd.get('internal_note') || null,
      display_order: Number(fd.get('display_order')) || 0,
      active: fd.get('active') === 'on',
    };
    const res = await fetch('/api/admin/home/indicators', {
      method: item ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { onSaved(); } else { setMsg({ ok: false, text: data.message ?? 'Erro.' }); }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button type="button" onClick={onCancel} className="text-sm text-[rgb(var(--text-muted))] hover:text-white/80">← Voltar</button>
        <span className="text-sm text-[rgb(var(--text-muted))]/80">/</span>
        <span className="text-sm text-white/70">{item ? 'Editar indicador' : 'Novo indicador'}</span>
      </div>
      <AdminField label="Texto principal" name="main_text" required defaultValue={item?.main_text} hint="Ex: +20 anos de experiência (NÃO invente números fictícios)" />
      <AdminField label="Descrição" name="description" defaultValue={item?.description ?? ''} />
      <AdminField label="Nota interna" name="internal_note" defaultValue={item?.internal_note ?? ''} hint="Não exibida ao público" />
      <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
        Ativo
      </label>
      <SaveBar loading={loading} msg={msg} />
    </form>
  );
}

// ─── CTA Tab ──────────────────────────────────────────────────────────────────

function CtaTab({ items, onRefresh }: { items: HomeCtaCard[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<HomeCtaCard | 'new' | null>(null);

  if (editing) {
    return (
      <CtaForm
        item={editing === 'new' ? null : editing}
        onSaved={() => { setEditing(null); onRefresh(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing('new')} className="admin-btn-primary">
          <Plus className="h-4 w-4" strokeWidth={2} /> Novo card
        </button>
      </div>
      <SortableAdminList
        initial={items}
        table="home_cta_cards"
        empty="Nenhum card CTA."
        renderItem={(item) => (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[rgb(var(--text))]/90 truncate">{item.title}</p>
              <p className="text-[11px] text-[rgb(var(--text-muted))]/70 truncate">{item.description}</p>
            </div>
            <StatusBadge status={item.active} />
            <button onClick={() => setEditing(item)} className="text-xs text-gold hover:underline">Editar</button>
          </>
        )}
      />
    </div>
  );
}

function CtaForm({ item, onSaved, onCancel }: { item: HomeCtaCard | null; onSaved: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      id: item?.id,
      title: fd.get('title'),
      description: fd.get('description') || null,
      interest_type: fd.get('interest_type') || null,
      button_label: fd.get('button_label') || null,
      button_url: fd.get('button_url') || null,
      display_order: Number(fd.get('display_order')) || 0,
      active: fd.get('active') === 'on',
    };
    const res = await fetch('/api/admin/home/cta', {
      method: item ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { ok: boolean; message?: string };
    if (data.ok) { onSaved(); } else { setMsg({ ok: false, text: data.message ?? 'Erro.' }); }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button type="button" onClick={onCancel} className="text-sm text-[rgb(var(--text-muted))] hover:text-white/80">← Voltar</button>
        <span className="text-sm text-[rgb(var(--text-muted))]/80">/</span>
        <span className="text-sm text-white/70">{item ? 'Editar card' : 'Novo card CTA'}</span>
      </div>
      <AdminField label="Título" name="title" required defaultValue={item?.title} />
      <AdminField as="textarea" label="Descrição" name="description" rows={2} defaultValue={item?.description ?? ''} />
      <AdminField label="Tipo de interesse" name="interest_type" defaultValue={item?.interest_type ?? ''} hint="Ex: food_service, b2b, representante" />
      <div className="grid grid-cols-2 gap-4">
        <AdminField label="Botão — label" name="button_label" defaultValue={item?.button_label ?? ''} />
        <AdminField label="Botão — URL" name="button_url" defaultValue={item?.button_url ?? ''} />
      </div>
      <AdminField label="Ordem" name="display_order" type="number" defaultValue={String(item?.display_order ?? 0)} />
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="rounded border-white/20 bg-[rgb(var(--surface-elevated))] text-gold focus:ring-gold/40" />
        Ativo
      </label>
      <SaveBar loading={loading} msg={msg} />
    </form>
  );
}

// ─── Shared save bar ─────────────────────────────────────────────────────────

function SaveBar({ loading, msg }: { loading: boolean; msg: { ok: boolean; text: string } | null }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-gold/90 px-5 py-2 text-sm font-semibold text-navy hover:bg-gold transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
        Salvar
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
      )}
    </div>
  );
}
