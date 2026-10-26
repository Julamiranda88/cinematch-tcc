import os
import pickle
import pandas as pd
from collections import Counter
import time
from knn import rodar_knn
from matriz_fatorizada import rodar_svd

CACHE_MODELO = "svd_model_cache.pkl"
CACHE_DADOS = "dados_processados.pkl"
CORE_GENERO_MIN_FRACAO = 0.6

ratings = None

def carregamento_dados():
    """
    Carrega os dados dos filmes e das avaliações.
    return: Lista de DataFrames (movies, ratings)
    """
    
    if os.path.exists(CACHE_DADOS):
        print("Carregando ratings e movies do cache local...")
        with open(CACHE_DADOS, "rb") as f:
            dados = pickle.load(f)
            movies = dados["movies"]
            ratings = dados["ratings"]
    else:
        print("Lendo arquivos CSV originais pela primeira vez...")
        movies = pd.read_csv("movies_small.csv")
        ratings = pd.read_csv("ratings_small.csv")
        
        with open(CACHE_DADOS, "wb") as f:
            pickle.dump({"movies": movies, "ratings": ratings}, f)
        print("Dados salvos em cache com sucesso!")

    return (movies, ratings)

def inserir_novo_usuario(novas_avaliacoes):
    global ratings
    """
    Insere um novo usuário no dataset de ratings, com suas avaliações.
    TODO: inserir no arquivo ratings.csv também.
    ratings: DataFrame de ratings atual
    novas_avaliacoes: lista de tuplas (movieId, rating)
    return: userId do novo usuário
    """

    novo_usuario_id = ratings["userId"].max() + 1
    timestamp = int(pd.Timestamp.now().timestamp())

    novos_registros = pd.DataFrame({
        "userId": [novo_usuario_id] * len(novas_avaliacoes),
        "movieId": [mid for mid, _ in novas_avaliacoes],
        "rating": [r for _, r in novas_avaliacoes],
        "timestamp": [timestamp] * len(novas_avaliacoes)
    })

    ratings = pd.concat([ratings, novos_registros], ignore_index=True)

    return novo_usuario_id

if __name__ == "__main__":

    print("Início do carregamento dos dados")
    start = time.time()

    movies, ratings = carregamento_dados()

    """
    Horror
    """
    USER_ID = inserir_novo_usuario([
        (2459, 5.0),  
        (148671, 5.0),  
        (168250, 4.5),  
        (168252, 5.0),  
        (162082, 4.0),  
    ])
    """
    Animacao

    USER_ID = inserir_novo_usuario([
        (364, 5.0),  
        (288513, 5.0),  
        (1, 4.5),  
        (1907, 5.0),  
        (52287, 4.0),  
    ])
    """

    if USER_ID not in ratings["userId"].unique():
        raise SystemExit(f"O usuário {USER_ID} não existe no dataset.")

    # Pegamos os filmes já avaliados pelo usuário-alvo
    user_ratings = ratings[ratings["userId"] == USER_ID].merge(movies, on="movieId")
    watched_ids = set(user_ratings["movieId"])

    print(f"\n===== Filmes avaliados pelo usuário {USER_ID} =====")
    print(
        user_ratings[["title", "genres", "rating"]]
        .sort_values("rating", ascending=False)
        .to_string(index=False)
    )

    # Criamos o perfil de gêneros do usuário: união de todos os gêneros dos filmes que ele avaliou
    perfil_generos_usuario = set()
    for genres_str in user_ratings["genres"]:
        if genres_str != "(no genres listed)":
            perfil_generos_usuario.update(genres_str.split("|"))

    print(f"\nPerfil de gêneros do usuário {USER_ID}: {sorted(perfil_generos_usuario)}")

    # Criamos o perfil "core": gêneros que aparecem em pelo menos CORE_GENERO_MIN_FRACAO dos
    # filmes avaliados -- captura a COMBINAÇÃO que define o gosto do usuário
    contagem_generos = Counter()
    for genres_str in user_ratings["genres"]:
        if genres_str != "(no genres listed)":
            contagem_generos.update(set(genres_str.split("|")))

    total_filmes_usuario = len(user_ratings)
    perfil_core_usuario = {
        genero
        for genero, qtd in contagem_generos.items()
        if qtd / total_filmes_usuario >= CORE_GENERO_MIN_FRACAO
    }

    print(f"Perfil de gêneros do usuário {USER_ID} (core, >= {CORE_GENERO_MIN_FRACAO:.0%} dos filmes): {sorted(perfil_core_usuario)}")

    # Conjunto de gêneros de cada filme
    movies["genres_set"] = movies["genres"].apply(
        lambda g: set(g.split("|")) if g != "(no genres listed)" else set()
    )
    genero_por_filme = {int(mid): genres for mid, genres in zip(movies["movieId"], movies["genres_set"])}

    calculos = {
        "watched_ids": watched_ids,
        "perfil_generos_usuario": perfil_generos_usuario,
        "perfil_core_usuario": perfil_core_usuario,
        "genero_por_filme": genero_por_filme
    }
    
    end = time.time()
    length = end - start
    print(f"Fim do carregamento dos dados ({length:.4f} segundos)")

    print("\nComeço KNN...")
    start = time.time()

    recomendacoes_knn = rodar_knn(movies, ratings, USER_ID, calculos)

    print(f"\n===== Top 5 filmes recomendados para o usuário {USER_ID} =====")
    print(recomendacoes_knn[["title", "genres", "nota_estimada", "qtd_vizinhos", "generos_em_comum"]].to_string(index=False))
    
    end = time.time()
    length = end - start
    print(f"\nFim do KNN... ({length:.4f} segundos)")

    print("\nComeço Matriz Fatorizada...")
    start = time.time()

    recomendacoes_svd = rodar_svd(movies, ratings, USER_ID, calculos)

    print(f"\n===== Top 5 filmes recomendados para o usuário {USER_ID} =====")
    print(recomendacoes_svd[["title", "genres", "nota_estimada", "generos_em_comum"]].to_string(index=False))
    
    end = time.time()
    length = end - start
    print(f"\nFim do Matriz Fatorizada... ({length:.4f} segundos)")