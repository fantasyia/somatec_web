import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

/**
 * Faixa de carro elétrico (despacho #5) — aprofundamento do público NI, logo
 * após o bloco-ponte. Compacta, pra não re-inflar a home. Argumento
 * QUALITATIVO por regra: sem estatística inventada, sem citar marca de carro
 * ou carregador. Foto do Estúdio a caminho — placeholder até chegar.
 */
export function HomeCarroEletrico() {
  return (
    <section aria-label="Proteção para carregador de carro elétrico">
      <div className="container-msm py-10 md:py-14">
        <Reveal>
          <div className="grid items-center gap-8 md:grid-cols-12">
            <div className="space-y-3 md:col-span-7">
              <h2 className="font-serif text-h3-m md:text-h3-d font-semibold text-balance">
                Seu carro elétrico carrega a noite inteira. A rede não avisa
                quando oscila.
              </h2>
              <p className="text-[rgb(var(--text-muted))] leading-relaxed max-w-xl">
                O carregador de parede e o sistema de carga do próprio veículo
                são eletrônicos sensíveis, ligados à rede por horas seguidas —
                quase sempre de madrugada e sem ninguém por perto. E quem tem
                carro elétrico costuma ter inversor solar no mesmo quadro: dois
                patrimônios caros na mesma tomada.
              </p>
              <div className="pt-2">
                <Link href="/ferramentas/orcamento" className="btn-primary group inline-flex">
                  Proteger meu carregador
                  <ChevronRight
                    className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </div>
            </div>

            {/* Placeholder até a foto do Estúdio (prompt já despachado) */}
            <div
              className="relative flex aspect-video items-end overflow-hidden rounded-card-lg border border-[rgb(var(--border))] p-6 md:col-span-5"
              style={{
                background:
                  'linear-gradient(135deg, rgb(13,41,73) 0%, rgb(7,27,51) 60%, rgb(3,17,31) 100%)',
              }}
              aria-hidden="true"
            >
              <span className="font-serif text-3xl font-bold tracking-tight text-white/10">
                Carro elétrico
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
