*** Settings ***
Documentation       Processo principal do CineMatch com 10 participantes distintos: avaliar filmes pela busca,
...                 comparar as sugestões de KNN, SVD e Redes Neurais, avaliar cada algoritmo e concluir.
...                 Cada participante usa um contexto novo do browser (localStorage próprio) e um perfil de gosto
...                 diferente (data/participantes/participantes.json).

Resource            ../../configs/base.resource

Suite Setup         Iniciar ambiente CineMatch
Suite Teardown      Encerrar ambiente CineMatch


*** Test Cases ***

Caso de Teste 01: Dez participantes avaliam filmes e as sugestões dos algoritmos
    [Documentation]    Valida, para cada participante, o envio das avaliações à API, as recomendações devolvidas
    ...                (válidas e exibidas na tela) e o envio das notas dos algoritmos. Ao final, valida que os
    ...                algoritmos personalizam as recomendações entre os participantes e gera o relatório JSON.
    [Tags]      CT01_Participacao10Usuarios
    [Setup]    Limpar Requisições Da API
    Dado que 10 participantes distintos estejam prontos para participar
    Quando cada participante avaliar seus filmes e as sugestões dos algoritmos
    Então os algoritmos deverão personalizar as recomendações entre os participantes
    E o relatório da participação deverá ser gerado
