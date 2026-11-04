*** Settings ***
Documentation       Chamadas diretas à API de recomendação (KNN, SVD e NCF), sem passar pelo site.
...                 Só a rota 'recomendacoes' é chamada aqui: a rota 'avaliacoes' grava dados da pesquisa.

Resource            ../../../configs/base.resource

*** Keywords ***
Conectar na API de recomendação
    ${segundos}=    Convert Time    ${TIMEOUT_API}
    Create Session    apiRecomendacao    ${API_RECOMENDACAO}    timeout=${segundos}
    ...    headers=${{ {"Content-Type": "application/json"} }}

Pedir recomendações para as avaliações
    [Arguments]    ${avaliacoes}    ${expected_status}=200    ${timeout}=${None}
    ${corpo}=    Create Dictionary    avaliacoes=${avaliacoes}
    ${resposta}=    POST On Session    apiRecomendacao    /recomendacoes    json=${corpo}
    ...    expected_status=${expected_status}    timeout=${timeout}
    RETURN    ${resposta}

Pedir recomendações para o participante
    [Arguments]    ${chaveParticipante}
    ${avaliacoes}=    Montar Avaliacoes Do Participante    ${chaveParticipante}
    ${resposta}=    Pedir recomendações para as avaliações    ${avaliacoes}
    RETURN    ${resposta.json()}    ${avaliacoes}

## Caso 1 ##
Quando pedir recomendações com as avaliações de um participante
    ${avaliacoes}=    Montar Avaliacoes Do Participante    participante01
    ${resposta}=    Pedir recomendações para as avaliações    ${avaliacoes}
    Set Test Variable    ${respostaApi}    ${resposta}

Então a API deverá responder uma lista para cada algoritmo
    Should Be Equal As Integers    ${respostaApi.status_code}    200
    ${corpo}=    Set Variable    ${respostaApi.json()}
    FOR    ${algoritmo}    IN    @{ALGORITMOS}
        Dictionary Should Contain Key    ${corpo}    ${algoritmo}
        ${tipo}=    Evaluate    type($corpo[$algoritmo]).__name__
        Should Be Equal    ${tipo}    list    ${algoritmo}: deveria ser uma lista de movieIds
        ${todosInteiros}=    Evaluate    all(isinstance(i, int) for i in $corpo[$algoritmo])
        Should Be True    ${todosInteiros}    ${algoritmo}: a lista deveria conter só movieIds inteiros
    END

## Caso 2 ##
Então cada algoritmo deverá devolver o top 5 para todos os participantes
    @{participantes}=    Listar Participantes
    FOR    ${chave}    IN    @{participantes}
        ${corpo}    ${avaliacoes}=    Pedir recomendações para o participante    ${chave}
        FOR    ${algoritmo}    IN    @{ALGORITMOS}
            ${quantidade}=    Get Length    ${corpo}[${algoritmo}]
            Run Keyword And Continue On Failure
            ...    Should Be Equal As Integers    ${quantidade}    ${TOP_N_RECOMENDACOES}
            ...    ${chave} · ${algoritmo}: devolveu ${quantidade} filmes ${corpo}[${algoritmo}], o esperado é o top ${TOP_N_RECOMENDACOES}
        END
    END

## Caso 3 ##
Então as recomendações deverão ser válidas para todos os participantes
    @{participantes}=    Listar Participantes
    FOR    ${chave}    IN    @{participantes}
        ${corpo}    ${avaliacoes}=    Pedir recomendações para o participante    ${chave}
        ${idsAvaliados}=    Evaluate    list($avaliacoes.keys())
        FOR    ${algoritmo}    IN    @{ALGORITMOS}
            Run Keyword And Continue On Failure
            ...    Validar recomendações do algoritmo    ${chave} · ${algoritmo}    ${corpo}[${algoritmo}]    ${idsAvaliados}
        END
    END

## Caso 4 ##
Quando pedir duas vezes recomendações com as mesmas avaliações
    ${primeira}    ${avaliacoes}=    Pedir recomendações para o participante    participante04
    ${segunda}    ${avaliacoes}=    Pedir recomendações para o participante    participante04
    Set Test Variable    ${primeiraResposta}    ${primeira}
    Set Test Variable    ${segundaResposta}    ${segunda}

Então os algoritmos deverão devolver as mesmas recomendações
    FOR    ${algoritmo}    IN    @{ALGORITMOS}
        Run Keyword And Continue On Failure
        ...    Lists Should Be Equal    ${primeiraResposta}[${algoritmo}]    ${segundaResposta}[${algoritmo}]
        ...    ${algoritmo}: recomendações diferentes para as mesmas avaliações
    END

## Caso 5 ##
Quando pedir recomendações para participantes de gostos opostos
    ${recomendacoes}=    Create Dictionary
    FOR    ${chave}    IN    participante01    participante02    participante03
        ${corpo}    ${avaliacoes}=    Pedir recomendações para o participante    ${chave}
        Set To Dictionary    ${recomendacoes}    ${chave}=${corpo}
    END
    Set Test Variable    ${recomendacoesPorPerfil}    ${recomendacoes}

Então cada perfil deverá receber recomendações diferentes
    FOR    ${algoritmo}    IN    @{ALGORITMOS}
        ${ficcao}=    Set Variable    ${recomendacoesPorPerfil}[participante01][${algoritmo}]
        ${animacao}=    Set Variable    ${recomendacoesPorPerfil}[participante02][${algoritmo}]
        ${terror}=    Set Variable    ${recomendacoesPorPerfil}[participante03][${algoritmo}]
        Run Keyword And Continue On Failure    Should Not Be Equal    ${ficcao}    ${animacao}
        ...    ${algoritmo}: mesma recomendação para ficção científica e animação
        Run Keyword And Continue On Failure    Should Not Be Equal    ${animacao}    ${terror}
        ...    ${algoritmo}: mesma recomendação para animação e terror
        Run Keyword And Continue On Failure    Should Not Be Equal    ${ficcao}    ${terror}
        ...    ${algoritmo}: mesma recomendação para ficção científica e terror
    END

## Caso 6 ##
Quando pedir recomendações sem nenhuma avaliação
    ${status}    ${resultado}=    Run Keyword And Ignore Error
    ...    Pedir recomendações para as avaliações    ${{ {} }}    expected_status=any    timeout=15
    Set Test Variable    ${statusChamada}    ${status}
    Set Test Variable    ${resultadoChamada}    ${resultado}

Então a API deverá recusar a requisição sem travar
    Should Be Equal    ${statusChamada}    PASS    A API não respondeu em 15s a uma requisição sem avaliações: ${resultadoChamada}
    Should Be True    400 <= ${resultadoChamada.status_code} < 500
    ...    Esperava um erro 4xx para avaliações vazias, a API respondeu ${resultadoChamada.status_code}

## Caso 7 ##
Então as recomendações deverão responder em até 5 segundos
    @{participantes}=    Listar Participantes
    FOR    ${chave}    IN    @{participantes}
        ${avaliacoes}=    Montar Avaliacoes Do Participante    ${chave}
        ${resposta}=    Pedir recomendações para as avaliações    ${avaliacoes}
        ${segundos}=    Evaluate    $resposta.elapsed.total_seconds()
        Log    ${chave}: ${segundos}s
        Run Keyword And Continue On Failure    Should Be True    ${segundos} <= 5
        ...    ${chave}: a API levou ${segundos}s para recomendar
    END
