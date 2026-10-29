// CineMatch — componentes compartilhados e lógica das telas
// Os filmes vêm de js/catalogo.js (gerado de movies_small.csv / ratings_small.csv por ferramentas/gerar_catalogo.py)
// As recomendações vêm de js/recomendacoes.js (ponto de integração com os algoritmos)

const NAV_LINKS = [
  { id: "inicio", label: "Início", href: "index.html" },
  { id: "sugestoes", label: "Sugestões", href: "sugestoes.html" },
  { id: "sobre", label: "Sobre", href: "sobre.html" },
];

const MINIMO = 5; // filmes que o participante precisa avaliar para liberar as sugestões
const DESTAQUE = 109487; // Interstellar (2014)
const POR_PAGINA_RESULTADOS = 4;
const POR_PAGINA_AVALIADOS = 8;
const NA_FAIXA = 5; // filmes mostrados em "Seu ponto de partida"

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const DETALHES = {};
const FILME_POR_ID = new Map((typeof FILMES !== "undefined" ? FILMES : []).map((f) => [f[0], f]));

// ---------- Armazenamento no navegador ----------
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

const fmt = (n) => n.toFixed(1).replace(".", ",");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const semAcento = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const param = (nome) => new URLSearchParams(location.search).get(nome);
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

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

function preencherSinopse(bloco, id) {
  carregarDetalhes(id).then((d) => {
    bloco.querySelector("h2").textContent = d.frase || "Sinopse";
    bloco.querySelector("p").textContent = d.sinopse || "Sinopse indisponível para este filme.";
    const creditos = [];
    if (d.direcao && d.direcao.length) creditos.push(`Direção: ${d.direcao.join(", ")}`);
    if (d.elenco && d.elenco.length) creditos.push(`Elenco: ${d.elenco.join(", ")}`);
    const el = bloco.querySelector(".credits");
    el.textContent = creditos.join("    ·    ");
    el.hidden = !creditos.length;
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

// ---------- Participação: filmes avaliados e notas dos algoritmos ----------
// avaliacoes: { movieId: { nota: 1–5, comentario, data: "AAAA-MM-DDTHH:MM:SS" } }
const avaliacoes = () => store.get("avaliacoes", {});

// Filmes avaliados, do mais recente para o mais antigo
function listaAvaliacoes() {
  return Object.entries(avaliacoes())
    .filter(([id]) => filme(id))
    .map(([id, a]) => ({ id: +id, ...a }))
    .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);
}

const totalAvaliados = () => listaAvaliacoes().length;
const minimoAtingido = () => totalAvaliados() >= MINIMO;
const faltam = () => Math.max(0, MINIMO - totalAvaliados());

function registrarAvaliacao(id, nota, comentario) {
  const todas = avaliacoes();
  todas[id] = { nota, comentario, data: new Date().toISOString().slice(0, 19) };
  store.set("avaliacoes", todas);
  store.set("ultimaAvaliacao", id);
}

function ultimaAvaliacao() {
  const todas = avaliacoes();
  const id = store.get("ultimaAvaliacao", null);
  if (id && todas[id] && filme(id)) return { f: filme(id), nota: todas[id].nota };
  const recente = listaAvaliacoes()[0];
  return recente ? { f: filme(recente.id), nota: recente.nota } : null;
}

// Notas que o participante deu às recomendações de cada algoritmo: { knn: 1–5, svd: 1–5, ncf: 1–5 }
const notasAlgoritmos = () => store.get("notasAlgoritmos", {});

function dataPorExtenso(iso) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

// ---------- Ícones e estrutura comum ----------
function icon(name) {
  const def = ICONS[name];
  if (!def) return "";
  const [size, paths, altura = size] = def;
  return `<span class="icon" aria-hidden="true"><svg viewBox="0 0 ${size} ${altura}" xmlns="http://www.w3.org/2000/svg">${paths}</svg></span>`;
}

function renderIcons(root = document) {
  root.querySelectorAll("i[data-icon]").forEach((el) => {
    el.outerHTML = icon(el.dataset.icon);
  });
}

function renderChrome() {
  const header = document.querySelector("header[data-nav]");
  if (header) {
    const active = header.dataset.nav;
    header.className = "site-header app";
    header.innerHTML = `
      <a class="brand" href="index.html" aria-label="CineMatch — início">${icon("clapperboard-27")}<span>Cine<b>Match</b></span></a>
      <nav class="main-nav" aria-label="Navegação principal">
        ${NAV_LINKS.map((l) => `<a href="${l.href}"${l.id === active ? ' class="active" aria-current="page"' : ""}>${l.label}</a>`).join("")}
      </nav>`;
  }
  const footer = document.querySelector("footer[data-footer]");
  if (footer) {
    footer.className = "site-footer app";
    footer.innerHTML = "<span>CineMatch · Uma experiência completa para quem ama cinema.</span>";
  }
}

// Paginação com "Anterior", números e "Próxima"; chama irPara(n) ao trocar de página
function paginacao(el, pagina, paginas, irPara) {
  const numeros = [];
  const inicio = Math.max(1, Math.min(pagina - 2, paginas - 4));
  for (let n = inicio; n <= Math.min(paginas, inicio + 4); n++) numeros.push(n);
  el.innerHTML = `
    <button class="page-btn wide" type="button" data-ir="${pagina - 1}"${pagina <= 1 ? " disabled" : ""}>Anterior</button>
    ${numeros.map((n) => `<button class="page-btn${n === pagina ? " current" : ""}" type="button" data-ir="${n}"${n === pagina ? ' aria-current="page"' : ""}>${n}</button>`).join("")}
    <button class="page-btn wide" type="button" data-ir="${pagina + 1}"${pagina >= paginas ? " disabled" : ""}>Próxima</button>`;
  el.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => {
    const n = +b.dataset.ir;
    if (n >= 1 && n <= paginas && n !== pagina) irPara(n);
  }));
}

