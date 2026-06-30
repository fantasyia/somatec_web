import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const SWAGGER_VERSION = '5.17.14';

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>MSM API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css" />
  <style>
    html, body { margin: 0; background: #fafafa; font-family: system-ui, -apple-system, sans-serif; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; }
    .swagger-ui .topbar { display: none; }
    .msm-header { padding: 20px 40px; background: #03111F; color: #F7F5EF; border-bottom: 1px solid #1a2a3f; }
    .msm-header h1 { margin: 0; font-size: 18px; letter-spacing: -0.5px; }
    .msm-header .badge { display: inline-block; margin-left: 8px; padding: 2px 8px; font-size: 11px; background: #C9A24A; color: #03111F; border-radius: 4px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="msm-header">
    <h1>MSM Alimentos — API Docs <span class="badge">OpenAPI 3.1</span></h1>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script>
    window.addEventListener('load', function () {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        defaultModelsExpandDepth: 1,
        docExpansion: 'list',
        filter: true,
        tryItOutEnabled: false,
        syntaxHighlight: { theme: 'agate' },
      });
    });
  </script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
