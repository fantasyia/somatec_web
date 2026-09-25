import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuthorBox, BylineArtigo } from '@/components/blog/AssinaturaArtigo';
import type { Assinatura } from '@/lib/blog/fonte';

// Render em markup estático (sem jsdom, que o projeto não usa). O que se
// verifica aqui é a regra dura do E-E-A-T: campo vazio NÃO vira texto na tela.

const base: Assinatura = {
  autor: 'Redator Somatec Blocking',
  revisor: 'Leandro Lima',
  revisadoEm: '2026-07-27',
  especialista: null,
};

describe('byline', () => {
  it('mostra quem escreveu e quem revisou', () => {
    const html = renderToStaticMarkup(<BylineArtigo assinatura={base} />);
    expect(html).toContain('Escrito por');
    expect(html).toContain('Redator Somatec Blocking');
    expect(html).toContain('Revisado por');
    expect(html).toContain('Leandro Lima');
  });

  it('revisor igual ao autor não repete o nome', () => {
    const html = renderToStaticMarkup(
      <BylineArtigo assinatura={{ ...base, revisor: 'Redator Somatec Blocking' }} />,
    );
    expect(html).not.toContain('Revisado por');
  });

  it('sem assinatura não renderiza nada', () => {
    expect(renderToStaticMarkup(<BylineArtigo assinatura={undefined} />)).toBe('');
    expect(renderToStaticMarkup(<BylineArtigo assinatura={{ ...base, autor: null }} />)).toBe('');
  });

  it('linka o revisor pra página dele, o redator genérico não', () => {
    const html = renderToStaticMarkup(<BylineArtigo assinatura={base} />);
    expect(html).toContain('/autor/leandro-lima');
    expect(html).not.toContain('/autor/redator-somatec');
  });
});

describe('author box', () => {
  it('sem revisor, a caixa inteira some — não há autoridade a provar', () => {
    const html = renderToStaticMarkup(
      <AuthorBox assinatura={{ ...base, revisor: null, especialista: null }} />,
    );
    expect(html).toBe('');
  });

  it('papel e bio vêm do perfil; campo vazio NÃO vira linha em branco nem placeholder', () => {
    const html = renderToStaticMarkup(<AuthorBox assinatura={base} />);
    expect(html).toContain('Revisão técnica');
    expect(html).toContain('Leandro Lima');
    expect(html).toContain('Sócio-diretor — Somatec Blocking'); // papel vem do perfil
    expect(html).toContain('Em 2011'); // bio vem do perfil
    // nada de "em breve", "a definir" ou parágrafo vazio
    expect(html).not.toMatch(/em breve|a definir|<p[^>]*><\/p>/i);
  });

  it('credencial do post aparece quando existe', () => {
    const html = renderToStaticMarkup(
      <AuthorBox
        assinatura={{
          ...base,
          // Pessoa FICTÍCIA de propósito, com CREA fictício: é o teste de que o
          // campo do post vence o perfil. Não pôr aqui o nome nem o registro de
          // quem revisa de verdade — dado de fixture vira dado de produção por
          // copiar e colar, e credencial errada em YMYL é o pior dos mundos.
          especialista: {
            nome: 'Engenheira de Exemplo',
            papel: 'Engenheira eletricista',
            bio: 'Atua com qualidade de energia há 12 anos.',
            credencial: 'CREA-XX 0000000000',
          },
        }}
      />,
    );
    expect(html).toContain('CREA-XX 0000000000');
    expect(html).toContain('Atua com qualidade de energia');
    expect(html).toContain('Engenheira eletricista');
  });
});
