'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  Menu,
  X,
  Zap,
  Gauge,
  BatteryCharging,
  Wrench,
  Building2,
  Factory,
  ShieldCheck,
  Cpu,
  Calculator,
  Network,
  BarChart3,
  Newspaper,
  HelpCircle,
  Mail,
  Home,
  Store,
  Handshake,
  PackageSearch,
  type LucideIcon,
} from 'lucide-react';
import { HEADER_NAV, HEADER_CTAS } from '@/lib/constants/navigation';
import { ehRotaNi, semIndustriaisSeNi, DESTINOS_INDUSTRIAIS } from '@/lib/constants/rotas-ni';
import { cn } from '@/lib/utils';

// Ícone por destino (mapeado por href — mantém navigation.ts como dados puros).
// Cobre TODOS os itens do nav: todo menu abre o mesmo painel, então todo filho
// precisa de ícone. Href repetido em menus diferentes reaproveita o ícone.
const NAV_ICON: Record<string, LucideIcon> = {
  // A Somatec
  '/a-somatec/quem-somos': Building2,
  '/a-somatec/tecnologia-e-fabricacao': Factory,
  '/a-somatec/comprovacao-e-normas': ShieldCheck,
  // Tecnologia
  '/produtos': Cpu,
  '/orcamento-industrial': Network,
  // Resultados
  '/resultados': BarChart3,
  '/blog': Newspaper,
  '/faq': HelpCircle,
  // Diagnóstico
  '/ferramentas/custo-de-parada': Calculator,
  // Contato
  '/contato': Mail,
  '/protecao-residencial': Home,
  '/protecao-comercial': Store,
  '/representantes': Handshake,
};