// ---------- Busca ----------
// Enter ou clique na lupa: com texto, abre os resultados; sem texto, abre a tela "Encontre seu próximo filme"
function initBusca() {
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
      if (q) window.location.href = "resultados.html?q=" + encodeURIComponent(q);
      else if (!form.hasAttribute("data-search-home")) input.focus();
      else window.location.href = "pesquisa.html";
    });
    sync();
  });
}

// ---------- Início ----------
function initInicio() {
  const resumo = document.querySelector("[data-resumo]");
  if (!resumo) return;
  const total = totalAvaliados();
  const ok = minimoAtingido();
  resumo.querySelector("[data-contagem]").textContent = ok
    ? `${plural(total, "filme avaliado", "filmes avaliados")} · mínimo: ${MINIMO}`
    : `${total} de ${MINIMO} filmes avaliados · ${faltam() === 1 ? "Falta 1" : `Faltam ${faltam()}`}`;
  resumo.querySelector("[data-estado]").textContent = ok ? "Sugestões liberadas" : "Mínimo ainda não atingido";
  resumo.querySelector(".progress-fill").style.width = `${Math.min(total / MINIMO, 1) * 100}%`;
  resumo.querySelectorAll(".resumo-acoes .btn").forEach((b) => {
    b.classList.toggle("disabled", !ok);
    if (!ok) {
      b.setAttribute("aria-disabled", "true");
      b.removeAttribute("href");
    }
  });

  const hero = document.querySelector("[data-destaque]");
  const f = filme(DESTAQUE);
  hero.querySelector("h2").textContent = titulo(f);
  hero.querySelector(".meta").innerHTML = `${f[3]}  ·  ${esc(generoPrincipal(f))}  ·  <span>★ ${notaComunidade(f)}</span>`;
  hero.querySelector(".btn").href = `filme.html?id=${f[0]}`;
  carregarDetalhes(f[0]).then((d) => { if (d.sinopse) hero.querySelector(".synopsis").textContent = d.sinopse; });
  const emAlta = document.querySelector(".trending");
  emAlta.innerHTML = FILMES.slice(0, 12).map(cartaoFilme).join("");
  // Mostra só os filmes que cabem em uma linha: 6 na largura do Figma (1280px), mais em telas largas
  const ajustarLinha = () => {
    const cards = [...emAlta.children];
    cards.forEach((c) => c.classList.remove("fora-da-linha"));
    if (getComputedStyle(emAlta).gridAutoRows !== "0px") return;
    const topo = cards[0].offsetTop;
    cards.forEach((c) => c.classList.toggle("fora-da-linha", c.offsetTop > topo));
  };
  ajustarLinha();
  window.addEventListener("resize", ajustarLinha);
}

