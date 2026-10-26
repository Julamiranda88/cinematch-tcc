import numpy as np
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors

N_RECOMENDACOES = 5
K_VIZINHOS = 20 # quantos usuários parecidos consideramos
SUPORTE_MINIMO = 3 # o filme precisa ter sido avaliado por pelo menos N vizinhos

def rodar_knn(movies, ratings, USER_ID, calculos):
    """
    Roda o algoritmo KNN para recomendar filmes para o usuário USER_ID.
    movies: DataFrame de filmes
    ratings: DataFrame de avaliações
    USER_ID: id do usuário-alvo 
    calculos: dicionário com informações pré-calculadas
    Returning: DataFrame de recomendações
    """

    watched_ids = calculos['watched_ids']
    perfil_generos_usuario = calculos['perfil_generos_usuario']
    perfil_core_usuario = calculos['perfil_core_usuario']
    genero_por_filme = calculos['genero_por_filme']

    # Converte a coluna de IDs de usuários para o tipo "category" do Pandas.
    # O Pandas mapeia automaticamente cada ID real para um número inteiro sequencial (começando do 0).
    user_ids = ratings["userId"].astype("category")
    movie_ids = ratings["movieId"].astype("category")

    # Extrai e guarda a lista ordenada dos IDs REAIS 
    # A posição numérica na matriz corresponde ao valor real guardado aqui.
    user_index = user_ids.cat.categories 
    movie_index = movie_ids.cat.categories 

    # Cria uma matriz com as notas
    matriz_avaliacoes = csr_matrix(
        (
            ratings["rating"],
            (user_ids.cat.codes, movie_ids.cat.codes),
        ),
        shape=(len(user_index), len(movie_index)),
    )

    # Pegamos a posição do usuário-alvo dentro da matriz
    user_pos = np.where(user_index == USER_ID)[0][0]

    # Configuramos o modelo de KNN 
    # Vamos usar a "similaridade de cosseno" para calcular a distância entre os vetores. 
    # Isso mede o ângulo entre os perfis de notas, focando nos gostos e ignorando se um usuário é mais "chato" ou "generoso" com as notas.
    knn = NearestNeighbors(metric="cosine", algorithm="brute")
    knn.fit(matriz_avaliacoes)

    # Pegamos os K_VIZINHOS vizinhos mais próximos do usuário-alvo
    distancias, indices = knn.kneighbors(
        matriz_avaliacoes[user_pos], n_neighbors=K_VIZINHOS + 1 
    )

    # Removemos o próprio usuário-alvo da lista de vizinhos
    vizinhos = [
        (idx, dist)
        for idx, dist in zip(indices[0], distancias[0])
        if idx != user_pos
    ]

    # Agregamos as notas dos vizinhos, ponderadas pela similaridade, para todos os filmes que o usuário-alvo ainda não viu.
    scores = {}
    soma_similaridades = {}
    contagem_vizinhos = {}  # Quantos vizinhos avaliaram cada filme (suporte)

    for idx_vizinho, dist in vizinhos:
        # Menores distâncias significam maior similaridade
        similaridade = 1 - dist
        if similaridade <= 0:
            continue

        # Transformamos as notas do vizinho atual de linha da matriz esparsa para um array plano
        notas_vizinho = matriz_avaliacoes[idx_vizinho].toarray().ravel()
        # Pegamos os índices dos filmes que este vizinho realmente avaliou (valores diferentes de zero)
        filmes_avaliados_pos = notas_vizinho.nonzero()[0]

        # Iteramos sobre cada filme avaliado pelo vizinho atual
        for pos_filme in filmes_avaliados_pos:
            movie_id = movie_index[pos_filme]
            
            # Descarta filmes que o usuário-alvo já assistiu
            if movie_id in watched_ids:
                continue

            nota = notas_vizinho[pos_filme]

            # Acumula a nota ponderada pela similaridade do vizinho (similaridade * nota)
            scores[movie_id] = scores.get(movie_id, 0) + similaridade * nota
            # Acumula a soma das similaridades dos vizinhos que avaliaram este filme (para a divisão da média ponderada)
            soma_similaridades[movie_id] = soma_similaridades.get(movie_id, 0) + similaridade
            # Incrementa o contador de quantos vizinhos avaliaram este filme específico (usado no filtro de suporte mínimo)
            contagem_vizinhos[movie_id] = contagem_vizinhos.get(movie_id, 0) + 1

    # Média ponderada: soma(similaridade * nota) / soma(similaridade)
    # Só consideramos filmes com suporte mínimo (evita recomendar algo que só
    # 1 vizinho avaliou, o que costuma gerar recomendações estranhas/obscuras)
    pontuacao_final = {
        movie_id: scores[movie_id] / soma_similaridades[movie_id]
        for movie_id in scores
        if contagem_vizinhos[movie_id] >= SUPORTE_MINIMO
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
    recomendados["qtd_vizinhos"] = recomendados["movieId"].map(contagem_vizinhos)
    recomendados["generos_em_comum"] = recomendados["movieId"].apply(
        lambda mid: sorted(genero_por_filme.get(int(mid), set()) & perfil_generos_usuario)
    )
    recomendados = recomendados.sort_values("nota_estimada", ascending=False)

    return recomendados