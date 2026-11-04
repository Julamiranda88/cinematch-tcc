*** Settings ***
Documentation       Keywords das telas de sugestões, filme recomendado, filmes avaliados e conclusão

Resource            ../../../configs/base.resource

*** Keywords ***
Aguardar recomendações dos algoritmos
    Wait For Elements State    ${sugestoesCardsOuErro} >> nth=0    visible    timeout=${TIMEOUT_API}
    ${erros}=    Get Element Count    css=[data-algoritmos] .erro
    IF    ${erros} > 0
        ${chamada}=    Obter Última Requisição Da API    recomendacoes
        Fail    A tela de sugestões mostrou erro. Resposta da API: ${chamada}[status] ${chamada}[resposta]
    END
    Get Element Count    ${sugestoesCards}    ==    3

Obter recomendações exibidas
    [Documentation]    movieIds que a tela mostra no card do algoritmo, na ordem exibida.
    [Arguments]    ${algoritmo}
    ${ids}=    Evaluate JavaScript    ${None}
    ...    () => [...document.querySelectorAll('.algo-card[data-alg="${algoritmo}"] a.algo-film')].map(a => Number(new URL(a.href).searchParams.get('id')))
    RETURN    ${ids}

Dar nota ao algoritmo
    [Documentation]    Enter na estrela N dá a nota inteira; a seta para a direita soma 0,5.
    [Arguments]    ${algoritmo}    ${nota}
    ${inteira}=    Evaluate    int(float($nota))
    ${temMeia}=    Evaluate    float($nota) - int(float($nota)) >= 0.5
    ${estrela}=    Set Variable    css=.algo-card[data-alg="${algoritmo}"] .scale-opt[data-nota="${inteira}"]
    Press Keys    ${estrela}    Enter
    IF    ${temMeia}    Press Keys    ${estrela}    ArrowRight
    ${notaFormatada}=    Formatar nota    ${nota}
    Get Text    css=.algo-card[data-alg="${algoritmo}"] [data-estado-nota]    ==    Sua nota: ${notaFormatada} de 5

Enviar avaliações dos algoritmos
    Get Element States    ${sugestoesEnviar_Button}    contains    enabled
    Click    ${sugestoesEnviar_Button}

Validar tela de conclusão
    Get Url    contains    concluido.html    timeout=${TIMEOUT_API}
    Get Text    ${concluidoTitulo_label}    ==    Avaliações enviadas!

## Caso 1 ##
Dado que o participante tenha avaliado menos filmes que o mínimo
    Criar massa de filmes avaliados    participante03    4
    Limpar Requisições Da API
    Acessar tela    sugestoes.html

Então deverá ver o aviso de que ainda não há sugestões
    Get Text    ${sugestoesMinimo_label}    ==    Ainda não temos sugestões para você!
    Wait For Elements State    ${sugestoesComparacao_area}    hidden
    ${chamadas}=    Obter Requisições Da API    recomendacoes
    Should Be Empty    ${chamadas}    O site não deveria chamar a API antes do mínimo de filmes
    Registrar evidência    minimo
    Click    ${sugestoesMinimoAvaliar_Button}
    Get Url    contains    resultados.html

## Caso 2 ##
Dado que o participante tenha avaliado o mínimo de filmes
    ${avaliacoes}=    Criar massa de filmes avaliados    participante01    ${MINIMO_FILMES}
    Set Test Variable    ${avaliacoesDoParticipante}    ${avaliacoes}

Quando abrir a tela de sugestões
    Limpar Requisições Da API
    Acessar tela    sugestoes.html
    Aguardar recomendações dos algoritmos

Então deverá ver as recomendações dos três algoritmos
    Get Text    ${sugestoesLiberadas_label}    ==    ✓ Sugestões liberadas · 5 filmes avaliados (mínimo: 5)
    Get Text    ${sugestoesPontoPartida_label}    ==    Seu ponto de partida · 5 dos 5 filmes avaliados
    Get Element Count    ${sugestoesFaixaFilmes}    ==    5
    FOR    ${algoritmo}    IN    @{ALGORITMOS}
        Get Text    css=.algo-card[data-alg="${algoritmo}"] h2    ==    ${NOME_ALGORITMO}[${algoritmo}]
        Get Text    css=.algo-card[data-alg="${algoritmo}"] [data-estado-nota]    ==    Sem nota
    END
    Registrar evidência    comparacao

E as recomendações exibidas deverão ser as devolvidas pelos algoritmos
    ${chamada}=    Obter Última Requisição Da API    recomendacoes
    Validar payload de recomendações enviado pelo site    ${chamada}[payload]    ${avaliacoesDoParticipante}
    Validar resposta dos algoritmos    ${chamada}    ${avaliacoesDoParticipante}

## Caso 3 ##
Dado que o participante esteja comparando as sugestões
    Criar massa de filmes avaliados    participante04    ${MINIMO_FILMES}
    Acessar tela    sugestoes.html
    Aguardar recomendações dos algoritmos

Quando avaliar os algoritmos um a um
    Get Text    ${sugestoesProgresso_label}    ==    0 de 3 algoritmos avaliados
    Get Text    ${sugestoesPendencia_label}    ==    Faltam as notas de KNN, SVD e Redes Neurais. Avalie os três para concluir.
    Get Element States    ${sugestoesEnviar_Button}    contains    disabled
    Dar nota ao algoritmo    knn    4
    Get Text    ${sugestoesProgresso_label}    ==    1 de 3 algoritmos avaliados
    Get Text    ${sugestoesPendencia_label}    ==    Faltam as notas de SVD e Redes Neurais. Avalie os três para concluir.
    Get Element States    ${sugestoesEnviar_Button}    contains    disabled
    Dar nota ao algoritmo    svd    2.5
    Get Text    ${sugestoesPendencia_label}    ==    Falta a nota de Redes Neurais. Avalie os três para concluir.
    Get Element States    ${sugestoesEnviar_Button}    contains    disabled
    Dar nota ao algoritmo    ncf    5