// ---------- Resultados da pesquisa ----------
function opcoesDeFiltro() {
  const decadas = [...new Set(FILMES.map((f) => Math.floor(f[3] / 10) * 10).filter(Boolean))].sort((a, b) => b - a);
  return {
    genero: { label: "Gênero", options: ["Todos os gêneros", ...GENEROS.filter((g) => g !== "IMAX").slice().sort((a, b) => a.localeCompare(b, "pt"))] },
    nota: { label: "Melhor nota", options: ["Qualquer nota", "9 ou mais", "8 ou mais", "7 ou mais", "6 ou mais"], minimos: [0, 9, 8, 7, 6] },
    ano: { label: "Ano", options: ["Todos os anos", ...decadas.map((d) => `Anos ${d}`)], decadas: [null, ...decadas] },
  };
}

function initResultados() {
  const page = document.querySelector("[data-results]");
  if (!page) return;
  const FILTERS = opcoesDeFiltro();
  const query = (param("q") || "").trim();
  const input = page.querySelector(".search-bar input");
  input.value = query;
  input.dispatchEvent(new Event("input"));

  const state = { genero: 0, nota: 0, ano: 0 };
  let pagina = 1;
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
        pagina = 1;
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

  const grid = page.querySelector(".result-grid");
  const rodape = page.querySelector(".results-pagination");
  const empty = page.querySelector("[data-empty]");
  const summary = page.querySelector(".summary-row .results");
  const count = page.querySelector(".summary-row .count");
  const termos = semAcento(query).split(/\s+/).filter(Boolean);

  function encontrados() {
    const genero = state.genero ? GENEROS.indexOf(FILTERS.genero.options[state.genero]) : -1;
    const minimo = FILTERS.nota.minimos[state.nota];
    const decada = FILTERS.ano.decadas[state.ano];
    const achados = [];
    for (const f of FILMES) {
      if (termos.length) {
        const t = semAcento(`${f[1]} ${f[2]} ${f[3]}`);
        if (!termos.every((x) => t.includes(x))) continue;
      }
      if (genero >= 0 && !f[4].includes(genero)) continue;
      if (minimo && (f[5] == null || f[5] * 2 < minimo)) continue;
      if (decada != null && Math.floor(f[3] / 10) * 10 !== decada) continue;
      achados.push(f);
    }
    if (!termos.length) return achados;
    // Títulos que começam com o termo buscado aparecem primeiro; o resto segue a ordem de popularidade
    const frase = termos.join(" ");
    const comeca = (f) => (semAcento(f[1]).startsWith(frase) || semAcento(f[2]).startsWith(frase) ? 0 : 1);
    return achados.map((f, i) => [comeca(f), i, f]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]);
  }

  function render() {
    const found = encontrados();
    const paginas = Math.max(1, Math.ceil(found.length / POR_PAGINA_RESULTADOS));
    pagina = Math.min(pagina, paginas);
    const inicio = (pagina - 1) * POR_PAGINA_RESULTADOS;
    const visiveis = found.slice(inicio, inicio + POR_PAGINA_RESULTADOS);
    summary.textContent = query ? `Resultados para “${query}”${found.length > 1 ? " e títulos relacionados" : ""}` : "Todos os filmes do catálogo, dos mais avaliados aos menos avaliados";
    count.textContent = `${found.length.toLocaleString("pt-BR")} ${found.length === 1 ? "filme encontrado" : "filmes encontrados"}`;
    grid.hidden = rodape.hidden = !found.length;
    empty.hidden = !!found.length;
    empty.querySelector("[data-query]").textContent = query || "estes filtros";
    const notas = avaliacoes();
    grid.innerHTML = visiveis.map((f) => `
      <article class="result-card">
        ${poster(f)}
        <h3 title="${esc(titulo(f))}">${esc(titulo(f))}</h3>
        <p class="meta">${esc(metadados(f))}</p>
        <p class="rating">★ <span>${notaComunidade(f)}</span>${notas[f[0]] ? `<em>✓ Sua nota: ${fmt(notas[f[0]].nota)}</em>` : ""}</p>
        <a class="btn btn-primary btn-sm" href="filme.html?id=${f[0]}">${icon("arrow-right-20")}Ver detalhes</a>
      </article>`).join("");
    const n = (v) => v.toLocaleString("pt-BR");
    rodape.querySelector("[data-contagem]").textContent = found.length
      ? `${n(inicio + 1)}–${n(inicio + visiveis.length)} de ${n(found.length)} ${found.length === 1 ? "filme" : "filmes"} · ${POR_PAGINA_RESULTADOS} por página`
      : "";
    paginacao(rodape.querySelector(".pages-nav"), pagina, paginas, (n) => { pagina = n; render(); });
  }

  const limpar = () => {
    state.genero = state.nota = state.ano = 0;
    filtersEl.querySelectorAll(".dropdown").forEach((d) => d.dispatchEvent(new Event("repaint")));
    pagina = 1;
    render();
  };
  applyBtn.addEventListener("click", render);
  page.querySelectorAll("[data-clear-filters]").forEach((b) => b.addEventListener("click", limpar));
  page.querySelector("[data-edit-search]").addEventListener("click", () => {
    input.focus();
    input.select();
  });
  render();
}

