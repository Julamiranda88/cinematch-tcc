*** Settings ***
Documentation       Testes diretos da API de recomendação (KNN, SVD e NCF), com os 10 perfis de participantes.
...                 Só a rota 'recomendacoes' é chamada: a rota 'avaliacoes' grava dados da pesquisa do TCC.

Resource            ../../configs/base.resource

Suite Setup         Conectar na API de recomendação
Suite Teardown      Delete All Sessions


*** Test Cases ***

Caso de Teste 01: API responde uma lista de filmes para cada algoritmo
    [Documentation]    A rota 'recomendacoes' devolve { knn: [...], svd: [...], ncf: [...] } com movieIds.
    [Tags]      CT01_ApiFormatoResposta
    Quando pedir recomendações com as avaliações de um participante
    Então a API deverá responder uma lista para cada algoritmo


Caso de Teste 02: Cada algoritmo devolve o top 5
    [Documentation]    Contrato do README: cada algoritmo devolve o top 5 de filmes para o participante.
    [Tags]      CT02_ApiTop5
    Então cada algoritmo deverá devolver o top 5 para todos os participantes


Caso de Teste 03: Recomendações válidas para os 10 participantes
    [Documentation]    Sem repetição, só filmes do catálogo do site e nenhum filme que o participante já avaliou.
    [Tags]      CT03_ApiRecomendacoesValidas
    Então as recomendações deverão ser válidas para todos os participantes


Caso de Teste 04: Mesmas avaliações geram as mesmas recomendações
    [Documentation]    Reprodutibilidade: a mesma entrada precisa gerar a mesma saída nos três algoritmos.
    [Tags]      CT04_ApiReprodutibilidade
    Quando pedir duas vezes recomendações com as mesmas avaliações
    Então os algoritmos deverão devolver as mesmas recomendações


Caso de Teste 05: Perfis de gosto diferentes recebem recomendações diferentes
    [Documentation]    Ficção científica, animação e terror não podem receber a mesma lista de um algoritmo.
    [Tags]      CT05_ApiPersonalizacao
    Quando pedir recomendações para participantes de gostos opostos
    Então cada perfil deverá receber recomendações diferentes


Caso de Teste 06: Requisição sem avaliações é recusada sem travar
    [Documentation]    Robustez: avaliações vazias devem gerar erro 4xx em até 15s.
    ...                Cada execução deixa a chamada aberta na API se ela travar; exclua com --exclude robustez.
    [Tags]      CT06_ApiAvaliacoesVazias    robustez
    Quando pedir recomendações sem nenhuma avaliação
    Então a API deverá recusar a requisição sem travar


Caso de Teste 07: Tempo de resposta das recomendações
    [Documentation]    Cada participante recebe as recomendações em até 5 segundos.
    [Tags]      CT07_ApiTempoResposta
    Então as recomendações deverão responder em até 5 segundos
