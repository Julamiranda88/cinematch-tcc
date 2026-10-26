// CineMatch — componentes compartilhados e interações das telas
// Os filmes vêm de js/catalogo.js (gerado de movies_small.csv / ratings_small.csv por ferramentas/gerar_catalogo.py)

const NAV_LINKS = [
  { id: "inicio", label: "Início", href: "inicio.html" },
  { id: "sugestoes", label: "Sugestões", href: "sugestoes.html" },
  { id: "historico", label: "Histórico", href: "avaliacoes.html" },
  { id: "sobre", label: "Sobre", href: "sobre.html" },
];

const DESTAQUE = 109487; // Interstellar (2014)
const FILME_PADRAO = 109487;
const POR_PAGINA = 20;

// Coleções das sugestões, montadas com movieIds da base
const COLECOES = [
  {
    nome: "Viagem às estrelas",
    texto: "Histórias para ir além do nosso planeta.",
    subtitulo: "5 filmes para explorar o universo e os limites da humanidade.",
    votos: 128,
    filmes: [109487, 164179, 79132, 104841, 134130],
  },
  {
    nome: "Ficção científica essencial",
    texto: "Novos mundos, grandes perguntas.",
    subtitulo: "5 clássicos que definiram o gênero.",
    votos: 96,
    filmes: [2571, 541, 924, 1214, 1270],
  },
  {
    nome: "Uma dose de adrenalina",
    texto: "Ação e emoção do começo ao fim.",
    subtitulo: "5 filmes para assistir sem piscar.",
    votos: 74,
    filmes: [122882, 1036, 58559, 3578, 115149],
  },
];

// Conta de demonstração com os dados mostrados no Figma (login: joao.silva@email.com / senha: cinematch)
const CONTA_DEMO = "joao.silva@email.com";
const USUARIO_DEMO = {
  nome: "João Silva",
  email: "joao.silva@email.com",
  senha: "c2c40e9b22a2d99d46b787be5177ac66d2c8224d54e5101ef4276ae54b1ced0d",
  criadoEm: "2024-01-15",
};

// Avaliações de exemplo da conta de demonstração (as feitas no site são somadas a estas)
const AVALIACOES_INICIAIS = {
  109487: { nota: 4, comentario: "Emocionante! A história e a trilha sonora são inesquecíveis.", data: "2026-10-24" },
  79132: { nota: 5, comentario: "", data: "2026-10-22" },
  58559: { nota: 4, comentario: "", data: "2026-10-19" },
  122882: { nota: 4, comentario: "", data: "2026-10-15" },
};

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const DETALHES = {};
const FILME_POR_ID = new Map((typeof FILMES !== "undefined" ? FILMES : []).map((f) => [f[0], f]));

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("cinematch:" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem("cinematch:" + key, JSON.stringify(value)); } catch (e) { /* armazenamento indisponível */ }
  },
};

// ---------- Contas de usuário ----------
// As contas ficam no navegador (localStorage); a senha é guardada como hash SHA-256, nunca em texto puro.
// A conta é identificada pelo e-mail (sem diferenciar maiúsculas de minúsculas)
const chaveUsuario = (email) => email.trim().toLowerCase();
const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

function contas() {
  return { [CONTA_DEMO]: USUARIO_DEMO, ...store.get("usuarios", {}) };
}