// ---------- Filme: avaliar ou ver a avaliação registrada ----------
function initFilme() {
  const page = document.querySelector("[data-filme]");
  if (!page) return;
  const f = filme(param("id")) || filme(DESTAQUE);
  const registrada = avaliacoes()[f[0]];
  document.title = `${titulo(f)} · CineMatch`;
  page.querySelector(".page-title").textContent = titulo(f);
  page.querySelector(".page-desc").textContent = metadados(f, 2);
  page.querySelector("[data-poster]").outerHTML = posterGrande(f);
  page.querySelector(".community").innerHTML = `★ ${notaComunidade(f)} <span>/ 10</span>`;
  page.querySelector(".community").title = `Média de ${f[6]} avaliações no MovieLens`;
  if (document.referrer.includes("resultados.html")) page.querySelector(".back-link").href = document.referrer;
  preencherSinopse(page.querySelector(".synopsis-block"), f[0]);

  page.querySelector("[data-badge-avaliar]").hidden = !!registrada;
  page.querySelector("[data-badge-registrada]").hidden = !registrada;
  page.querySelector("[data-modo-avaliar]").hidden = !!registrada;
  page.querySelector("[data-modo-avaliado]").hidden = !registrada;
  page.classList.toggle("avaliado", !!registrada);
  if (registrada) mostrarAvaliacaoRegistrada(page, registrada);
  else iniciarFormularioDeNota(page, f);
}

function mostrarAvaliacaoRegistrada(page, a) {
  const bloco = page.querySelector("[data-modo-avaliado]");
  bloco.querySelectorAll(".rated-stars .star").forEach((s, i) => s.classList.toggle("on", i < a.nota));
  bloco.querySelector(".rated-value").innerHTML = `${fmt(a.nota)} <span>/ 5</span>`;
  bloco.querySelector(".rated-stars").setAttribute("aria-label", `Sua nota: ${a.nota} de 5`);
  const comentario = bloco.querySelector("[data-comentario]");
  comentario.textContent = a.comentario || "Você não escreveu um comentário para este filme.";
  comentario.classList.toggle("muted", !a.comentario);
  const total = totalAvaliados();
  bloco.querySelector("[data-minimo-titulo]").textContent = minimoAtingido()
    ? `✓ Você já avaliou ${total} filmes · Mínimo de cinco atendido`
    : `Você avaliou ${total} de ${MINIMO} filmes · ${faltam() === 1 ? "Falta 1 filme" : `Faltam ${faltam()} filmes`} para liberar as sugestões`;
  bloco.querySelector("[data-minimo-texto]").textContent = minimoAtingido()
    ? "Continue incluindo filmes ou compare as sugestões de KNN, SVD e Redes Neurais. Você dará uma nota independente para cada algoritmo."
    : "Continue incluindo filmes até completar cinco avaliações. Depois, compare as sugestões de KNN, SVD e Redes Neurais.";
}

