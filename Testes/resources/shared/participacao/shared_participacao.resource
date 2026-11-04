*** Settings ***
Documentation       Fluxo completo de participação de um participante, do início à conclusão, pela interface

Resource            ../../../configs/base.resource

*** Keywords ***
Avaliar filmes do participante pela busca
    [Documentation]    Para cada filme: pesquisa pelo título, abre os detalhes, dá a nota (e o comentário, se houver),
    ...                envia e confere a confirmação. Do quinto filme em diante a confirmação libera as sugestões.
    [Arguments]    ${participante}
    ${filmes}=    Set Variable    ${participante}[filmes]
    ${total}=    Get Length    ${filmes}
    FOR    ${indice}    ${filme}    IN ENUMERATE    @{filmes}    start=1
        Pesquisar filme    ${filme}[busca]
        Abrir detalhes do filme nos resultados    ${filme}[id]
        Dar nota ao filme    ${filme}[nota]
        IF    $filme["comentario"]    Escrever comentário do filme    ${filme}[comentario]
        Enviar avaliação do filme
        Validar confirmação da avaliação    ${filme}[id]    ${filme}[nota]    ${indice}
        IF    ${indice} < ${MINIMO_FILMES}
            Click    ${registradaIncluirItens_Button}
        ELSE IF    ${indice} < ${total}
            Click    ${registradaIncluirItensLiberado_Click}
        END
        # Os resultados só aceitam nova busca depois que js/app.js renderiza a lista (ele reescreve o campo de busca)
        IF    ${indice} < ${total}
            Wait For Elements State    ${resultadosCards} >> nth=0    visible
        END
    END
    Registrar evidência    ${participante}[nome]_filmes

Comparar e avaliar as sugestões do participante
    [Documentation]    Abre a comparação, valida o que foi enviado e recebido da API e dá nota aos três algoritmos.
    [Arguments]    ${participante}    ${avaliacoesEsperadas}
    Limpar Requisições Da API
    Click    ${registradaAvaliarSugestoes_Button}
    Aguardar recomendações dos algoritmos
    ${total}=    Get Length    ${participante}[filmes]
    Get Text    ${sugestoesLiberadas_label}    ==    ✓ Sugestões liberadas · ${total} filmes avaliados (mínimo: ${MINIMO_FILMES})
    ${chamada}=    Obter Última Requisição Da API    recomendacoes
    Validar payload de recomendações enviado pelo site    ${chamada}[payload]    ${avaliacoesEsperadas}
    Validar resposta dos algoritmos    ${chamada}    ${avaliacoesEsperadas}
    FOR    ${algoritmo}    IN    @{ALGORITMOS}
        Dar nota ao algoritmo    ${algoritmo}    ${participante}[notasAlgoritmos][${algoritmo}]
    END
    Get Text    ${sugestoesProgresso_label}    ==    3 de 3 algoritmos avaliados
    Registrar evidência    ${participante}[nome]_sugestoes
    RETURN    ${chamada}[resposta]

Concluir participação
    [Arguments]    ${participante}
    Enviar avaliações dos algoritmos
    Validar tela de conclusão
    ${chamada}=    Obter Última Requisição Da API    avaliacoes
    ${total}=    Get Length    ${participante}[filmes]
    ${esperado}=    Create Dictionary    avaliacoes=${participante}[notasAlgoritmos]    quantidade_avaliados=${total}
    Should Be Equal    ${chamada}[payload]    ${esperado}    O envio final não trouxe as notas dadas aos algoritmos
    Should Be Equal As Integers    ${chamada}[status]    200
    LocalStorage Get Item    cinematch:avaliacoes    ==    {}
    LocalStorage Get Item    cinematch:notasAlgoritmos    ==    {}
    Registrar evidência    ${participante}[nome]_concluido
    Click    ${concluidoVoltarInicio_Button}
    Validar progresso no início    0 de ${MINIMO_FILMES} filmes avaliados · Faltam ${MINIMO_FILMES}    Mínimo ainda não atingido

Avaliações esperadas do participante
    [Documentation]    {movieId: {nota, comentario}} do participante, para comparar com o que o site enviou.
    [Arguments]    ${participante}
    ${avaliacoes}=    Evaluate
    ...    {str(f["id"]): {"nota": f["nota"], "comentario": f["comentario"]} for f in $participante["filmes"]}
    RETURN    ${avaliacoes}

Gerar relatório da participação
    [Documentation]    Salva em JSON, junto ao log, as avaliações e as recomendações de cada participante
    ...                (com títulos), além da média das notas dadas a cada algoritmo. Serve de evidência para o TCC.
    [Arguments]    ${participantes}    ${recomendacoesPorParticipante}
    ${relatorio}=    Create Dictionary
    FOR    ${chave}    ${participante}    IN    &{participantes}
        ${titulos}=    Create Dictionary
        FOR    ${algoritmo}    IN    @{ALGORITMOS}
            ${ids}=    Set Variable    ${recomendacoesPorParticipante}[${chave}][${algoritmo}]
            ${nomes}=    Titulos Dos Filmes    ${ids}
            Set To Dictionary    ${titulos}    ${algoritmo}=${nomes}
        END
        ${item}=    Create Dictionary    nome=${participante}[nome]    perfil=${participante}[perfil]
        ...    filmesAvaliados=${participante}[filmes]    notasAlgoritmos=${participante}[notasAlgoritmos]
        ...    recomendacoes=${titulos}
        Set To Dictionary    ${relatorio}    ${chave}=${item}
    END
    ${medias}=    Evaluate
    ...    {a: round(sum(p["notasAlgoritmos"][a] for p in $participantes.values()) / len($participantes), 2) for a in $ALGORITMOS}
    Log    Média das notas dadas aos algoritmos: ${medias}
    ${conteudo}=    Evaluate    json.dumps({"mediaNotasAlgoritmos": $medias, "participantes": $relatorio}, ensure_ascii=False, indent=2)    modules=json
    Create File    ${OUTPUT DIR}/relatorio_participacao.json    ${conteudo}    encoding=UTF-8
    Log    Relatório salvo em ${OUTPUT DIR}/relatorio_participacao.json
