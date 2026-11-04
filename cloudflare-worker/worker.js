// CineMatch — intermediário https entre o site (GitHub Pages) e a API dos algoritmos
//
// O site publicado abre em https e o navegador bloqueia chamadas dele para uma API em http
// ("mixed content"). Este Worker roda na Cloudflare em https: o site chama o Worker, e o Worker
// repassa a chamada para a API em http. Entre servidores não existe esse bloqueio.
//
// Configuração (no painel da Cloudflare, em Settings → Variables and Secrets):
//   API_ORIGEM  endereço da API, sem barra no fim. Ex.: http://18-188-166-118.sslip.io:8000
// Se a variável não existir, usa API_ORIGEM_PADRAO abaixo.
//
// A Cloudflare não deixa um Worker chamar um IP direto (erro 1003), por isso o endereço usa
// o sslip.io: "18-188-166-118.sslip.io" é só um nome que aponta para o IP 18.188.166.118.

const API_ORIGEM_PADRAO = "http://18-188-166-118.sslip.io:8000";

// Só estas rotas da API são repassadas
const ROTAS = ["recomendacoes", "avaliacoes"];

// Só estes sites podem usar o Worker
const ORIGENS_PERMITIDAS = [
  "https://julamiranda88.github.io",
  "http://localhost:5500",
];

function cabecalhosCors(origem) {
  return {
    "Access-Control-Allow-Origin": ORIGENS_PERMITIDAS.includes(origem) ? origem : ORIGENS_PERMITIDAS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function resposta(corpo, status, origem) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json", ...cabecalhosCors(origem) },
  });
}

export default {
  async fetch(request, env) {
    const origem = request.headers.get("Origin") || "";
    const rota = new URL(request.url).pathname.replace(/^\/+|\/+$/g, "");

    // O navegador pergunta antes se pode enviar JSON ("preflight"); a resposta é sim
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cabecalhosCors(origem) });
    }
    if (request.method !== "POST") return resposta({ erro: "Use POST." }, 405, origem);
    if (!ROTAS.includes(rota)) return resposta({ erro: `Rota desconhecida: /${rota}` }, 404, origem);

    const destino = `${(env.API_ORIGEM || API_ORIGEM_PADRAO).replace(/\/+$/, "")}/${rota}`;
    try {
      const daApi = await fetch(destino, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await request.text(),
      });
      // Devolve ao site exatamente o que a API respondeu (status e corpo), com os cabeçalhos de CORS
      return new Response(daApi.body, {
        status: daApi.status,
        headers: {
          "Content-Type": daApi.headers.get("Content-Type") || "application/json",
          ...cabecalhosCors(origem),
        },
      });
    } catch (erro) {
      return resposta({ erro: `Worker não conseguiu falar com a API: ${erro.message}` }, 502, origem);
    }
  },
};
