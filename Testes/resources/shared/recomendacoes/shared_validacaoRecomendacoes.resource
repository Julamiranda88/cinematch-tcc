*** Settings ***
Documentation       Validações dos algoritmos de recomendação, usadas pelos testes de tela e pelos testes de API

Resource            ../../../configs/base.resource

*** Keywords ***
Validar recomendações do algoritmo
    [Documentation]    Regras que toda lista devolvida por KNN, SVD ou NCF precisa cumprir.
    ...                Com ${exigirTopN}=True, exige exatamente o top N (contrato do README); sem isso, só alerta.
    [Arguments]    ${algoritmo}    ${recomendados}    ${idsAvaliados}    ${exigirTopN}=${False}
    Should Not Be Empty    ${recomendados}    ${algoritmo}: nenhuma recomendação devolvida
    List Should Not Contain Duplicates    ${recomendados}    ${algoritmo}: recomendou o mesmo filme mais de uma vez
    ${foraDoCatalogo}=    Filmes Fora Do Catalogo    ${recomendados}
    Should Be Empty    ${foraDoCatalogo}    ${algoritmo}: recomendou filmes que não existem no catálogo do site: ${foraDoCatalogo}
    ${jaAvaliados}=    Evaluate    [i for i in $recomendados if str(i) in {str(a) for a in $idsAvaliados}]
    Should Be Empty    ${jaAvaliados}    ${algoritmo}: recomendou filmes que o participante já avaliou: ${jaAvaliados}
    ${quantidade}=    Get Length    ${recomendados}
    IF    ${exigirTopN}
        Should Be Equal As Integers    ${quantidade}    ${TOP_N_RECOMENDACOES}
        ...    ${algoritmo}: devolveu ${quantidade} filmes, o esperado é o top ${TOP_N_RECOMENDACOES}
    ELSE
        Should Be True    ${quantidade} <= ${TOP_N_RECOMENDACOES}
        ...    ${algoritmo}: devolveu ${quantidade} filmes, mais que o top ${TOP_N_RECOMENDACOES}
        IF    ${quantidade} < ${TOP_N_RECOMENDACOES}
            Log    ${algoritmo}: devolveu só ${quantidade} de ${TOP_N_RECOMENDACOES} recomendações    WARN
        END
    END

Validar payload de recomendações enviado pelo site
    [Documentation]    O site precisa enviar à rota 'recomendacoes' exatamente as avaliações do participante.
    [Arguments]    ${payload}    ${avaliacoesEsperadas}
    Dictionary Should Contain Key    ${payload}    avaliacoes
    ${enviadas}=    Set Variable    ${payload}[avaliacoes]
    ${idsEnviados}=    Evaluate    sorted($enviadas.keys())
    ${idsEsperados}=    Evaluate    sorted(str(i) for i in $avaliacoesEsperadas.keys())
    Lists Should Be Equal    ${idsEnviados}    ${idsEsperados}    O site enviou filmes diferentes dos avaliados
    FOR    ${id}    IN    @{idsEsperados}
        Should Be Equal As Numbers    ${enviadas}[${id}][nota]    ${avaliacoesEsperadas}[${id}][nota]
        Should Be Equal    ${enviadas}[${id}][comentario]    ${avaliacoesEsperadas}[${id}][comentario]
        Should Match Regexp    ${enviadas}[${id}][data]    ^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$
    END

Validar resposta dos algoritmos
    [Documentation]    Confere a resposta da API e se a tela exibe, para cada algoritmo, os filmes devolvidos, na mesma ordem.
    [Arguments]    ${chamada}    ${avaliacoes}
    Should Be Equal As Integers    ${chamada}[status]    200    A API respondeu ${chamada}[status]: ${chamada}[resposta]
    ${resposta}=    Set Variable    ${chamada}[resposta]
    ${idsAvaliados}=    Evaluate    list($avaliacoes.keys())
    FOR    ${algoritmo}    IN    @{ALGORITMOS}
        Dictionary Should Contain Key    ${resposta}    ${algoritmo}    A resposta não trouxe o algoritmo ${algoritmo}
        Run Keyword And Continue On Failure
        ...    Validar recomendações do algoritmo    ${algoritmo}    ${resposta}[${algoritmo}]    ${idsAvaliados}
        ${esperados}=    Filtrar Filmes Do Catalogo    ${resposta}[${algoritmo}]
        ${exibidos}=    Obter recomendações exibidas    ${algoritmo}
        Lists Should Be Equal    ${exibidos}    ${esperados}
        ...    ${algoritmo}: a tela não exibe as recomendações devolvidas pela API
    END

Validar personalização entre participantes
    [Documentation]    Participantes com gostos diferentes não podem receber todos a mesma lista de um algoritmo.
    [Arguments]    ${recomendacoesPorParticipante}
    ${total}=    Get Length    ${recomendacoesPorParticipante}
    FOR    ${algoritmo}    IN    @{ALGORITMOS}
        ${listasDistintas}=    Evaluate
        ...    len({tuple(r.get($algoritmo, [])) for r in $recomendacoesPorParticipante.values()})
        Log    ${algoritmo}: ${listasDistintas} listas distintas para ${total} participantes
        Run Keyword And Continue On Failure
        ...    Should Be True    ${listasDistintas} > 1
        ...    ${algoritmo}: devolveu a mesma lista para todos os ${total} participantes (sem personalização)
    END