function iniciarFormularioDeNota(page, f) {
  const form = page.querySelector("form[data-rating]");
  const stars = [...form.querySelectorAll(".star")];
  const value = form.querySelector(".stars .value");
  const textarea = form.querySelector("textarea");
  const counter = form.querySelector(".char-count");
  const enviar = form.querySelector("[type=submit]");
  let rating = 0;

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
  enviar.disabled = true;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!rating) return;
    registrarAvaliacao(f[0], rating, textarea.value.trim());
    window.location.href = "avaliacao-registrada.html";
  });
}

// ---------- Avaliação registrada ----------
function initRegistrada() {
  const page = document.querySelector("[data-registrada]");
  if (!page) return;
  const ultima = ultimaAvaliacao();
  const total = totalAvaliados();
  const ok = minimoAtingido();
  const filmeENota = ultima ? `${titulo(ultima.f)} · Sua nota: ${fmt(ultima.nota)}. ` : "";
  page.querySelector("[data-guia-titulo]").textContent = ok ? "Próxima etapa · Avaliar sugestões" : "Continue avaliando filmes";
  page.querySelector("[data-guia-texto]").textContent = ok
    ? `${filmeENota}Você já avaliou ${total} filmes e atingiu o mínimo de cinco. Agora suas sugestões estão liberadas para comparação e avaliação dos algoritmos.`
    : `${filmeENota}Você avaliou ${total} de ${MINIMO} filmes. ${faltam() === 1 ? "Falta 1 filme" : `Faltam ${faltam()} filmes`} para liberar as sugestões.`;
  page.querySelector("[data-acoes-liberadas]").hidden = !ok;
  page.querySelector("[data-acoes-pendentes]").hidden = ok;
}

