"""
Gera o catálogo de filmes do site a partir da base do MovieLens usada no projeto.

- Filmes e gêneros: Projeto/Código + Base/movies_small.csv
- Notas da comunidade: Projeto/Código + Base/ratings_small.csv (média e quantidade de avaliações)
- Vínculo com o TMDB: ferramentas/links.csv (movieId -> tmdbId, do pacote ml-latest-small)
- Título em português, sinopse, duração, direção, elenco e pôster: API do TMDB

Uso:
    py gerar_catalogo.py              (busca os dados e os pôsteres no TMDB)
    py gerar_catalogo.py --sem-tmdb   (gera só com os dados do MovieLens e o cache já baixado)

A chave do TMDB é lida da variável de ambiente TMDB_API_KEY ou do arquivo Projeto/tmdb_chave.txt.
Aceita tanto a "Chave da API" (v3) quanto o "Token de leitura da API" (v4).
As respostas do TMDB ficam em ferramentas/cache_tmdb, então a execução pode ser interrompida e retomada.
"""

import csv
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

PASTA_FERRAMENTAS = os.path.dirname(os.path.abspath(__file__))
PASTA_SITE = os.path.dirname(PASTA_FERRAMENTAS)
PASTA_TCC = os.path.dirname(PASTA_SITE)
PASTA_BASE = os.path.join(PASTA_TCC, "Projeto", "Código + Base")

ARQUIVO_FILMES = os.path.join(PASTA_BASE, "movies_small.csv")
ARQUIVO_AVALIACOES = os.path.join(PASTA_BASE, "ratings_small.csv")
ARQUIVO_LINKS = os.path.join(PASTA_FERRAMENTAS, "links.csv")
ARQUIVO_CHAVE = os.path.join(PASTA_TCC, "Projeto", "tmdb_chave.txt")

PASTA_CACHE = os.path.join(PASTA_FERRAMENTAS, "cache_tmdb")
PASTA_POSTERES = os.path.join(PASTA_SITE, "img", "filmes")
PASTA_DETALHES = os.path.join(PASTA_SITE, "js", "detalhes")
ARQUIVO_CATALOGO = os.path.join(PASTA_SITE, "js", "catalogo.js")

TAMANHO_POSTER = "w185"  # largura dos pôsteres salvos no site (os cartões têm 175 px)
TAMANHO_FUNDO = "w1280"  # largura da imagem de fundo do destaque da página inicial
QTD_ARQUIVOS_DETALHES = 100  # os detalhes ficam divididos em arquivos menores, carregados sob demanda
THREADS = 8  # requisições simultâneas ao TMDB (o limite deles é de ~40 por segundo)
DESTAQUE = 109487  # movieId de Interstellar (2014), o filme em destaque na página inicial

# Gêneros do MovieLens traduzidos para o português, na ordem em que aparecem nos filtros do site
GENEROS = {
    "Action": "Ação",
    "Adventure": "Aventura",
    "Animation": "Animação",
    "Children": "Infantil",
    "Comedy": "Comédia",
    "Crime": "Crime",
    "Documentary": "Documentário",
    "Drama": "Drama",
    "Fantasy": "Fantasia",
    "Film-Noir": "Noir",
    "Horror": "Terror",
    "IMAX": "IMAX",
    "Musical": "Musical",
    "Mystery": "Mistério",
    "Romance": "Romance",
    "Sci-Fi": "Ficção científica",
    "Thriller": "Suspense",
    "War": "Guerra",
    "Western": "Faroeste",
}
ORDEM_GENEROS = list(GENEROS)


def ler_chave():
    chave = os.environ.get("TMDB_API_KEY", "").strip()
    if not chave and os.path.exists(ARQUIVO_CHAVE):
        with open(ARQUIVO_CHAVE, encoding="utf-8") as f:
            chave = f.read().strip()
    if not chave:
        raise SystemExit(
            "Chave do TMDB não encontrada. Salve-a em Projeto/tmdb_chave.txt "
            "ou defina a variável de ambiente TMDB_API_KEY."
        )
    return chave


