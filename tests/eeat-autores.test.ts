import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AUTORES, autorPorNome, autorPorSlug, autoresComPagina } from '@/lib/constants/autores';
import { iniciaisDe } from '@/components/blog/AvatarAutor';
import { pessoaSchema, autorDoArtigo, revisorDoArtigo } from '@/lib/blog/schema-autor';

// =============================================================================
// E-E-A-T do blog.
//
// Proteção elétrica é YMYL. A regra que estes testes protegem é uma só e é
// contraintuitiva: em página YMYL, campo de credencial VAZIO é melhor que
// campo preenchido com texto genérico. "Especialista do setor" ou "bio em
// breve" é exatamente o sinal que o algoritmo pune.
// =============================================================================

describe('perfis de autor', () => {
  it('o nome casa com o que está gravado no artigo, tolerando acento', () => {
    // O acento é o caso que interessa: o nome vai pro banco como o editor
    // gravou e volta pro site como texto, e "Jose" tem de achar "José".
    expect(autorPorNome('José Fernando Nunes')?.slug).toBe('jose-fernando-nunes');
    expect(autorPorNome('  jose   fernando   nunes  ')?.slug).toBe('jose-fernando-nunes');
    expect(autorPorNome('JOSÉ FERNANDO NUNES')?.slug).toBe('jose-fernando-nunes');
  });

  it('nome desconhecido não vira perfil inventado', () => {
    expect(autorPorNome('Fulano de Tal')).toBeUndefined();
    expect(autorPorNome('')).toBeUndefined();
    expect(autorPorNome(null)).toBeUndefined();
  });

  it('a redação não tem página de autor — quem sustenta o artigo é o revisor', () => {
    expect(autorPorSlug('redator-somatec')).toBeDefined();
    expect(autoresComPagina().map((a) => a.slug)).not.toContain('redator-somatec');
  });

  it('a redação não pode aparecer como revisor: ninguém revisa a si mesmo', () => {
    expect(autorPorSlug('redator-somatec')?.revisor).toBe(false);
    expect(AUTORES.filter((a) => a.revisor).length).toBeGreaterThanOrEqual(2);
  });

  it('são estes três e mais ninguém (Léo, 18/09/2026)', () => {
    // Lista fechada de propósito. Quem entrar aqui vira opção no seletor do
    // CMS, e opção no seletor vira assinatura em página YMYL por um clique.
    expect(AUTORES.map((a) => a.slug).sort()).toEqual([
      'jose-fernando-nunes',
      'leandro-lima',
      'redator-somatec',
    ]);
  });

  it('slug é único — dois perfis no mesmo slug quebrariam /autor/<slug>', () => {
    const slugs = AUTORES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('schema Person — campo vazio não entra', () => {
  it('sem credencial, a chave hasCredential não existe', () => {
    const p = pessoaSchema('Leandro Lima');
    expect(p).not.toBeNull();
    expect(p).not.toHaveProperty('hasCredential');
    expect(p!.name).toBe('Leandro Lima');
  });

  it('credencial em branco é tratada como ausente, não como string vazia', () => {
    const p = pessoaSchema('Leandro Lima', { credencial: '   ', papel: '' });
    expect(p).not.toHaveProperty('hasCredential');
    // jobTitle cai no papel do perfil, que existe
    expect(p!.jobTitle).toBe('Sócio-diretor — Somatec Blocking');
  });

  it('credencial do post vence a do perfil', () => {
    const p = pessoaSchema('Leandro Lima', { credencial: 'CREA 123456/D' });
    expect(p!.hasCredential).toBe('CREA 123456/D');
  });

  it('nome vazio não vira Person', () => {
    expect(pessoaSchema('')).toBeNull();
    expect(pessoaSchema(null)).toBeNull();
    expect(pessoaSchema('   ')).toBeNull();
  });

  it('só linka pra página de autor que existe', () => {
    expect(pessoaSchema('Leandro Lima')!.url).toMatch(/\/autor\/leandro-lima$/);
    expect(pessoaSchema('Redator Somatec Blocking')).not.toHaveProperty('url');
    expect(pessoaSchema('Alguém de Fora')).not.toHaveProperty('url');
  });
});

describe('assinatura do artigo', () => {
  const cheia = {
    autor: 'Redator Somatec Blocking',
    revisor: 'José Fernando Nunes',
    revisadoEm: '2026-07-27',
    especialista: {
      nome: 'José Fernando Nunes',
      papel: 'Engenheiro de manutenção',
      bio: null,
      credencial: null,
    },
  };

  it('artigo assinado devolve Person no author', () => {
    const a = autorDoArtigo(cheia);
    expect(a['@type']).toBe('Person');
    expect(a.name).toBe('Redator Somatec Blocking');
  });

  it('sem autoria cadastrada, cai na empresa — que é honesto', () => {
    const a = autorDoArtigo(undefined);
    expect(a['@type']).toBe('Organization');
  });

  it('sem revisor, reviewedBy NÃO existe', () => {
    // reviewedBy apontando pra empresa não prova revisão técnica nenhuma
    expect(revisorDoArtigo(undefined)).toBeNull();
    expect(
      revisorDoArtigo({ autor: 'Redator Somatec Blocking', revisor: null, revisadoEm: null, especialista: null }),
    ).toBeNull();
  });

  it('o especialista do post vence o campo revisor', () => {
    const r = revisorDoArtigo({
      ...cheia,
      especialista: { nome: 'Leandro Lima', papel: null, bio: null, credencial: 'CEO' },
    });
    expect(r!.name).toBe('Leandro Lima');
    expect(r!.hasCredential).toBe('CEO');
  });
});

describe('espelho dos perfis entre os dois repos', () => {
  // A lista do site e a do CMS são arquivos separados em repos separados.
  // Divergir é silencioso: o artigo grava "Fulano" no banco, o site não acha o
  // perfil e o author box some sem erro nenhum.
  it('os nomes do site batem com os do CMS', () => {
    const caminhoCms = 'C:/Users/TechD/.claude/github/somatec-cms/lib/site/collaborators.ts';
    let fonteCms: string;
    try {
      fonteCms = readFileSync(caminhoCms, 'utf-8');
    } catch {
      // O CMS é outro repo e pode não estar clonado na máquina de quem roda os
      // testes (CI, por exemplo). Aí não há o que comparar.
      return;
    }
    for (const autor of AUTORES) {
      expect(fonteCms, `"${autor.nome}" não existe no CMS`).toContain(`name: "${autor.nome}"`);
    }

    // E o caminho de volta, que é o que dói na prática: nome que existe no CMS
    // e não existe aqui vira opção no seletor do editor, alguém escolhe, o
    // artigo grava esse nome — e o site não acha o perfil, então o author box
    // some calado. Foi por isso que o Marcelo Harada teve de sair dos DOIS.
    const nomesCms = [...fonteCms.matchAll(/^\s*name: "([^"]*)"/gm)]
      .map((m) => m[1])
      .filter(Boolean);
    expect(nomesCms.length, 'não achei nome nenhum no CMS — o formato mudou?').toBeGreaterThan(0);
    for (const nome of nomesCms) {
      expect(autorPorNome(nome), `"${nome}" está no CMS e não tem perfil no site`).toBeDefined();
    }
  });
});

describe('pendência registrada — não é bug, é decisão do Léo', () => {
  it('nenhum perfil tem credencial inventada', () => {
    // Se alguém preencher credencial sem o Léo confirmar, este teste cai.
    // Em YMYL, credencial não verificável é pior que credencial ausente.
    for (const a of AUTORES) {
      if (!a.credencial) continue;
      expect(a.credencial, `${a.nome}: credencial genérica`).not.toMatch(
        /especialista do setor|profissional da área|em breve|a definir/i,
      );
    }
  });

  it('🔒 o Fernando continua SEM FOTO — é vontade dele, não campo por preencher', () => {
    // Decisão do Léo em 15/09: ele fica como revisor público (nome + CREA), mas
    // não quer o rosto no site. Sem esta guarda, o item "definir foto, mini-bio
    // e credencial dos três" do card de go-live convida o próximo a preencher
    // a foto junto com o resto, achando que é campo esquecido.
    //
    // ⛔ E, se alguém for preencher assim mesmo, o perigo não é só desrespeitar
    // o pedido: a saída fácil é foto de banco de imagem ou retrato gerado, e
    // numa página YMYL sobre risco elétrico um rosto que não é de ninguém
    // derruba a confiança na página inteira quando alguém percebe.
    const fernando = autorPorSlug('jose-fernando-nunes');
    expect(fernando?.foto, 'ele pediu pra não ter foto — ver comentário em autores.ts').toBeNull();
  });

  it('sem foto, o avatar é MONOGRAMA — o caminho sem foto não tem imagem nenhuma', () => {
    // O que torna o "sem foto" aceitável é o fallback não fingir ser um rosto.
    // Iniciais identificam sem inventar ninguém; uma <img> aqui transformaria
    // a ausência de foto numa pessoa que não existe.
    const fonte = readFileSync(
      resolve(process.cwd(), 'src/components/blog/AvatarAutor.tsx'),
      'utf-8',
    );
    // sem os comentários: o próprio cabeçalho do arquivo fala em <img>, e
    // contar a menção junto com o código faria a guarda cair sozinha.
    const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(codigo.match(/<img/g) ?? [], 'AvatarAutor ganhou uma segunda <img>').toHaveLength(1);
    expect(codigo, 'a <img> saiu de dentro do ramo `foto ?`').toMatch(/foto \?[\s\S]{0,200}<img/);
    const semFoto = codigo.slice(codigo.indexOf(': iniciais ?'));
    expect(semFoto, 'o caminho sem foto ganhou imagem').not.toMatch(/<img|background-image|url\(/);
  });

  it('as duas telas passam pelo AvatarAutor — ninguém desenha o círculo por fora', () => {
    // Se alguém voltar a montar o avatar à mão numa das telas, a guarda acima
    // continua verde e a tela escapa dela. Daí este teste existir.
    for (const arquivo of [
      'src/components/blog/AssinaturaArtigo.tsx',
      'src/app/autor/[slug]/page.tsx',
    ]) {
      const fonte = readFileSync(resolve(process.cwd(), arquivo), 'utf-8');
      expect(fonte, `${arquivo}: não usa AvatarAutor`).toContain('<AvatarAutor');
      expect(fonte, `${arquivo}: voltou a desenhar foto de pessoa por fora`).not.toMatch(
        /<img[^>]*alt=\{(autor\.)?nome\}/,
      );
    }
  });

  it('o monograma sai do nome e ignora partícula', () => {
    expect(iniciaisDe('José Fernando Nunes')).toBe('JN');
    expect(iniciaisDe('Leandro Lima')).toBe('LL');
    expect(iniciaisDe('Maria de Souza')).toBe('MS');
    expect(iniciaisDe('Prince')).toBe('P');
    // sem nome não há monograma: aí a tela cai no ícone neutro
    expect(iniciaisDe('')).toBe('');
    expect(iniciaisDe(null)).toBe('');
  });

  it('o revisor engenheiro tem nome completo E registro — os dois juntos', () => {
    // Substitui o lembrete do placeholder "Fernando Engenheiro", resolvido em
    // 18/09/2026. Nome próprio sem CREA não sustenta página YMYL de risco
    // elétrico, e CREA sem nome não identifica ninguém.
    const eng = autorPorSlug('jose-fernando-nunes');
    expect(eng, 'o slug do engenheiro mudou sem atualizar este teste').toBeDefined();
    expect(eng!.nome).toBe('José Fernando Nunes');
    expect(eng!.credencial).toMatch(/^CREA-SP \d{10}$/);
    expect(eng!.revisor).toBe(true);
  });
});