Então o envio deverá ser liberado só com os três algoritmos avaliados
    Get Text    ${sugestoesProgresso_label}    ==    3 de 3 algoritmos avaliados
    Get Text    ${sugestoesPendencia_label}    ==    Tudo pronto! Envie as três avaliações para concluir.
    Get Element States    ${sugestoesEnviar_Button}    contains    enabled
    Registrar evidência    tudo_pronto

## Caso 4 ##
Quando avaliar dois algoritmos e recarregar a página
    Dar nota ao algoritmo    knn    3.5
    Dar nota ao algoritmo    ncf    1
    Reload
    Aguardar recomendações dos algoritmos

Então as notas dadas deverão ser mantidas
    Get Text    css=.algo-card[data-alg="knn"] [data-estado-nota]    ==    Sua nota: 3,5 de 5
    Get Text    css=.algo-card[data-alg="svd"] [data-estado-nota]    ==    Sem nota
    Get Text    css=.algo-card[data-alg="ncf"] [data-estado-nota]    ==    Sua nota: 1,0 de 5
    Get Text    ${sugestoesProgresso_label}    ==    2 de 3 algoritmos avaliados

## Caso 5 ##
Quando abrir o primeiro filme recomendado pelo algoritmo
    [Arguments]    ${algoritmo}
    ${ids}=    Obter recomendações exibidas    ${algoritmo}
    Should Not Be Empty    ${ids}    O ${algoritmo} não exibiu recomendações
    Click    css=.algo-card[data-alg="${algoritmo}"] a.algo-film >> nth=0
    ${titulo}=    Obter Titulo Do Filme    ${ids}[0]
    Get Text    ${recomendadoTitulo_label}    ==    ${titulo}

Então a página deverá indicar o algoritmo de origem e voltar à comparação
    [Arguments]    ${algoritmo}
    Get Text    ${recomendadoPor_label}    ==    Recomendado por ${NOME_ALGORITMO}[${algoritmo}]
    Get Text    ${recomendadoAlgoritmo_label}    contains    ${NOME_ALGORITMO}[${algoritmo}]
    Get Text    ${recomendadoVoltar_Button}    ==    Voltar às sugestões · ${SIGLA_ALGORITMO}[${algoritmo}]
    Registrar evidência    recomendado_${algoritmo}
    Click    ${recomendadoVoltar_Button}
    Get Url    contains    sugestoes.html#${algoritmo}
    Aguardar recomendações dos algoritmos

## Caso 6 ##
Quando a API de recomendação falhar ao abrir as sugestões
    Simular Falha Da API    recomendacoes    500
    Acessar tela    sugestoes.html

Então deverá ver o erro com a opção de tentar novamente
    Get Text    ${sugestoesErro_label}    ==    Ops! Ocorreu um erro    timeout=${TIMEOUT_API}
    Wait For Elements State    ${sugestoesTentarNovamente_Button}    visible
    Registrar evidência    erro_api

E tentar novamente deverá carregar as sugestões quando a API voltar
    Remover Falhas Da API
    Click    ${sugestoesTentarNovamente_Button}
    Aguardar recomendações dos algoritmos

## Caso 7 ##
Dado que o participante tenha avaliado os três algoritmos
    Criar massa de filmes avaliados    participante05    ${MINIMO_FILMES}
    Criar massa de notas dos algoritmos    ${{ {"knn": 3, "svd": 4, "ncf": 2} }}
    Acessar tela    sugestoes.html
    Aguardar recomendações dos algoritmos

Quando o envio final falhar na API
    Simular Falha Da API    avaliacoes    500
    Enviar avaliações dos algoritmos

Então os dados da participação deverão ser mantidos para nova tentativa
    Get Text    ${sugestoesErro_label}    ==    Ops! Ocorreu um erro    timeout=${TIMEOUT_API}
    Get Url    contains    sugestoes.html
    ${avaliacoes}=    Obter avaliações guardadas no navegador
    Length Should Be    ${avaliacoes}    5
    ${notas}=    LocalStorage Get Item    cinematch:notasAlgoritmos
    Should Be Equal    ${{ json.loads($notas) }}    ${{ {"knn": 3, "svd": 4, "ncf": 2} }}

E tentar novamente deverá concluir o envio
    Remover Falhas Da API
    Click    ${sugestoesTentarNovamente_Button}
    Validar tela de conclusão
    ${chamada}=    Obter Última Requisição Da API    avaliacoes
    Should Be Equal    ${chamada}[payload]    ${{ {"avaliacoes": {"knn": 3, "svd": 4, "ncf": 2}, "quantidade_avaliados": 5} }}

## Caso 8 ##
Quando abrir Ver mais na comparação
    Click    ${sugestoesVerMais_Click}

Então deverá ver todos os filmes avaliados na participação
    Get Url    contains    avaliados.html
    Get Text    ${avaliadosResumo_label}    ==    5 filmes avaliados · Suas avaliações usadas na comparação de algoritmos.
    Get Element Count    ${avaliadosCards}    ==    5
    Get Text    css=.rated-grid .result-card:has(a[href="filme.html?id=858"]) .rating em    ==    ✓ Sua nota: 5,0
