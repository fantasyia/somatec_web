/**
 * Componente utilitário que injeta um bloco Schema.org JSON-LD no HTML.
 * Server component (sem 'use client').
 *
 * Schema.org: https://schema.org/
 * Google rich results: https://developers.google.com/search/docs/appearance/structured-data
 */
type Props = {
  /** Objeto JSON-LD (já com @context). Será serializado e injetado em <script>. */
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // Sanitização: barramos </script> embedded pra evitar quebra de tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
