import json
from pathlib import Path

ARQUIVO = Path(__file__).resolve().parent.parent / "data" / "participantes" / "participantes.json"


def _carregar():
    with open(ARQUIVO, encoding="utf-8") as f:
        return json.load(f)


def factory_participante(chave):
    """Devolve o participante de teste (nome, perfil, filmes a avaliar e notas dos algoritmos)."""
    return _carregar()[chave]


def listar_participantes():
    """Chaves de todos os participantes de teste, na ordem do arquivo."""
    return list(_carregar().keys())


def montar_avaliacoes_do_participante(chave, quantidade=None):
    """Monta o objeto de avaliações no mesmo formato que o site guarda no localStorage
    e envia à rota 'recomendacoes': { movieId: { nota, comentario, data } }."""
    filmes = _carregar()[chave]["filmes"]
    if quantidade is not None:
        filmes = filmes[: int(quantidade)]
    return {
        str(f["id"]): {"nota": f["nota"], "comentario": f["comentario"], "data": f"2026-01-01T10:00:{i:02d}"}
        for i, f in enumerate(filmes)
    }