export function Header({ slugsNi = [] }: { slugsNi?: string[] } = {}) {
  const pathname = usePathname();

  // 🔒 Nas rotas NI o menu esconde as ferramentas industriais (decisão do Léo,
  // 21/08). O item "Diagnóstico" inteiro some — os dois filhos dele (custo de
  // parada e projeto da planta) só fazem sentido pra quem tem linha de
  // produção. Some do MENU, não do site: o comprador industrial continua
  // achando tudo pelo caminho dele.
  const navVisivel = ehRotaNi(pathname, slugsNi)
    ? HEADER_NAV.filter((i) => !DESTINOS_INDUSTRIAIS.includes(i.href)).map((i) => ({
        ...i,
        children: i.children ? semIndustriaisSeNi(i.children, pathname, slugsNi) : undefined,
      }))
    : HEADER_NAV;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const gatilhosRef = useRef<Record<string, HTMLAnchorElement | null>>({});
  /** Marcado pelo ArrowDown: o painel ainda vai renderizar quando a tecla
   *  acontece, então o foco no primeiro card espera o efeito abaixo. */
  const focarPainelRef = useRef(false);
  /** Devolver o foco ao gatilho depois do Esc REABRIA o painel, porque focar o
   *  gatilho é justamente o gesto que abre. Medido no navegador: Esc fechava e
   *  o menu voltava no mesmo quadro. Esta trava vale por um evento só. */
  const ignorarFocoRef = useRef(false);

  /** Foca sem que o `onFocus` do gatilho reabra o menu. */
  const focarSemAbrir = (el: HTMLElement | null | undefined) => {
    if (!el) return;
    ignorarFocoRef.current = true;
    el.focus();
    // O evento de foco sai SÍNCRONO no `.focus()` acima; o microtask roda
    // depois dele, então a trava nunca sobra pro próximo foco de verdade.
    queueMicrotask(() => {
      ignorarFocoRef.current = false;
    });
  };
  const botaoMobileRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // HOVER-INTENT.
  //
  // Abrir NA HORA era o problema: atravessando o nav pra chegar em "Contato",
  // o cursor passa por cima de 4 itens e os 4 painéis piscavam um atrás do
  // outro. Agora o painel só abre se o cursor PARAR em cima do item.
  //
  // Dois atrasos diferentes, de propósito:
  //  · nada aberto  → 160ms. É o filtro do "só passando por aqui".
  //  · já tem painel aberto → 70ms. Quem já está navegando o menu quer
  //    resposta rápida; esperar 160ms de novo pareceria travado.
  //
  // O atraso pra FECHAR (140ms) é outra coisa e continua: o mega-menu é
  // `fixed`, fica fora da caixa do <nav>, e sem ele o painel sumia antes de o
  // mouse conseguir atravessar o vão até ele.
  const openMenu = (href: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (hoveredMenu === href) return;
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      setHoveredMenu(href);
      openTimer.current = null;
    }, hoveredMenu ? 70 : 160);
  };

  // TECLADO NÃO É MOUSE: o hover-intent acima existe pra filtrar cursor de
  // passagem, e não tem equivalente no Tab — quem chega por teclado já
  // escolheu. Abrir com os mesmos 160ms criava uma corrida: dois Tab rápidos
  // e o painel abria DEPOIS de o foco já ter passado adiante.
  const abrirAgora = (href: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    setHoveredMenu(href);
  };

  const cancelarFechamento = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  /** Item cujo painel está aberto agora (null = fechado). */
  const itemAberto = navVisivel.find((i) => i.href === hoveredMenu && i.children?.length) ?? null;
  /** O painel é ÚNICO e fica sempre montado, pra ter animação de saída também.
   *  Enquanto ele some, precisa continuar mostrando o último conteúdo — senão
   *  o texto sumia antes do painel e dava um flash branco. */
  const [ultimoAberto, setUltimoAberto] = useState<(typeof navVisivel)[number] | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- guarda o último conteúdo pra sobreviver ao fade de saída
    if (itemAberto) setUltimoAberto(itemAberto);
  }, [itemAberto]);
  const conteudo = itemAberto ?? ultimoAberto;

  // ArrowDown no gatilho leva o foco pro primeiro card do painel — só depois
  // que ele existe no DOM (o `setHoveredMenu` da tecla ainda não renderizou).
  useEffect(() => {
    if (!itemAberto || !focarPainelRef.current) return;
    focarPainelRef.current = false;
    painelRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus();
  }, [itemAberto]);

  /** Cancela uma abertura que ainda não aconteceu (cursor só passou reto). */
  const cancelOpen = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const scheduleCloseMenu = () => {
    cancelOpen();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setHoveredMenu(null);
      closeTimer.current = null;
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (openTimer.current) clearTimeout(openTimer.current);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Fecha os menus (mobile + mega-menu) ao navegar entre páginas
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setHoveredMenu(null);
  }, [pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // DRAWER MOBILE COMO DIÁLOGO (B12 da auditoria 13/09).
  //
  // A gaveta cobria a página inteira mas não era um diálogo pra ninguém: o
  // Tab continuava correndo pelos links ATRÁS dela (invisíveis, sob o
  // overlay), Esc não fechava, e ao fechar o foco voltava pro começo do
  // documento em vez do botão que abriu. Quem navega por teclado ficava
  // clicando no escuro.
  useEffect(() => {
    if (!mobileOpen) return;
    const abriuCom = document.activeElement as HTMLElement | null;
    // Cópia local: na limpeza o `.current` já pode ter mudado (o próprio React
    // avisa). O botão do header é o mesmo nó durante toda a vida da gaveta.
    const gatilho = botaoMobileRef.current;

    const focaveis = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    focaveis()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const itens = focaveis();
      if (itens.length === 0) return;
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      const atual = document.activeElement;
      // Ciclo fechado: do último volta pro primeiro e vice-versa. Sem isto o
      // Tab escapa pro conteúdo debaixo do overlay.
      if (!e.shiftKey && (atual === ultimo || !drawerRef.current?.contains(atual))) {
        e.preventDefault();
        primeiro.focus();
      } else if (e.shiftKey && (atual === primeiro || !drawerRef.current?.contains(atual))) {
        e.preventDefault();
        ultimo.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Devolve o foco pro gatilho. `abriuCom` cobre o caso de a gaveta ter
      // sido aberta de outro lugar que não o botão do header.
      (gatilho ?? abriuCom)?.focus();
    };
  }, [mobileOpen]);

  const onHome = pathname === '/';
  // Despacho #7: na home o cabeçalho é TRANSPARENTE sobreposto ao carrossel
  // full-bleed (é o que faz ele "ocupar tudo") e vira sólido ao rolar. Menus
  // abertos forçam o sólido pra não flutuar painel sobre foto.
  const isTransparent = onHome && !scrolled && !mobileOpen && hoveredMenu === null;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-200 ease-premium',
        isTransparent
          ? 'bg-transparent border-b border-transparent'
          : scrolled || !onHome
            ? 'backdrop-blur-md bg-[rgb(var(--bg))]/85 border-b border-[rgb(var(--border))]/60'
            : 'bg-[rgb(var(--bg))] border-b border-[rgb(var(--border))]/60',
      )}
    >
      <div className="container-msm flex h-20 items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Somatec Blocking — Página inicial"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Image
            src="/logo-somatec.png"
            alt="Somatec Blocking"
            width={1576}
            height={494}
            // `priority` só no que está VISÍVEL agora: os dois logos levavam
            // priority e o Next pré-carregava ambos (o escuro sai com srcset
            // até w=3840), sendo que um está sempre `hidden`. Preload no
            // caminho crítico pra imagem que não aparece.
            priority={!isTransparent}
            className={cn('h-9 w-auto', isTransparent && 'hidden')}
          />
          <Image
            src="/logo-somatec-white.png"
            alt="Somatec Blocking"
            width={792}
            height={248}
            priority={isTransparent}
            className={cn('h-9 w-auto', !isTransparent && 'hidden')}
          />
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Navegação principal"
          className="hidden lg:flex items-center gap-8"
          onMouseLeave={scheduleCloseMenu}
          // O painel é IRMÃO do item que o abre (é `fixed`, largura inteira),
          // então tabular do gatilho pro primeiro card SAI da caixa do item.
          // Com o fechamento pendurado no blur do item, o painel fechava
          // justamente no Tab que levava o foco pra dentro dele. Quem manda é
          // o <nav>: só fecha quando o foco sai do conjunto todo.
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              cancelOpen();
              setHoveredMenu(null);
            }
          }}
        >
          {navVisivel.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => (hasChildren ? openMenu(item.href) : scheduleCloseMenu())}
                onMouseLeave={cancelOpen}
                onFocus={
                  hasChildren
                    ? () => {
                        if (ignorarFocoRef.current) return;
                        abrirAgora(item.href);
                      }
                    : undefined
                }
                onKeyDown={
                  hasChildren
                    ? (e) => {
                        if (e.key === 'Escape') {
                          cancelOpen();
                          setHoveredMenu(null);
                          // Esc sem devolver o foco deixa o teclado na estaca
                          // zero: o próximo Tab recomeçaria do topo do
                          // documento em vez de seguir o nav.
                          focarSemAbrir(gatilhosRef.current[item.href]);
                          return;
                        }
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          // Painel JÁ aberto (o foco no gatilho abriu) é o caso
                          // normal, e nele `setHoveredMenu` com o mesmo valor
                          // não re-renderiza — então o efeito que move o foco
                          // nunca rodava e o ArrowDown não fazia nada. Com o
                          // painel na tela, move na hora; só quando ele ainda
                          // não existe é que vale esperar o efeito.
                          if (hoveredMenu === item.href) {
                            painelRef.current
                              ?.querySelector<HTMLAnchorElement>('a[href]')
                              ?.focus();
                            return;
                          }
                          focarPainelRef.current = true;
                          abrirAgora(item.href);
                        }
                      }
                    : undefined
                }
              >
                <Link
                  href={item.href}
                  ref={
                    hasChildren
                      ? (el) => {
                          gatilhosRef.current[item.href] = el;
                        }
                      : undefined
                  }
                  data-active={isActive}
                  aria-haspopup={hasChildren ? true : undefined}
                  aria-expanded={hasChildren ? hoveredMenu === item.href : undefined}
                  className={cn(
                    'link-underline text-sm font-sans font-medium hover:text-gold transition-colors py-2',
                    isTransparent ? 'text-white/90' : 'text-[rgb(var(--text))]/90',
                  )}
                >
                  {item.label}
                </Link>

              </div>
            );
          })}

          {/* PAINEL ÚNICO, sempre montado.
              Antes cada item montava e desmontava o SEU painel, e cada troca
              replayava o fade-up de 600ms (com deslocamento) — parecia que o
              menu reabria do zero a cada item, e ao fechar ele simplesmente
              sumia, sem saída. Agora a casca faz opacidade+deslocamento na
              abertura e no fechamento, e só o MIOLO troca, com um fade curto
              de opacidade pura. */}
          <div
            ref={painelRef}
            aria-hidden={!itemAberto}
            // Foco entrando no painel cancela um fechamento já agendado (o
            // mouse pode ter saído do nav enquanto o Tab entrava aqui).
            onFocus={cancelarFechamento}
            onKeyDown={(e) => {
              if (e.key !== 'Escape' || !itemAberto) return;
              cancelOpen();
              setHoveredMenu(null);
              focarSemAbrir(gatilhosRef.current[itemAberto.href]);
            }}
            className={cn(
              'fixed left-0 right-0 top-20 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg))]/95 backdrop-blur-md shadow-premium-light dark:shadow-premium-dark',
              'transition-[opacity,transform] duration-300 ease-premium motion-reduce:transition-none',
              itemAberto
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-2 opacity-0',
            )}
          >
            {/* Handlers no container (não no painel full-width): só a área dos
                cards mantém o menu aberto — a lateral vazia fecha. */}
            <div
              className="container-msm py-10"
              onMouseEnter={() => itemAberto && openMenu(itemAberto.href)}
              onMouseLeave={scheduleCloseMenu}
            >
              {conteudo && (
                <div
                  key={conteudo.href}
                  className={cn(
                    'grid gap-4 animate-fade-suave',
                    conteudo.children!.length <= 2
                      ? 'grid-cols-2'
                      : conteudo.children!.length === 4
                        ? 'grid-cols-2 xl:grid-cols-4'
                        : 'grid-cols-3',
                  )}
                >
                  {conteudo.children!.map((child) => {
                    const Icon = NAV_ICON[child.href];
                    return (
                      <Link
                        key={`${conteudo.href}${child.href}`}
                        href={child.href}
                        tabIndex={itemAberto ? undefined : -1}
                        className="group flex items-start gap-4 p-5 rounded-card border border-transparent hover:border-gold hover:bg-gold/5 transition-all duration-200 ease-premium"
                      >
                        {Icon && (
                          <Icon
                            className="h-8 w-8 flex-shrink-0 text-gold"
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-sans font-semibold text-[17px] leading-snug group-hover:text-gold transition-colors">
                            {child.label}
                          </h3>
                          {child.description && (
                            <p className="mt-1 text-sm text-[rgb(var(--text-muted))] leading-relaxed">
                              {child.description}
                            </p>
                          )}
                          <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                            Saiba mais
                            <ChevronRight className="h-3 w-3" strokeWidth={2} />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* CTAs + Theme toggle */}
        <div className="flex items-center gap-3">
          {/* Link de texto, não botão: quem já comprou acha, e quem ainda não
              comprou não é puxado pra longe do CTA de venda. */}
          <Link
            href={HEADER_CTAS.pedido.href}
            className={cn(
              'hidden lg:inline-flex items-center gap-1.5 font-sans text-sm transition-colors',
              isTransparent
                // Sobre o hero o link fica em cima de FOTO, e a foto tem parte
                // clara: texto branco solto some ali. Os dois botões ao lado
                // sobrevivem porque têm borda e preenchimento — este precisa
                // de um fundo próprio, senão é discreto até desaparecer.
                ? 'rounded-btn bg-black/25 px-2.5 py-1.5 text-white/90 backdrop-blur-sm hover:bg-black/35 hover:text-white'
                : 'text-[rgb(var(--text-muted))] hover:text-cyan',
            )}
          >
            <PackageSearch className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {HEADER_CTAS.pedido.label}
          </Link>
          {/* Link de texto, igual ao "Acompanhar pedido" ao lado. Era um
              btn-secondary com borda, e isso deixava TRÊS pesos disputando o
              mesmo canto: o botão laranja, uma caixa com borda e um link solto.
              O representante não é o público do site — a trilha dele é o
              /login, não a venda —, então ele não precisa de caixa. Assim
              sobra um CTA de verdade no header, que é o Comercial. */}
          <Link
            href={HEADER_CTAS.representative.href}
            // `/login` é só um redirect 307 pro app do representante (outro
            // domínio). O prefetch do Next disparava uma requisição RSC em
            // TODA página, que o navegador abortava — 1 a 2 pedidos perdidos
            // por page view, visíveis na varredura de 13/09.
            prefetch={false}
            className={cn(
              'hidden md:inline-flex items-center gap-1.5 font-sans text-sm transition-colors',
              isTransparent
                // Mesmo motivo do vizinho: sobre a foto do hero, texto solto
                // some nas partes claras — precisa de fundo próprio.
                ? 'rounded-btn bg-black/25 px-2.5 py-1.5 text-white/90 backdrop-blur-sm hover:bg-black/35 hover:text-white'
                : 'text-[rgb(var(--text-muted))] hover:text-cyan',
            )}
          >
            <Handshake className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {HEADER_CTAS.representative.label}
          </Link>
          {/* Destino é wa.me: <a> com target/rel, não <Link> (rota externa). */}
          <a
            href={HEADER_CTAS.commercial.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex btn-primary"
          >
            {HEADER_CTAS.commercial.label}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </a>
          {/* Mobile menu trigger */}
          <button
            ref={botaoMobileRef}
            type="button"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            aria-haspopup="dialog"
            className={cn(
              'lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border hover:border-gold transition-colors',
              isTransparent
                ? 'border-white/40 text-white'
                : 'border-[rgb(var(--border))]',
            )}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-deep_navy/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-[rgb(var(--bg))] border-l border-[rgb(var(--border))] shadow-premium-light dark:shadow-premium-dark overflow-y-auto"
          >
            <div className="flex h-20 items-center justify-between px-6 border-b border-[rgb(var(--border))]">
              <Image
                src="/logo-somatec.png"
                alt="Somatec Blocking"
                width={1576}
                height={494}
                className="h-8 w-auto dark:hidden"
              />
              <Image
                src="/logo-somatec-white.png"
                alt="Somatec Blocking"
                width={792}
                height={248}
                className="hidden h-8 w-auto dark:block"
              />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(var(--border))] hover:border-gold transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Navegação mobile" className="px-6 py-6 space-y-1">
              {navVisivel.map((item) => (
                <div key={item.href} className="py-1">
                  <Link
                    href={item.href}
                    className="block py-3 font-sans font-semibold text-base hover:text-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="ml-3 pl-4 border-l border-[rgb(var(--border))] space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block py-2 text-sm text-[rgb(var(--text-muted))] hover:text-gold transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-6 mt-6 border-t border-[rgb(var(--border))] space-y-3">
                <Link
                  href={HEADER_CTAS.pedido.href}
                  className="flex items-center gap-2 py-1 font-sans text-sm text-[rgb(var(--text-muted))] transition-colors hover:text-cyan"
                >
                  <PackageSearch className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  {HEADER_CTAS.pedido.label}
                </Link>
                <Link
                  href={HEADER_CTAS.representative.href}
                  prefetch={false}
                  className="btn-secondary w-full text-[rgb(var(--text))]"
                >
                  {HEADER_CTAS.representative.label}
                </Link>
                <a
                  href={HEADER_CTAS.commercial.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center"
                >
                  {HEADER_CTAS.commercial.label}
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
