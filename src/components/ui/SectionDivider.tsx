/**
 * Separação entre seções por SOMBRA suave (planos sobrepostos) — não por linha.
 * Marca a fronteira por profundidade e dá ritmo, bem sutil. Decorativo →
 * aria-hidden. Não ocupa espaço (o estilo vive no ::before de .section-shadow).
 */
export function SectionDivider() {
  return <div className="section-shadow" aria-hidden="true" />;
}
