from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split
from surprise import accuracy

N_RECOMENDACOES = 5

def rodar_svd(movies, ratings, USER_ID, calculos):
    """
    Roda a Fatoração de Matrizes (SVD) para recomendar filmes para o usuário USER_ID.
    movies: DataFrame de filmes
    ratings: DataFrame de avaliações
    USER_ID: id do usuário-alvo
    calculos: dicionário com informações pré-calculadas
    Returning: DataFrame de recomendações
    """

    watched_ids = calculos['watched_ids']
    perfil_core_usuario = calculos['perfil_core_usuario']
    genero_por_filme = calculos['genero_por_filme']
    perfil_generos_usuario = calculos['perfil_generos_usuario']

    # Configuramos o leitor e carregamos os dados para o formato do Surprise
    reader = Reader(rating_scale=(0,5))
    data = Dataset.load_from_df(ratings[['userId', 'movieId', 'rating']], reader)
    
    # Construimos o trainset e o testset (20% dos dados para teste)
    trainset, testset = train_test_split(data, test_size=0.2, random_state=42)
    
    # Iniciamos e treinamos o modelo SVD
    model = SVD(n_factors=20, lr_all=0.01, reg_all=0.01, n_epochs=20, random_state=42)
    model.fit(trainset)

    # Avaliamos o modelo com metricas RMSE e MAE no conjunto de teste
    predictions = model.test(testset)
    rmse = accuracy.rmse(predictions)
    mae = accuracy.mae(predictions)

   # Filtramos os filmes que o usuário já viu
    candidatos_df = movies[~movies["movieId"].isin(watched_ids)]

    # Geramos as notas estimadas
    pontuacao_final = {
        row["movieId"]: model.predict(USER_ID, row["movieId"]).est
        for _, row in candidatos_df.iterrows()
    }

    # Filtramos candidatos pelo perfil de gênero do usuário
    # Se o candidato tiver o perfil core do usuário, ele é mantido; caso contrário, é descartado.
    if perfil_core_usuario:
        pontuacao_final = {
            movie_id: pontuacao
            for movie_id, pontuacao in pontuacao_final.items()
            if perfil_core_usuario.issubset(genero_por_filme.get(int(movie_id), set()))
        }

    # Selecionamos os top N_RECOMENDACOES filmes recomendados
    top_ids = sorted(pontuacao_final, key=pontuacao_final.get, reverse=True)[:N_RECOMENDACOES]

    # Montamos o DataFrame final de recomendações para retornar
    recomendados = movies[movies["movieId"].isin(top_ids)].copy()
    recomendados["nota_estimada"] = recomendados["movieId"].map(pontuacao_final)
    recomendados["generos_em_comum"] = recomendados["movieId"].apply(
        lambda mid: sorted(genero_por_filme.get(int(mid), set()) & perfil_generos_usuario)
    )
    recomendados = recomendados.sort_values("nota_estimada", ascending=False).reset_index(drop=True)

    return recomendados