def requisitar(url, chave, tentativas=5):
    """Faz uma requisição GET ao TMDB, repetindo quando o limite de requisições é atingido."""
    cabecalhos = {"Accept": "application/json"}
    if chave.startswith("eyJ"):  # token de leitura (v4)
        cabecalhos["Authorization"] = "Bearer " + chave
    else:  # chave da API (v3)
        url += ("&" if "?" in url else "?") + "api_key=" + chave

    for tentativa in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=cabecalhos), timeout=20) as r:
                return r.read()
        except urllib.error.HTTPError as erro:
            if erro.code == 404:
                return None
            if erro.code == 401:
                raise SystemExit("O TMDB recusou a chave (erro 401). Confira o conteúdo de Projeto/tmdb_chave.txt.")
            if erro.code == 429 or erro.code >= 500:
                time.sleep(2 * (tentativa + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            time.sleep(2 * (tentativa + 1))
    return None


def titulo_movielens(titulo):
    """Remove o ano e desfaz a inversão de artigos do MovieLens: 'American President, The (1995)' -> 'The American President'."""
    titulo = titulo.strip()
    ano = None
    if titulo.endswith(")") and "(" in titulo:
        inicio = titulo.rfind("(")
        trecho = titulo[inicio + 1:-1].strip()
        if trecho[:4].isdigit():
            ano = int(trecho[:4])
            titulo = titulo[:inicio].strip()
    for artigo in ("The", "A", "An", "Les", "La", "Le", "Il", "Das", "Die", "Der", "El", "L'"):
        sufixo = ", " + artigo
        if titulo.endswith(sufixo):
            titulo = artigo + (" " if not artigo.endswith("'") else "") + titulo[: -len(sufixo)]
            break
    return titulo, ano


def carregar_base():
    with open(ARQUIVO_FILMES, encoding="utf-8", newline="") as f:
        filmes = list(csv.DictReader(f))

    with open(ARQUIVO_LINKS, encoding="utf-8", newline="") as f:
        tmdb_por_filme = {int(l["movieId"]): int(l["tmdbId"]) for l in csv.DictReader(f) if l["tmdbId"]}

    soma, qtd = defaultdict(float), defaultdict(int)
    with open(ARQUIVO_AVALIACOES, encoding="utf-8", newline="") as f:
        for linha in csv.DictReader(f):
            mid = int(linha["movieId"])
            soma[mid] += float(linha["rating"])
            qtd[mid] += 1

    for filme in filmes:
        mid = int(filme["movieId"])
        filme["movieId"] = mid
        filme["tmdbId"] = tmdb_por_filme.get(mid)
        filme["media"] = soma[mid] / qtd[mid] if qtd[mid] else None
        filme["qtd"] = qtd[mid]
    return filmes


def buscar_detalhes(filme, chave):
    """Busca (ou lê do cache) os dados do filme no TMDB, já reduzidos ao que o site usa."""
    caminho = os.path.join(PASTA_CACHE, f"{filme['movieId']}.json")
    if chave is None:  # modo --sem-tmdb: usa o cache que existir, sem fazer requisições
        if os.path.exists(caminho):
            with open(caminho, encoding="utf-8") as f:
                return json.load(f)
        return {}
    if os.path.exists(caminho):
        with open(caminho, encoding="utf-8") as f:
            return json.load(f)

    dados = {}
    if filme["tmdbId"]:
        bruto = requisitar(
            f"https://api.themoviedb.org/3/movie/{filme['tmdbId']}?language=pt-BR&append_to_response=credits",
            chave,
        )
        if bruto:
            d = json.loads(bruto)
            sinopse = d.get("overview") or ""
            if not sinopse:  # sem sinopse em português: usa a em inglês
                bruto_en = requisitar(f"https://api.themoviedb.org/3/movie/{filme['tmdbId']}?language=en-US", chave)
                if bruto_en:
                    sinopse = json.loads(bruto_en).get("overview") or ""
            creditos = d.get("credits") or {}
            dados = {
                "titulo": d.get("title") or "",
                "original": d.get("original_title") or "",
                "sinopse": sinopse,
                "frase": d.get("tagline") or "",
                "duracao": d.get("runtime") or 0,
                "lancamento": d.get("release_date") or "",
                "poster": d.get("poster_path") or "",
                "fundo": d.get("backdrop_path") or "",
                "direcao": [p["name"] for p in creditos.get("crew", []) if p.get("job") == "Director"][:2],
                "elenco": [p["name"] for p in creditos.get("cast", [])[:3]],
            }

    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False)
    return dados


def baixar_imagem(caminho_tmdb, tamanho, destino):
    if not caminho_tmdb or os.path.exists(destino):
        return True
    if "--sem-tmdb" in sys.argv:
        return False
    for tentativa in range(4):
        try:
            with urllib.request.urlopen(f"https://image.tmdb.org/t/p/{tamanho}{caminho_tmdb}", timeout=30) as r:
                conteudo = r.read()
            with open(destino + ".tmp", "wb") as f:
                f.write(conteudo)
            os.replace(destino + ".tmp", destino)
            return True
        except Exception:
            time.sleep(2 * (tentativa + 1))
    return False


def em_paralelo(itens, funcao, rotulo):
    total, feitos = len(itens), 0
    resultados = {}
    with ThreadPoolExecutor(THREADS) as executor:
        futuros = {executor.submit(funcao, item): item for item in itens}
        for futuro in as_completed(futuros):
            resultados[futuros[futuro]["movieId"]] = futuro.result()
            feitos += 1
            if feitos % 250 == 0 or feitos == total:
                print(f"  {rotulo}: {feitos}/{total}", flush=True)
    return resultados


def main():
    chave = None if "--sem-tmdb" in sys.argv else ler_chave()
    for pasta in (PASTA_CACHE, PASTA_POSTERES, PASTA_DETALHES):
        os.makedirs(pasta, exist_ok=True)

    filmes = carregar_base()
    print(f"{len(filmes)} filmes em movies_small.csv ({sum(1 for f in filmes if f['tmdbId'])} com tmdbId)")

    print("Buscando dados no TMDB...")
    detalhes = em_paralelo(filmes, lambda f: buscar_detalhes(f, chave), "dados")

    print("Baixando pôsteres...")
    ok = em_paralelo(
        filmes,
        lambda f: baixar_imagem(detalhes[f["movieId"]].get("poster"), TAMANHO_POSTER,
                                os.path.join(PASTA_POSTERES, f"{f['movieId']}.jpg")),
        "pôsteres",
    )

    # Imagem de fundo do filme em destaque na página inicial
    baixar_imagem(detalhes[DESTAQUE].get("fundo"), TAMANHO_FUNDO, os.path.join(PASTA_POSTERES, f"fundo-{DESTAQUE}.jpg"))

    catalogo, por_arquivo = [], defaultdict(dict)
    for filme in filmes:
        mid = filme["movieId"]
        d = detalhes[mid]
        titulo_en, ano = titulo_movielens(filme["title"])
        if not ano and d.get("lancamento"):
            ano = int(d["lancamento"][:4])
        generos = [ORDEM_GENEROS.index(g) for g in filme["genres"].split("|") if g in GENEROS]
        tem_poster = bool(d.get("poster")) and ok[mid] and os.path.exists(os.path.join(PASTA_POSTERES, f"{mid}.jpg"))

        # [movieId, título em português, título original, ano, gêneros, média (0,5 a 5), nº de avaliações, duração, pôster local?, caminho do pôster no TMDB]
        catalogo.append([
            mid,
            d.get("titulo") or titulo_en,
            d.get("original") or titulo_en,
            ano or 0,
            generos,
            round(filme["media"], 2) if filme["media"] is not None else None,
            filme["qtd"],
            d.get("duracao") or 0,
            1 if tem_poster else 0,
            d.get("poster") or "",
        ])
        por_arquivo[mid % QTD_ARQUIVOS_DETALHES][mid] = {
            "sinopse": d.get("sinopse") or "",
            "frase": d.get("frase") or "",
            "direcao": d.get("direcao") or [],
            "elenco": d.get("elenco") or [],
            "fundo": d.get("fundo") or "",
            "tmdb": filme["tmdbId"] or 0,
        }

    # Do mais avaliado para o menos avaliado, que é a ordem padrão de exibição no site
    catalogo.sort(key=lambda f: (-f[6], f[1]))

    with open(ARQUIVO_CATALOGO, "w", encoding="utf-8") as f:
        f.write("// Gerado por ferramentas/gerar_catalogo.py a partir de movies_small.csv e ratings_small.csv — não editar à mão\n")
        f.write("const GENEROS = " + json.dumps([GENEROS[g] for g in ORDEM_GENEROS], ensure_ascii=False) + ";\n")
        f.write("const FILMES = [\n")
        f.write(",\n".join(json.dumps(item, ensure_ascii=False, separators=(",", ":")) for item in catalogo))
        f.write("\n];\n")

    for numero, grupo in por_arquivo.items():
        with open(os.path.join(PASTA_DETALHES, f"{numero}.js"), "w", encoding="utf-8") as f:
            f.write("Object.assign(DETALHES, " + json.dumps(grupo, ensure_ascii=False, separators=(",", ":")) + ");\n")

    sem_poster = sum(1 for f in catalogo if not f[8])
    print(f"Catálogo gerado: {len(catalogo)} filmes, {len(catalogo) - sem_poster} com pôster.")


if __name__ == "__main__":
    sys.exit(main())
