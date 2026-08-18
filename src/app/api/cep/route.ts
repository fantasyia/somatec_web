import { NextResponse, type NextRequest } from 'next/server';

// =============================================================================
// Consulta de CEP para o checkout (proxy server-side do ViaCEP).
//
// Por que proxy e não fetch direto do browser: a CSP do site tem `connect-src`
// restrito (self + supabase + turnstile + sentry). Chamada do cliente pro
// viacep.com.br seria BLOQUEADA. Aqui o servidor busca e devolve normalizado.
//
// Serviço público, sem credencial — não depende do gateway nem do Melhor Envio.
// =============================================================================

type ViaCep = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
};

export async function GET(req: NextRequest) {
  const bruto = req.nextUrl.searchParams.get('cep') ?? '';
  const cep = bruto.replace(/\D/g, '');

  if (cep.length !== 8) {
    return NextResponse.json({ ok: false, message: 'CEP deve ter 8 dígitos.' }, { status: 400 });
  }

  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      // CEP muda pouco; cache reduz ida à origem e protege de instabilidade.
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error(String(r.status));

    const d = (await r.json()) as ViaCep;
    if (d.erro) {
      return NextResponse.json({ ok: false, message: 'CEP não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      endereco: {
        cep,
        logradouro: d.logradouro ?? '',
        bairro: d.bairro ?? '',
        cidade: d.localidade ?? '',
        uf: (d.uf ?? '').toUpperCase(),
      },
    });
  } catch {
    // Fora do ar / timeout: o checkout NÃO trava — o cliente preenche à mão.
    return NextResponse.json(
      { ok: false, message: 'Não consegui buscar o CEP agora. Preencha o endereço à mão.' },
      { status: 502 },
    );
  }
}
