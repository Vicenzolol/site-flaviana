# Site Flaviana Marafoni

Landing page e mídia kit online de **Flaviana Marafoni**, influenciadora digital
em Marataízes/ES. Página única, feita para marcas: apresenta o trabalho, os
números de alcance, os feedbacks de parceiros e leva ao contato por WhatsApp.

**No ar:** https://flaviana-marafoni.vercel.app

## Stack

HTML, CSS e JavaScript puros. Sem framework, sem build, sem dependência —
o que está no repositório é exatamente o que o navegador recebe.

## Estrutura

```
index.html          Página inteira (conteúdo + SEO + JSON-LD)
privacidade.html    Política de privacidade (LGPD), fora do índice de busca
styles/styles.css   Estilos, incluindo tema claro/escuro
scripts/script.js   Interações (carrossel, FAQ, tema) e medição do Analytics
img/                Fotos, feedbacks, favicons e imagens de Open Graph
sitemap.xml         Sitemap enviado ao Google Search Console
robots.txt          Libera crawlers de busca e de IA
vercel.json         Headers, cache e cleanUrls na Vercel
.htaccess           Equivalente para Apache (uso local no WAMP)
```

Seções da página: hero, sobre, conteúdos, cases (alcance e feedbacks), marcas
parceiras, investimento, FAQ e contato.

## Medição e privacidade

O site usa **Google Analytics 4** (`G-08W7F5KQCJ`) em modo de consentimento:
nenhum cookie é gravado antes do aceite no banner, e recusar realmente desliga
a coleta. São 17 eventos personalizados, do clique no WhatsApp até a rolagem
que alcança a tabela de preços.

O código está em `scripts/script.js`, no bloco `medicao: eventos enviados ao
Analytics`, com um comentário em cada evento explicando o que ele responde.

**Cuidado ao mexer no HTML:** os eventos não conhecem a estrutura da página,
eles leem classes e atributos existentes (`data-duvida`, `data-fancybox`,
`data-aba`, `.reel__link`, `.case__brand`, os `id` das seções). Renomear
qualquer um deles não gera erro: o evento simplesmente para de contar, em
silêncio.

## Rodar localmente

Qualquer servidor estático serve. O projeto vive em `c:\wamp64\www\site-flaviana`,
então pelo WAMP basta abrir http://localhost/site-flaviana/ — assim o `.htaccess`
também entra em ação. Sem WAMP:

```bash
npx serve .
```

Abrir o `index.html` direto pelo `file://` funciona em parte, mas quebra os
caminhos absolutos e o JSON-LD.

## Deploy

Hospedado na **Vercel**, conectado a este repositório: todo push na `main` gera
um deploy de produção automático. Não há build step — o preset é _Other_, com
build command e output directory vazios.

O `vercel.json` cobre o que a Vercel não faz sozinha: headers de segurança
(`nosniff`, `X-Frame-Options`, `Referrer-Policy`, HSTS), cache de um ano nas
imagens e `cleanUrls` (que redireciona `/index.html` para `/`). HTTPS,
compressão e HTTP/2 já vêm por padrão.

`material/` (PDF do portfólio, ~80 MB) e `docs/` (anotações internas de copy e
SEO) ficam só na máquina local — estão no `.gitignore`.

## Ao trocar para o domínio próprio

Os endereços absolutos do `<link rel="canonical">`, das tags Open Graph, do
JSON-LD, do `sitemap.xml` e do `robots.txt` apontam hoje para
`flaviana-marafoni.vercel.app`. Ao ligar o domínio definitivo na Vercel, faça um
find/replace desse endereço pelo novo em `index.html`, `sitemap.xml` e
`robots.txt` — canonical apontando para o `.vercel.app` faz o Google indexar o
endereço errado. Atualize também o `<lastmod>` do sitemap.
