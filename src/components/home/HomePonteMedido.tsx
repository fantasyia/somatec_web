import { Reveal } from '@/components/ui/Reveal';

/**
 * Faixa-ponte (despacho): virada de "isso funciona (gráfico/teoria)" → "isso
 * funcionou de verdade (cases)". Faixa fina, largura total, fundo navy
 * (#00416E), só tipografia — sem foto/ícone. Fica ENTRE o galpão (claro) e a
 * seção de cases (off-white): navy aqui ancora o ritmo sem colar dois navy.
 * 1 destaque laranja: "medido". Reveal suave (fade + subida) via <Reveal>,
 * que respeita prefers-reduced-motion.
 */
export function HomePonteMedido() {
  return (
    <section
      aria-label="Medição na planta do cliente"
      className="bg-[rgb(var(--navy))] py-10 text-center text-white md:py-16"
    >
      <Reveal>
        <p className="container-msm font-serif font-semibold leading-snug text-balance text-[clamp(1.4rem,3.5vw,2.4rem)]">
          Isso não é laboratório. É <span className="text-gold">medido</span> dentro da
          planta de cada cliente.
        </p>
      </Reveal>
    </section>
  );
}
