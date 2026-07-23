import Image from 'next/image';
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
                {/* Fechamento #12: funil home NI → /protecao → calculadora. */}
                <Link href="/protecao" className="btn-primary group inline-flex">
                  Proteger meu carregador
                  <ChevronRight
                    className="h-4 w-4 transition-transform duration-200 ease-premium group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </div>
            </div>

            {/* Foto do Estúdio (despacho #6b) — 16:9 nativo, conector e cabo
                do carregador visíveis (sustentam o argumento do bloco). */}
            <div className="relative aspect-video overflow-hidden rounded-card-lg border border-[rgb(var(--border))] md:col-span-5">
              <Image
                src="/home/ni-carro-eletrico.webp"
                alt="Carro elétrico carregando na garagem com carregador de parede"
                fill
                loading="lazy"
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