// ---------- Sugestões: comparar e avaliar os algoritmos ----------
function initSugestoes() {
  const page = document.querySelector("[data-sugestoes]");
  if (!page) return;
  const ok = minimoAtingido();
  page.querySelector("[data-minimo]").hidden = ok;
  page.querySelector("[data-comparacao]").hidden = !ok;
  document.querySelector("main").classList.toggle("sem-minimo", !ok);
  if (!ok) return;

  const lista = listaAvaliacoes();
  const total = lista.length;
  page.querySelector("[data-ponto-partida]").textContent = `Seu ponto de partida · ${Math.min(NA_FAIXA, total)} dos ${total} filmes avaliados`;
  page.querySelector("[data-ver-mais]").textContent = `Ver mais (${total}) →`;
  page.querySelector("[data-faixa]").innerHTML = lista.slice(0, NA_FAIXA).map((a) => {
    const f = filme(a.id);
    return `
      <a class="mini-film" href="filme.html?id=${f[0]}">
        ${poster(f)}
        <span><strong title="${esc(titulo(f))}">${esc(titulo(f))}</strong><small>★ ${fmt(a.nota)}</small></span>
      </a>`;
  }).join("");
  page.querySelector("[data-liberadas]").textContent = `✓ Sugestões liberadas · ${plural(total, "filme avaliado", "filmes avaliados")} (mínimo: ${MINIMO})`;

  const recomendacoes = obterRecomendacoes(avaliacoes());
  const cards = page.querySelector("[data-algoritmos]");
  cards.innerHTML = ALGORITMOS.map((alg) => `
    <section class="algo-card" id="${alg.id}" data-alg="${alg.id}">
      <div class="algo-info">
        <h2>${alg.nome}</h2>
        <strong>${alg.metodo}</strong>
        <p>${alg.descricao}</p>
      </div>
      <div class="algo-films">
        ${(recomendacoes[alg.id] || []).map(filme).filter(Boolean).map((f) => `
          <a class="algo-film" href="recomendado.html?id=${f[0]}&alg=${alg.id}">
            ${poster(f)}
            <span title="${esc(titulo(f))}">${esc(titulo(f))}</span>
          </a>`).join("")}
      </div>
      <div class="algo-rating">
        <div class="algo-question">
          <span>Como ${alg.sigla || alg.nome} recomendou?</span>
          <small data-estado-nota>Sem nota</small>
        </div>
        <div class="scale" role="radiogroup" aria-label="Nota para as recomendações do ${alg.nome}">
          ${[1, 2, 3, 4, 5].map((n) => `
            <button class="scale-opt" type="button" role="radio" aria-checked="false" data-nota="${n}" aria-label="${n} de 5">
              ${icon("rating-star-25")}<span>${n}</span>
            </button>`).join("")}
        </div>
      </div>
    </section>`).join("");

  const enviar = page.querySelector("[data-enviar]");
  const progresso = page.querySelector("[data-progresso]");
  const pendencia = page.querySelector("[data-pendencia]");

  function pintar() {
    const notas = notasAlgoritmos();
    cards.querySelectorAll(".algo-card").forEach((card) => {
      const n = notas[card.dataset.alg] || 0;
      card.querySelectorAll(".scale-opt").forEach((b) => {
        const v = +b.dataset.nota;
        b.classList.toggle("on", v <= n);
        b.setAttribute("aria-checked", v === n);
      });
      const estado = card.querySelector("[data-estado-nota]");
      estado.textContent = n ? `Sua nota: ${n} de 5` : "Sem nota";
      estado.classList.toggle("accent", !!n);
    });
    const faltando = ALGORITMOS.filter((a) => !notas[a.id]);
    const feitos = ALGORITMOS.length - faltando.length;
    progresso.textContent = `${feitos} de ${ALGORITMOS.length} algoritmos avaliados`;
    if (!faltando.length) pendencia.textContent = "Tudo pronto! Envie as três avaliações para concluir.";
    else {
      const nomes = faltando.map((a) => a.nome);
      const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}` : nomes[0];
      pendencia.textContent = `${faltando.length > 1 ? "Faltam as notas de" : "Falta a nota de"} ${lista}. Avalie os três para concluir.`;
    }
    enviar.disabled = faltando.length > 0;
    enviar.classList.toggle("btn-primary", !faltando.length);
  }

  cards.querySelectorAll(".algo-card").forEach((card) => {
    const opcoes = [...card.querySelectorAll(".scale-opt")];
    opcoes.forEach((b) => {
      b.addEventListener("click", () => {
        const notas = notasAlgoritmos();
        notas[card.dataset.alg] = +b.dataset.nota;
        store.set("notasAlgoritmos", notas);
        pintar();
      });
      b.addEventListener("mouseenter", () => opcoes.forEach((o) => o.classList.toggle("hover", +o.dataset.nota <= +b.dataset.nota)));
    });
    card.querySelector(".scale").addEventListener("mouseleave", () => opcoes.forEach((o) => o.classList.remove("hover")));
  });

  enviar.addEventListener("click", () => {
    const notas = notasAlgoritmos();
    if (ALGORITMOS.some((a) => !notas[a.id])) return;
    // Cada envio guarda as notas dos algoritmos e os filmes avaliados nesta participação
    const envios = store.get("envios", []);
    envios.push({ data: new Date().toISOString(), notasAlgoritmos: notas, avaliacoes: avaliacoes(), recomendacoes: obterRecomendacoes(avaliacoes()) });
    store.set("envios", envios);
    store.set("notasAlgoritmos", {});
    window.location.href = "concluido.html";
  });
  pintar();

  if (location.hash) {
    const alvo = document.querySelector(location.hash);
    if (alvo) alvo.scrollIntoView({ block: "center" });
  }
}

// ---------- Filme recomendado: retorno ao algoritmo de origem ----------
function initRecomendado() {
  const page = document.querySelector("[data-recomendado]");
  if (!page) return;
  const alg = ALGORITMOS.find((a) => a.id === param("alg")) || ALGORITMOS[0];
  const f = filme(param("id")) || filme(obterRecomendacoes(avaliacoes())[alg.id][0]);
  const voltar = `sugestoes.html#${alg.id}`;
  const sigla = alg.sigla || alg.nome;
  document.title = `${titulo(f)} · Recomendado por ${alg.nome} · CineMatch`;
  page.querySelectorAll("[data-voltar]").forEach((a) => { a.href = voltar; });
  page.querySelector("[data-voltar-link]").textContent = `← Voltar às sugestões · ${sigla}`;
  page.querySelector("[data-voltar-botao]").textContent = `Voltar às sugestões · ${sigla}`;
  page.querySelector("[data-recomendado-por]").textContent = `Recomendado por ${alg.nome}`;
  page.querySelector(".page-title").textContent = titulo(f);
  page.querySelector("[data-genero]").textContent = generosDe(f).slice(0, 2).join(", ") || "Sem gênero";
  page.querySelector("[data-poster]").outerHTML = posterGrande(f);
  page.querySelector("[data-nota-catalogo]").innerHTML = `★ ${notaComunidade(f)} <span>/ 10 · Nota do catálogo</span>`;
  page.querySelector("[data-genero-valor]").textContent = generoPrincipal(f);
  page.querySelector("[data-nota-valor]").textContent = `★ ${notaComunidade(f)} / 10`;
  page.querySelector("[data-algoritmo]").textContent = `${alg.nome} · ${alg.metodo}`;
  page.querySelector("[data-como-recomenda]").textContent = alg.explicacao;
  page.querySelector("[data-orientacao]").textContent = `A nota é para as recomendações do ${sigla}.`;
  page.querySelector("[data-explicacao]").textContent =
    `A nota ${notaComunidade(f)} é do filme no catálogo. Para avaliar o quanto as sugestões do ${sigla} combinam com você, volte à comparação e use as cinco estrelas do algoritmo.`;
}

// ---------- Filmes avaliados desta participação ----------
function initAvaliados() {
  const page = document.querySelector("[data-avaliados]");
  if (!page) return;
  const lista = listaAvaliacoes();
  const total = lista.length;
  page.querySelector("[data-resumo-participacao]").textContent =
    `${plural(total, "filme avaliado", "filmes avaliados")} · Suas avaliações usadas na comparação de algoritmos.`;
  const grade = page.querySelector(".rated-grid");
  const rodape = page.querySelector(".rated-pagination");
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA_AVALIADOS));
  let pagina = 1;

  function render() {
    const inicio = (pagina - 1) * POR_PAGINA_AVALIADOS;
    const visiveis = lista.slice(inicio, inicio + POR_PAGINA_AVALIADOS);
    grade.innerHTML = total ? visiveis.map((a) => {
      const f = filme(a.id);
      return `
        <a class="rated-card" href="filme.html?id=${f[0]}">
          ${poster(f)}
          <strong title="${esc(titulo(f))}">${esc(titulo(f))}</strong>
          <span class="genre">${generoPrincipal(f)}</span>
          <span class="mine" title="Avaliado em ${dataPorExtenso(a.data)}">★ Sua nota: ${fmt(a.nota)}</span>
        </a>`;
    }).join("") : `<p class="table-empty">Você ainda não avaliou nenhum filme. <a href="pesquisa.html">Avaliar filmes →</a></p>`;
    rodape.hidden = !total;
    rodape.querySelector("[data-contagem]").textContent = `${inicio + 1}–${inicio + visiveis.length} de ${plural(total, "filme", "filmes")}`;
    paginacao(rodape.querySelector(".pages-nav"), pagina, paginas, (n) => { pagina = n; render(); window.scrollTo(0, 0); });
  }
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  renderChrome();
  renderIcons();
  initBusca();
  if (typeof FILMES !== "undefined") {
    initInicio();
    initResultados();
    initFilme();
    initRegistrada();
    initSugestoes();
    initRecomendado();
    initAvaliados();
  }
});
