import json
from pathlib import Path

# Catálogo usado pelo site: cada linha de Site/js/catalogo.js que começa com "[" é um filme em JSON
# [movieId, título, título original, ano, gêneros, média 0,5–5, nº de avaliações, duração, pôster local?, pôster TMDB]
ARQUIVO = Path(__file__).resolve().parents[2] / "Site" / "js" / "catalogo.js"

_filmes = None


def _catalogo():
    global _filmes
    if _filmes is None:
        _filmes = {}
        with open(ARQUIVO, encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip().rstrip(",")
                if linha.startswith("[") and not linha.startswith("[]"):
                    filme = json.loads(linha)
                    _filmes[filme[0]] = filme
    return _filmes


def filme_existe_no_catalogo(movie_id):
    return int(movie_id) in _catalogo()


def obter_titulo_do_filme(movie_id):
    return _catalogo()[int(movie_id)][1]


def filtrar_filmes_do_catalogo(ids):
    """Mesmo filtro que o site aplica antes de exibir as recomendações: (ids).map(filme).filter(Boolean)."""
    return [int(i) for i in ids if int(i) in _catalogo()]


def filmes_fora_do_catalogo(ids):
    return [i for i in ids if int(i) not in _catalogo()]


def titulos_dos_filmes(ids):
    """[{id, titulo}] na mesma ordem; titulo None para filme fora do catálogo."""
    return [{"id": int(i), "titulo": _catalogo()[int(i)][1] if int(i) in _catalogo() else None} for i in ids]


def filmes_populares(quantidade=20):
    """Filmes mais avaliados do catálogo (é a ordem do arquivo). Usado pela API simulada."""
    return list(_catalogo().keys())[: int(quantidade)]
