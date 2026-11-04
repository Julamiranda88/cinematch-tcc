*** Settings ***
Documentation       Keywords do processo principal com vários participantes

Resource            ../../../configs/base.resource

*** Keywords ***
Executar participação completa
    [Documentation]    Um participante do início ao fim, em um contexto novo do browser.
    [Arguments]    ${chave}    ${participante}
    Log    ${chave}: ${participante}[nome] · ${participante}[perfil]    console=True
    Iniciar sessão de novo participante
    TRY
        Validar progresso no início    0 de ${MINIMO_FILMES} filmes avaliados · Faltam ${MINIMO_FILMES}    Mínimo ainda não atingido
        Avaliar filmes do participante pela busca    ${participante}
        ${avaliacoesEsperadas}=    Avaliações esperadas do participante    ${participante}
        ${recomendacoes}=    Comparar e avaliar as sugestões do participante    ${participante}    ${avaliacoesEsperadas}
        Set To Dictionary    ${recomendacoesPorParticipante}    ${chave}=${recomendacoes}
        Concluir participação    ${participante}
    EXCEPT    AS    ${erro}
        Run Keyword And Ignore Error    Registrar evidência    ${participante}[nome]_falha
        Fail    ${chave} (${participante}[nome]): ${erro}
    FINALLY
        Close Context    CURRENT
    END

## Caso 1 ##
Dado que 10 participantes distintos estejam prontos para participar
    @{chaves}=    Listar Participantes
    Length Should Be    ${chaves}    10
    ${participantes}=    Create Dictionary
    FOR    ${chave}    IN    @{chaves}
        ${participante}=    Factory Participante    ${chave}
        Set To Dictionary    ${participantes}    ${chave}=${participante}
    END
    ${perfis}=    Evaluate    {p["perfil"] for p in $participantes.values()}
    Length Should Be    ${perfis}    10    Os 10 participantes precisam ter perfis de gosto distintos
    ${recomendacoes}=    Create Dictionary
    Set Test Variable    ${participantes}
    Set Test Variable    ${recomendacoesPorParticipante}    ${recomendacoes}

Quando cada participante avaliar seus filmes e as sugestões dos algoritmos
    FOR    ${chave}    ${participante}    IN    &{participantes}
        Run Keyword And Continue On Failure    Executar participação completa    ${chave}    ${participante}
    END
    ${concluidos}=    Get Length    ${recomendacoesPorParticipante}
    Log    ${concluidos} de 10 participantes chegaram às sugestões    console=True

Então os algoritmos deverão personalizar as recomendações entre os participantes
    ${concluidos}=    Get Length    ${recomendacoesPorParticipante}
    Should Be True    ${concluidos} >= 2    Menos de dois participantes chegaram às sugestões; não há o que comparar
    Validar personalização entre participantes    ${recomendacoesPorParticipante}

E o relatório da participação deverá ser gerado
    ${concluidos}=    Evaluate    {k: v for k, v in $participantes.items() if k in $recomendacoesPorParticipante}
    Gerar relatório da participação    ${concluidos}    ${recomendacoesPorParticipante}
    File Should Exist    ${OUTPUT DIR}/relatorio_participacao.json
