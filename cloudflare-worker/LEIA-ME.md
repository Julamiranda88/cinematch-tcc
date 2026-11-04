# Worker da Cloudflare (intermediário https da API)

O site no GitHub Pages abre em **https** e o navegador bloqueia chamadas dele para a API em **http**.
O Worker roda em https e repassa as chamadas para a API: `site → Worker (https) → API (http)`.

## Criar o Worker (uma vez)

1. Crie uma conta grátis em https://dash.cloudflare.com/sign-up
2. No menu, abra **Compute (Workers) → Workers & Pages → Create → Start with Hello World**.
3. Dê o nome `cinematch-api` e clique em **Deploy**.
4. Clique em **Edit code**, apague tudo, cole o conteúdo de `worker.js` e clique em **Deploy**.
5. Copie o endereço do Worker, algo como `https://cinematch-api.SEU-SUBDOMINIO.workers.dev`.
6. Em `Site/js/recomendacoes.js`, troque o valor de `API_WORKER` por esse endereço e faça commit e push.

## Quando o IP da API mudar

Em **Settings → Variables and Secrets** do Worker, crie (ou edite) a variável `API_ORIGEM` com o novo
endereço, no formato `http://18-188-166-118.sslip.io:8000` (o IP com hífens + `.sslip.io` + porta).
Não precisa mexer no site. Sem essa variável, o Worker usa o endereço escrito em `API_ORIGEM_PADRAO`.

## Testar

Abra no navegador `https://cinematch-api.SEU-SUBDOMINIO.workers.dev/recomendacoes`.
A resposta `{"erro":"Use POST."}` indica que o Worker está no ar. Depois, teste a tela de Sugestões no site publicado.