async function hashSenha(chave, senha) {
  const bytes = new TextEncoder().encode(`${chave}:${senha}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function usuarioAtual() {
  const chave = store.get("sessao", null);
  const conta = chave && contas()[chave];
  return conta ? { chave, ...conta } : null;
}

const iniciais = (nome) => {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0] || "")[0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
};

// Dados guardados separadamente para cada usuário (avaliações, votos e filmes salvos)
const meus = {
  get(key, fallback) {
    const u = usuarioAtual();
    return u ? store.get(`u:${u.chave}:${key}`, fallback) : fallback;
  },
  set(key, value) {
    const u = usuarioAtual();
    if (u) store.set(`u:${u.chave}:${key}`, value);
  },
};
const ehDemo = () => (usuarioAtual() || {}).chave === CONTA_DEMO;

const fmt = (n) => n.toFixed(1).replace(".", ",");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const semAcento = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const param = (nome) => new URLSearchParams(location.search).get(nome);

// ---------- Dados dos filmes ----------
// Cada filme: [movieId, título, título original, ano, gêneros, média 0,5–5, nº de avaliações, duração, pôster local?, pôster TMDB]
const filme = (id) => FILME_POR_ID.get(+id);
const titulo = (f) => f[1];
const generosDe = (f) => f[4].map((g) => GENEROS[g]).filter((g) => g !== "IMAX");
const generoPrincipal = (f) => generosDe(f)[0] || "Sem gênero";
const notaComunidade = (f) => (f[5] == null ? "–" : fmt(f[5] * 2));

function duracao(min) {
  if (!min) return "";
  const h = Math.floor(min / 60), m = min % 60;
  return h ? (m ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
}

function metadados(f, generos = 1) {
  return [f[3] || null, generosDe(f).slice(0, generos).join(", ") || null, duracao(f[7]) || null].filter(Boolean).join(" · ");
}

function poster(f, extra = "") {
  if (f && f[8]) {
    return `<img class="poster ${extra}" src="img/filmes/${f[0]}.jpg" alt="Pôster de ${esc(titulo(f))}" loading="lazy">`;
  }
  return `<span class="poster placeholder ${extra}" role="img" aria-label="${f ? esc(titulo(f)) : "Filme"}">${icon("clapperboard-28")}<span>${f ? esc(titulo(f)) : ""}</span></span>`;
}

// Pôster grande: usa a versão em alta resolução do TMDB e volta para a cópia local se estiver sem internet
function posterGrande(f, extra = "") {
  if (!f || !f[9]) return poster(f, extra);
  const local = f[8] ? `img/filmes/${f[0]}.jpg` : "";
  return `<img class="poster ${extra}" src="https://image.tmdb.org/t/p/w500${f[9]}" alt="Pôster de ${esc(titulo(f))}"${local ? ` onerror="this.onerror=null;this.src='${local}'"` : ""}>`;
}

function carregarDetalhes(id) {
  return new Promise((resolve) => {
    if (DETALHES[id]) return resolve(DETALHES[id]);
    const s = document.createElement("script");
    s.src = `js/detalhes/${id % 100}.js`;
    s.onload = () => resolve(DETALHES[id] || {});
    s.onerror = () => resolve({});
    document.head.appendChild(s);
  });
}

function cartaoFilme(f) {
  return `
    <a class="movie-card" href="filme.html?id=${f[0]}">
      ${poster(f)}
      <span class="title" title="${esc(titulo(f))}">${esc(titulo(f))}</span>
      <span class="genre">${generoPrincipal(f)}</span>
      <span class="rating">★ <span>${notaComunidade(f)}</span></span>
    </a>`;
}

// ---------- Avaliações do usuário ----------
function avaliacoes() {
  return { ...(ehDemo() ? AVALIACOES_INICIAIS : {}), ...meus.get("avaliacoes", {}) };
}

const totalVotos = () => meus.get("totalVotos", ehDemo() ? 8 : 0);
const votoAtual = () => meus.get("voto", ehDemo() ? 0 : null);

function listaAvaliacoes() {
  return Object.entries(avaliacoes())
    .filter(([id]) => filme(id))
    .map(([id, a]) => ({ id: +id, ...a }))
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
}

function dataPorExtenso(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Filme avaliado por último (ou o mais recente do histórico); null se o usuário ainda não avaliou nenhum
function ultimaAvaliacao() {
  const todas = avaliacoes();
  const id = meus.get("ultimaAvaliacao", null);
  if (id && todas[id] && filme(id)) return { f: filme(id), nota: todas[id].nota };
  const recente = listaAvaliacoes()[0];
  return recente ? { f: filme(recente.id), nota: recente.nota } : null;
}

// ---------- Ícones e estrutura comum ----------
function icon(name) {
  const def = ICONS[name];
  if (!def) return "";
  const [size, paths, altura = size] = def;
  return `<span class="icon" aria-hidden="true"><svg viewBox="0 0 ${size} ${altura}" xmlns="http://www.w3.org/2000/svg">${paths}</svg></span>`;
}

// Submenu da conta: abre ao clicar no avatar/nome e fecha ao clicar fora ou com Esc
function initMenuConta(raiz) {
  const toggle = raiz.querySelector(".account-toggle");
  if (!toggle) return;
  const menu = raiz.querySelector(".account-dropdown");
  const definir = (aberto) => {
    menu.hidden = !aberto;
    toggle.setAttribute("aria-expanded", aberto);
    toggle.classList.toggle("open", aberto);
  };
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    definir(menu.hidden);
  });
  document.addEventListener("click", () => definir(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      definir(false);
      toggle.focus();
    }
  });
}

function renderIcons(root = document) {
  root.querySelectorAll("i[data-icon]").forEach((el) => {
    el.outerHTML = icon(el.dataset.icon);
  });
}

const brand = `<a class="brand" href="inicio.html" aria-label="CineMatch — início">${icon("clapperboard-27")}<span>Cine<b>Match</b></span></a>`;

function renderChrome() {
  const header = document.querySelector("header[data-nav]");
  const conta = usuarioAtual();
  if (header) {
    const active = header.dataset.nav;
    header.className = "site-header app";
    header.innerHTML = `
      ${brand}
      <nav class="main-nav" aria-label="Navegação principal">
        ${NAV_LINKS.map((l) => `<a href="${l.href}"${l.id === active ? ' class="active" aria-current="page"' : ""}>${l.label}</a>`).join("")}
      </nav>
      <div class="account">${conta ? `
        <button class="bell" type="button" aria-label="Notificações">${icon("bell-20")}</button>
        <div class="account-menu">
          <button class="account-toggle" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="menu-conta">
            <span class="avatar">${esc(iniciais(conta.nome))}</span>
            <span class="name">${esc(conta.nome)}</span>
            <span class="chevron">${icon("chevron-down-8")}</span>
          </button>
          <div class="account-dropdown" id="menu-conta" role="menu" hidden>
            <div class="identity-row">
              <strong>${esc(conta.nome)}</strong>
              <span>${esc(conta.email || "")}</span>
            </div>
            <div class="menu-divider"></div>
            <a role="menuitem" href="perfil.html">${icon("menu-user-20")}Meu perfil</a>
            <a role="menuitem" href="avaliacoes.html">${icon("menu-star-20")}Minhas avaliações</a>
            <div class="menu-divider"></div>
            <a role="menuitem" href="index.html" data-sair>${icon("menu-logout-20")}Sair</a>
          </div>
        </div>` : `
        <a class="btn" href="index.html">Entrar</a>`}
      </div>`;
    initMenuConta(header);
  }

  const authHeader = document.querySelector("header[data-auth]");
  if (authHeader) {
    authHeader.className = "site-header";
    authHeader.innerHTML = `${brand.replace('href="inicio.html"', 'href="index.html"')}<a class="help-link" href="sobre.html">Precisa de ajuda?</a>`;
  }

  const footer = document.querySelector("footer[data-footer]");
  if (footer) {
    if (footer.dataset.footer === "auth") {
      footer.className = "site-footer centered";
      footer.innerHTML = "<span>© 2026 CineMatch. Feito para quem ama cinema.</span>";
    } else {
      footer.className = "site-footer app";
      footer.innerHTML = `
        <span>CineMatch · Uma experiência completa para quem ama cinema.</span>
        <span class="legal-links"><a href="#">Privacidade</a><a href="#">Termos de uso</a></span>`;
    }
  }
}

function initBookmarks(root = document) {
  const salvos = new Set(meus.get("salvos", []));
  root.querySelectorAll(".bookmark-btn:not([data-ligado])").forEach((b) => {
    b.dataset.ligado = "1";
    const id = b.dataset.id;
    if (id && salvos.has(id)) {
      b.classList.add("saved");
      b.setAttribute("aria-pressed", "true");
    }
    b.addEventListener("click", (e) => {
      e.preventDefault();
      const on = b.classList.toggle("saved");
      b.setAttribute("aria-pressed", on);
      if (!id) return;
      const atual = new Set(meus.get("salvos", []));
      on ? atual.add(id) : atual.delete(id);
      meus.set("salvos", [...atual]);
    });
  });
}

// ---------- Acesso ----------
function initAuthForm() {
  const form = document.querySelector("form[data-auth-form]");
  if (!form) return;
  const cadastro = form.dataset.authForm === "cadastro";
  const nome = form.querySelector("#nome");
  const email = form.querySelector("#email");
  const senha = form.querySelector("#senha");
  const erro = form.querySelector(".form-error");
  const campos = [nome, email, senha].filter(Boolean);

  const falhar = (msg, campo) => {
    erro.textContent = msg;
    erro.hidden = false;
    form.querySelectorAll(".input").forEach((i) => i.classList.remove("invalid"));
    if (campo) {
      campo.closest(".input").classList.add("invalid");
      campo.focus();
    }
  };
  campos.forEach((c) => c.addEventListener("input", () => {
    c.closest(".input").classList.remove("invalid");
    erro.hidden = true;
  }));

  // Olho da senha: alterna entre senha oculta e visível
  const olho = form.querySelector(".toggle-senha");
  if (olho) {
    olho.addEventListener("click", () => {
      const mostrar = senha.type === "password";
      senha.type = mostrar ? "text" : "password";
      olho.classList.toggle("on", mostrar);
      olho.setAttribute("aria-pressed", mostrar);
      olho.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      senha.focus();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nomeLimpo = cadastro ? nome.value.trim().replace(/\s+/g, " ") : "";
    const chave = chaveUsuario(email.value);
    const todas = contas();

    if (cadastro && nomeLimpo.length < 3) return falhar("Informe seu nome (pelo menos 3 letras).", nome);
    if (!emailValido(chave)) return falhar("Informe um e-mail válido, como nome@exemplo.com.", email);
    if (!senha.value) return falhar("Informe sua senha.", senha);

    if (cadastro) {
      if (senha.value.length < 6) return falhar("A senha precisa ter pelo menos 6 caracteres.", senha);
      if (todas[chave]) return falhar("Já existe uma conta com esse e-mail. Entre ou use outro e-mail.", email);
      const usuarios = store.get("usuarios", {});
      usuarios[chave] = { nome: nomeLimpo, email: chave, senha: await hashSenha(chave, senha.value), criadoEm: hoje() };
      store.set("usuarios", usuarios);
    } else {
      if (!todas[chave]) return falhar("Não encontramos uma conta com esse e-mail. Confira ou cadastre-se.", email);
      if (todas[chave].senha !== await hashSenha(chave, senha.value)) return falhar("Senha incorreta.", senha);
    }
    store.set("sessao", chave);
    window.location.href = "inicio.html";
  });
}

// Páginas internas exigem login; "Sair" encerra a sessão
function initSessao() {
  // Delegação de evento: o link "Sair" do submenu só existe depois que o cabeçalho é montado
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-sair]")) store.set("sessao", null);
  });
  const interna = document.querySelector("header[data-nav]") && !document.body.hasAttribute("data-publico");
  if (interna && !usuarioAtual()) {
    window.location.replace("index.html");
    return false;
  }
  if (document.querySelector("form[data-auth-form]") && usuarioAtual() && !param("trocar")) {
    window.location.replace("inicio.html");
    return false;
  }
  return true;
}

// ---------- Início ----------
function initInicio() {
  const hero = document.querySelector("[data-destaque]");
  if (!hero) return;
  const f = filme(DESTAQUE);
  hero.querySelector("h2").textContent = titulo(f);
  hero.querySelector(".meta").innerHTML = `${f[3]}  ·  ${esc(generoPrincipal(f))}  ·  <span>★ ${notaComunidade(f)}</span>`;
  hero.querySelector(".btn").href = `filme.html?id=${f[0]}`;
  carregarDetalhes(f[0]).then((d) => { if (d.sinopse) hero.querySelector(".synopsis").textContent = d.sinopse; });
  document.querySelector(".trending").innerHTML = FILMES.slice(0, 6).map(cartaoFilme).join("");
}

// ---------- Pesquisa ----------
function initSearchForm() {
  document.querySelectorAll("form[data-search]").forEach((form) => {
    const input = form.querySelector("input");
    const clear = form.querySelector(".clear");
    const sync = () => { if (clear) clear.hidden = !input.value; };
    input.addEventListener("input", sync);
    if (clear) {
      clear.addEventListener("click", () => {
        input.value = "";
        sync();
        input.focus();
      });
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = "resultados.html" + (q ? "?q=" + encodeURIComponent(q) : "");
    });
    sync();
  });
}

// ---------- Resultados ----------
function opcoesDeFiltro() {
  const decadas = [...new Set(FILMES.map((f) => Math.floor(f[3] / 10) * 10).filter(Boolean))].sort((a, b) => b - a);
  return {
    genero: { label: "Gênero", options: ["Todos os gêneros", ...GENEROS.filter((g) => g !== "IMAX").slice().sort((a, b) => a.localeCompare(b, "pt"))] },
    nota: { label: "Melhor nota", options: ["Qualquer nota", "9 ou mais", "8 ou mais", "7 ou mais", "6 ou mais"], minimos: [0, 9, 8, 7, 6] },
    ano: { label: "Ano", options: ["Todos os anos", ...decadas.map((d) => `Anos ${d}`)], decadas: [null, ...decadas] },
  };
}

function initResults() {
  const page = document.querySelector("[data-results]");
  if (!page) return;
  const FILTERS = opcoesDeFiltro();
  const query = (param("q") || "").trim();
  const input = page.querySelector(".search-bar input");
  input.value = query;
  input.dispatchEvent(new Event("input"));

  const state = { genero: 0, nota: 0, ano: 0 };
  let limite = POR_PAGINA;
  const filtersEl = page.querySelector(".filters");
  const applyBtn = filtersEl.querySelector("[data-apply]");

  Object.entries(FILTERS).forEach(([key, f]) => {
    const dd = document.createElement("div");
    dd.className = "dropdown";
    dd.innerHTML = `
      <button class="dropdown-toggle" type="button" aria-haspopup="listbox" aria-expanded="false">${f.label}  ⌄</button>
      <div class="dropdown-menu" role="listbox" aria-label="${f.label}">
        ${f.options.map((o, i) => `<button type="button" role="option" data-i="${i}"><span>${o}</span>${icon("selected-16")}</button>`).join("")}
      </div>`;
    filtersEl.insertBefore(dd, applyBtn);
    const toggle = dd.querySelector(".dropdown-toggle");
    const paint = () => {
      dd.querySelectorAll("[data-i]").forEach((b) => {
        const sel = +b.dataset.i === state[key];
        b.classList.toggle("selected", sel);
        b.setAttribute("aria-selected", sel);
      });
      const open = dd.classList.contains("open");
      toggle.textContent = `${state[key] ? f.options[state[key]] : f.label}  ${open ? "⌃" : "⌄"}`;
      toggle.setAttribute("aria-expanded", open);
    };
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !dd.classList.contains("open");
      document.querySelectorAll(".dropdown.open").forEach((o) => { o.classList.remove("open"); o.dispatchEvent(new Event("repaint")); });
      dd.classList.toggle("open", willOpen);
      paint();
    });
    dd.addEventListener("repaint", paint);
    dd.querySelectorAll("[data-i]").forEach((b) => {
      b.addEventListener("click", () => {
        state[key] = +b.dataset.i;
        dd.classList.remove("open");
        paint();
        limite = POR_PAGINA;
        render();
      });
    });
    paint();
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".dropdown.open").forEach((o) => { o.classList.remove("open"); o.dispatchEvent(new Event("repaint")); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.dispatchEvent(new Event("click"));
  });

  const list = page.querySelector(".result-list");
  const more = page.querySelector("[data-more]");
  const empty = page.querySelector("[data-empty]");
  const summary = page.querySelector(".summary-row .results");
  const count = page.querySelector(".summary-row .count");
  const termos = semAcento(query).split(/\s+/).filter(Boolean);
  const textoBusca = new Map();

  function encontrados() {
    const genero = state.genero ? GENEROS.indexOf(FILTERS.genero.options[state.genero]) : -1;
    const minimo = FILTERS.nota.minimos[state.nota];
    const decada = FILTERS.ano.decadas[state.ano];
    const achados = [];
    for (const f of FILMES) {
      if (termos.length) {
        let t = textoBusca.get(f[0]);
        if (!t) {
          t = semAcento(`${f[1]} ${f[2]} ${f[3]}`);
          textoBusca.set(f[0], t);
        }
        if (!termos.every((x) => t.includes(x))) continue;
      }
      if (genero >= 0 && !f[4].includes(genero)) continue;
      if (minimo && (f[5] == null || f[5] * 2 < minimo)) continue;
      if (decada != null && Math.floor(f[3] / 10) * 10 !== decada) continue;
      achados.push(f);
    }
    if (!termos.length) return achados;
    // Títulos que começam com o termo buscado aparecem primeiro; o resto segue a ordem de popularidade
    const comeca = (f) => (semAcento(f[1]).startsWith(termos.join(" ")) || semAcento(f[2]).startsWith(termos.join(" ")) ? 0 : 1);
    return achados.map((f, i) => [comeca(f), i, f]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]);
  }

  function render() {
    const found = encontrados();
    summary.textContent = query ? `Resultados para “${query}”${found.length > 1 ? " e títulos relacionados" : ""}` : "Todos os filmes do catálogo, dos mais avaliados aos menos avaliados";
    count.textContent = `${found.length.toLocaleString("pt-BR")} ${found.length === 1 ? "filme encontrado" : "filmes encontrados"}`;
    list.hidden = !found.length;
    empty.hidden = !!found.length;
    empty.querySelector("[data-query]").textContent = query || "estes filtros";
    list.innerHTML = found.slice(0, limite).map((f) => `
      <article class="result">
        ${poster(f)}
        <div class="info">
          <h3>${esc(titulo(f))}</h3>
          <p class="meta">${esc(metadados(f))}</p>
          <p class="rating">★  ${notaComunidade(f)}</p>
        </div>
        <a class="btn" href="filme.html?id=${f[0]}">Ver filme</a>
        <button class="bookmark-btn" type="button" data-id="${f[0]}" aria-label="Salvar ${esc(titulo(f))}" aria-pressed="false">${icon("bookmark-20")}</button>
      </article>`).join("");
    more.hidden = found.length <= limite;
    more.textContent = `Mostrar mais filmes (${(found.length - limite).toLocaleString("pt-BR")} restantes)`;
    initBookmarks(list);
  }

  more.addEventListener("click", () => {
    limite += POR_PAGINA;
    render();
  });
  applyBtn.addEventListener("click", render);
  page.querySelector("[data-clear-filters]").addEventListener("click", () => {
    state.genero = state.nota = state.ano = 0;
    filtersEl.querySelectorAll(".dropdown").forEach((d) => d.dispatchEvent(new Event("repaint")));
    render();
  });
  page.querySelector("[data-edit-search]").addEventListener("click", () => {
    input.focus();
    input.select();
  });
  render();
}

// ---------- Filme e avaliação ----------
function initFilme() {
  const page = document.querySelector("[data-filme]");
  if (!page) return;
  const f = filme(param("id")) || filme(FILME_PADRAO);
  document.title = `${titulo(f)} · CineMatch`;
  page.querySelector(".page-title").textContent = titulo(f);
  page.querySelector(".page-desc").textContent = metadados(f, 2);
  page.querySelector("[data-poster]").outerHTML = posterGrande(f);
  page.querySelector(".community").innerHTML = `★ ${notaComunidade(f)} <span>/ 10</span>`;
  page.querySelector(".community").title = `Média de ${f[6]} avaliações no MovieLens`;
  page.querySelector(".movie-sheet .bookmark-btn").dataset.id = f[0];
  if (document.referrer.includes("resultados.html")) page.querySelector(".back-link").href = document.referrer;

  carregarDetalhes(f[0]).then((d) => {
    const bloco = page.querySelector(".synopsis-block");
    bloco.querySelector("h2").textContent = d.frase || "Sinopse";
    bloco.querySelector("p").textContent = d.sinopse || "Sinopse indisponível para este filme.";
    const creditos = [];
    if (d.direcao && d.direcao.length) creditos.push(`Direção: ${d.direcao.join(", ")}`);
    if (d.elenco && d.elenco.length) creditos.push(`Elenco: ${d.elenco.join(", ")}`);
    bloco.querySelector(".credits").textContent = creditos.join("    ·    ");
    bloco.querySelector(".credits").hidden = !creditos.length;
  });

  const form = page.querySelector("form[data-rating]");
  const stars = [...form.querySelectorAll(".star")];
  const value = form.querySelector(".stars .value");
  const textarea = form.querySelector("textarea");
  const counter = form.querySelector(".char-count");
  const enviar = form.querySelector("[type=submit]");
  const anterior = avaliacoes()[f[0]];
  let rating = anterior ? anterior.nota : 0;
  if (anterior) textarea.value = anterior.comentario || "";

  const paint = (n) => {
    stars.forEach((s, i) => s.classList.toggle("on", i < n));
    value.textContent = n ? "  " + fmt(n) : "  Escolha uma nota";
  };
  stars.forEach((s, i) => {
    s.addEventListener("click", () => {
      rating = i + 1;
      paint(rating);
      enviar.disabled = false;
    });
    s.addEventListener("mouseenter", () => paint(i + 1));
    s.addEventListener("focus", () => paint(i + 1));
  });
  form.querySelector(".stars").addEventListener("mouseleave", () => paint(rating));

  const count = () => { counter.textContent = `${textarea.value.length}/500`; };
  textarea.addEventListener("input", count);
  count();
  paint(rating);
  enviar.disabled = !rating;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!rating) return;
    const salvas = meus.get("avaliacoes", {});
    salvas[f[0]] = { nota: rating, comentario: textarea.value.trim(), data: hoje() };
    meus.set("avaliacoes", salvas);
    meus.set("ultimaAvaliacao", f[0]);
    window.location.href = "avaliacao-registrada.html";
  });
}

function initUltimaAvaliacao() {
  const ultima = ultimaAvaliacao();
  document.querySelectorAll("[data-ultimo-filme]").forEach((el) => { el.textContent = ultima ? titulo(ultima.f) : "Nenhum filme"; });
  document.querySelectorAll("[data-rating-echo]").forEach((el) => { el.textContent = ultima ? fmt(ultima.nota) : "–"; });
  const banner = document.querySelector(".vote-banner .msg");
  if (banner && !ultima) {
    banner.innerHTML = `${icon("vote-20")}Avalie um filme e depois escolha uma sugestão para a próxima sessão.`;
  }
}

// ---------- Sugestões ----------
function initSugestoes() {
  const root = document.querySelector("[data-colecoes]");
  if (!root) return;
  root.innerHTML = COLECOES.map((c, i) => `
    <article class="card collection">
      <div class="head">
        <span class="eyebrow">SUGESTÃO DA COMUNIDADE</span>
        <button class="bookmark-btn" type="button" data-id="colecao-${i}" aria-label="Salvar coleção" aria-pressed="false">${icon("bookmark-20")}</button>
      </div>
      <div class="mosaic">${c.filmes.slice(0, 4).map((id) => poster(filme(id))).join("")}</div>
      <div class="desc">
        <h3>${c.nome}</h3>
        <p>${c.texto}</p>
      </div>
      <div class="foot">
        <span>${c.votos} votos</span>
        <a class="btn" href="sugestao.html?c=${i}">Ver sugestão</a>
      </div>
    </article>`).join("");
  initBookmarks(root);
}

function initAccordion() {
  const root = document.querySelector("[data-accordion]");
  if (!root) return;
  let open = Math.min(Math.max(+param("c") || 0, 0), COLECOES.length - 1);
  const render = () => {
    root.innerHTML = COLECOES.map((c, i) => i === open ? `
      <section class="card expanded">
        <div class="top">
          <div>
            <h2>${i + 1}. ${c.nome}</h2>
            <p>${c.subtitulo}</p>
          </div>
          <div class="act">
            <a class="btn" href="votacao.html?c=${i}">Continuar para votação</a>
            <button class="bookmark-btn" type="button" data-id="colecao-${i}" aria-label="Salvar coleção" aria-pressed="false">${icon("bookmark-20")}</button>
          </div>
        </div>
        <div class="films">${c.filmes.map((id) => cartaoFilme(filme(id))).join("")}</div>
      </section>` : `
      <button class="collapsed" type="button" data-open="${i}" aria-expanded="false">
        <span>${i + 1}. ${c.nome}</span>${icon("chevron-right-20")}
      </button>`).join("");
    root.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => { open = +b.dataset.open; render(); }));
    initBookmarks(root);
  };
  render();
}

// ---------- Votação ----------
function initVote() {
  const form = document.querySelector("form[data-vote]");
  if (!form) return;
  const opcoes = form.querySelector(".vote-options");
  const escolhida = Math.min(Math.max(+param("c") || 0, 0), COLECOES.length - 1);
  opcoes.insertAdjacentHTML("beforeend", COLECOES.map((c, i) => `
    <label class="vote-option">
      <input type="radio" name="sugestao" value="${i}"${i === escolhida ? " checked" : ""}>
      <span class="radio"></span>
      <span class="body">
        <span class="title-row"><span class="name">Sugestão ${i + 1} · ${c.nome}</span><small>SELECIONADA</small></span>
        <span class="thumbs">${c.filmes.map((id) => poster(filme(id))).join("")}</span>
      </span>
    </label>`).join(""));

  const lead = document.querySelector("[data-choice]");
  const options = [...form.querySelectorAll(".vote-option")];
  const update = () => {
    options.forEach((o) => o.classList.toggle("selected", o.querySelector("input").checked));
    const i = +form.querySelector("input:checked").value;
    lead.textContent = `Você selecionou a Sugestão ${i + 1}: ${COLECOES[i].nome}.`;
  };
  form.addEventListener("change", update);
  update();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    meus.set("voto", +form.querySelector("input:checked").value);
    meus.set("dataVoto", hoje());
    meus.set("totalVotos", totalVotos() + 1);
    window.location.href = "voto-confirmado.html";
  });
}

function initVoteEcho() {
  const el = document.querySelector("[data-vote-echo]");
  if (!el) return;
  el.textContent = (COLECOES[votoAtual()] || COLECOES[0]).nome;
}

// ---------- Perfil e histórico ----------
function initPerfil() {
  const stats = document.querySelector("[data-stats]");
  if (!stats) return;
  const conta = usuarioAtual();
  const lista = listaAvaliacoes();
  const media = lista.reduce((s, a) => s + a.nota, 0) / (lista.length || 1);
  stats.querySelector("[data-avaliados]").textContent = lista.length;
  stats.querySelector("[data-votos]").textContent = totalVotos();
  stats.querySelector("[data-media]").textContent = lista.length ? fmt(media) : "–";

  const identidade = document.querySelector(".identity");
  identidade.querySelector(".avatar").textContent = iniciais(conta.nome);
  identidade.querySelector("strong").textContent = conta.nome;
  const email = identidade.querySelector("strong + span");
  email.textContent = conta.email || "";
  email.hidden = !conta.email;
  const [ano, mes] = conta.criadoEm.split("-").map(Number);
  document.querySelector(".member-since").textContent = `No CineMatch desde ${MESES[mes - 1]} de ${ano}.`;
}

function initHistorico() {
  const tabela = document.querySelector("[data-historico]");
  if (!tabela) return;
  const lista = listaAvaliacoes();
  const porPagina = 4;
  const paginas = Math.max(1, Math.ceil(lista.length / porPagina));
  let pagina = 1;
  const pager = document.querySelector("[data-paginas]");

  const render = () => {
    const inicio = (pagina - 1) * porPagina;
    tabela.querySelectorAll(".table-row, .table-empty").forEach((r) => r.remove());
    if (!lista.length) {
      tabela.insertAdjacentHTML("beforeend", `<p class="table-empty">Você ainda não avaliou nenhum filme. <a href="resultados.html">Explorar filmes →</a></p>`);
      document.querySelector("[data-contagem]").textContent = "Nenhuma avaliação";
      pager.innerHTML = "";
      return;
    }
    tabela.insertAdjacentHTML("beforeend", lista.slice(inicio, inicio + porPagina).map((a) => {
      const f = filme(a.id);
      return `
        <a class="table-row" href="avaliacao.html?id=${f[0]}">
          ${poster(f)}
          <div><h3>${esc(titulo(f))}</h3><p class="meta">${esc(metadados(f))}</p></div>
          <span class="score">★  ${fmt(a.nota)}</span>
          <span class="date">${dataPorExtenso(a.data)}</span>
          ${icon("chevron-right-20")}
        </a>`;
    }).join(""));
    document.querySelector("[data-contagem]").textContent =
      `Mostrando ${Math.min(porPagina, lista.length - inicio)} de ${lista.length} ${lista.length === 1 ? "avaliação" : "avaliações"}`;
    pager.innerHTML = `
      <a href="#" data-ir="${pagina - 1}"${pagina === 1 ? ' aria-disabled="true"' : ""}>← Anterior</a>
      ${Array.from({ length: paginas }, (_, i) => i + 1).map((n) => n === pagina
        ? `<span class="current" aria-current="page">${n}</span>`
        : `<a href="#" data-ir="${n}">${n}</a>`).join("")}
      <a href="#" data-ir="${pagina + 1}"${pagina === paginas ? ' aria-disabled="true"' : ""}>Próxima →</a>`;
    pager.querySelectorAll("[data-ir]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      const n = +a.dataset.ir;
      if (n >= 1 && n <= paginas) {
        pagina = n;
        render();
      }
    }));
  };
  render();

  const votadas = document.querySelector("[data-votadas]");
  const voto = votoAtual();
  const c = COLECOES[voto];
  votadas.insertAdjacentHTML("beforeend", c ? `
    <a class="table-row" href="sugestao.html?c=${voto}">
      ${poster(filme(c.filmes[0]))}
      <div><h3>${c.nome}</h3><p class="meta">${c.filmes.length} filmes · Sugestão da comunidade</p></div>
      <span class="score">Voto confirmado</span>
      <span class="date">${dataPorExtenso(meus.get("dataVoto", "2026-10-24"))}</span>
      ${icon("chevron-right-20")}
    </a>` : `<p class="table-empty">Você ainda não votou em nenhuma sugestão. <a href="sugestoes.html">Ver sugestões →</a></p>`);
}

function initDetalheAvaliacao() {
  const page = document.querySelector("[data-detalhe-avaliacao]");
  if (!page) return;
  const todas = avaliacoes();
  const lista = listaAvaliacoes();
  if (!lista.length) {
    window.location.replace("avaliacoes.html");
    return;
  }
  const id = todas[param("id")] ? +param("id") : lista[0].id;
  const f = filme(id);
  const a = todas[id];
  page.querySelector("[data-poster]").outerHTML = posterGrande(f);
  page.querySelector(".movie h2").textContent = titulo(f);
  page.querySelector(".movie .meta").textContent = metadados(f, 2);
  page.querySelector(".personal .head span").textContent = dataPorExtenso(a.data);
  page.querySelectorAll(".stars .star").forEach((s, i) => s.classList.toggle("on", i < a.nota));
  page.querySelector(".stars .value").textContent = "  " + fmt(a.nota);
  page.querySelector(".stars").setAttribute("aria-label", `Nota ${a.nota} de 5`);
  page.querySelector(".comment p").textContent = a.comentario ? `“${a.comentario}”` : "Você não escreveu um comentário para este filme.";
  page.querySelector("[data-editar]").href = `filme.html?id=${f[0]}`;
  carregarDetalhes(f[0]).then((d) => {
    page.querySelector(".movie .director").textContent = d.direcao && d.direcao.length ? `Direção de ${d.direcao.join(", ")}` : "";
  });
}

// ---------- Minhas avaliações: abas ----------
function initTabs() {
  const tabs = document.querySelectorAll("[data-tab]");
  if (!tabs.length) return;
  tabs.forEach((t) => t.addEventListener("click", () => {
    tabs.forEach((x) => {
      const on = x === t;
      x.classList.toggle("active", on);
      x.setAttribute("aria-selected", on);
      document.getElementById(x.dataset.tab).hidden = !on;
    });
    document.querySelector(".pagination").hidden = t.dataset.tab !== "aba-avaliacoes";
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  if (!initSessao()) return;
  renderChrome();
  renderIcons();
  initAuthForm();
  initSearchForm();
  if (typeof FILMES !== "undefined") {
    initInicio();
    initResults();
    initFilme();
    initUltimaAvaliacao();
    initSugestoes();
    initAccordion();
    initVote();
    initVoteEcho();
    initPerfil();
    initHistorico();
    initDetalheAvaliacao();
  }
  initTabs();
  initBookmarks();
});
