/**
 * Separador sutil entre seções — hairline 1px com pontas suavizadas (fade),
 * largura do container, baixo contraste e adaptado ao tema (via --border:
 * levemente mais escuro no claro, mais claro no navy). Dá ritmo sem brigar com
 * a textura. Decorativo → aria-hidden.
 */
export function SectionDivider() {
  return (
    <div className="container-msm" aria-hidden="true">
      <div className="divider-gradient" />
    </div>
  );
}
