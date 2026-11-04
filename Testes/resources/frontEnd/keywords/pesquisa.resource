*** Settings ***
Documentation       Keywords das telas de busca e resultados

Resource            ../../../configs/base.resource

*** Keywords ***
Pesquisar filme
    [Arguments]    ${termo}
    Fill Text    ${buscaTermo_Input}    ${termo}
    Press Keys    ${buscaTermo_Input}    Enter
    Get Text    ${resultadosResumo_label}    contains    Resultados para “${termo}”

Abrir detalhes do filme nos resultados
    [Arguments]    ${movieId}
    Click    css=.result-grid a.btn[href="filme.html?id=${movieId}"]
    ${titulo}=    Obter Titulo Do Filme    ${movieId}
    Get Text    ${filmeTitulo_label}    ==    ${titulo}

Selecionar filtro
    [Arguments]    ${filtro}    ${opcao}
    Click    css=.dropdown:has(.dropdown-menu[aria-label="${filtro}"]) .dropdown-toggle
    Click    css=.dropdown-menu[aria-label="${filtro}"] button[role="option"] >> text="${opcao}"

## Caso 1 ##
Dado que o participante esteja nos resultados da pesquisa
    Acessar tela    resultados.html
    Wait For Elements State    ${resultadosCards} >> nth=0    visible

Quando pesquisar pelo título Matrix
    Pesquisar filme    Matrix

Então o filme Matrix deverá aparecer nos resultados
    Get Text    ${resultadosQuantidade_label}    matches    ^\\d+ filmes encontrados$
    Get Text    css=.result-grid .result-card >> nth=0 >> h3    ==    Matrix
    Abrir detalhes do filme nos resultados    2571
    Registrar evidência    matrix

## Caso 2 ##
Quando pesquisar por um filme que não existe no catálogo
    Pesquisar filme    filmequenaoexiste123

Então deverá ver a mensagem de filme não encontrado
    Get Text    ${resultadosVazio_label}    ==    Não encontramos esse filme
    Get Text    ${resultadosVazioTermo_label}    ==    filmequenaoexiste123
    Get Text    ${resultadosQuantidade_label}    ==    0 filmes encontrados
    Get Element Count    ${resultadosCards}    ==    0
    Registrar evidência    vazio

## Caso 3 ##
Quando pesquisar um título sem acentos
    Pesquisar filme    coracao valente

Então o filme com acento deverá ser encontrado
    Get Element Count    css=.result-grid a.btn[href="filme.html?id=110"]    ==    1
    Abrir detalhes do filme nos resultados    110

## Caso 4 ##
Quando filtrar os resultados pelo gênero Terror
    ${antes}=    Get Text    ${resultadosQuantidade_label}
    Set Test Variable    ${quantidadeAntesDoFiltro}    ${antes}
    Selecionar filtro    Gênero    Terror

Então todos os filmes exibidos deverão ser de Terror
    Get Text    ${resultadosQuantidade_label}    !=    ${quantidadeAntesDoFiltro}
    @{metas}=    Get Elements    ${resultadosMetaCards_label}
    Should Not Be Empty    ${metas}
    FOR    ${meta}    IN    @{metas}
        Get Text    ${meta}    contains    Terror
    END
    Registrar evidência    filtro_terror

E limpar os filtros deverá voltar à lista completa
    Click    ${resultadosLimparFiltros_Button}
    Get Text    ${resultadosQuantidade_label}    ==    ${quantidadeAntesDoFiltro}

## Caso 5 ##
Quando avançar para a próxima página de resultados
    Get Text    ${resultadosPaginaAtual_label}    ==    1
    Click    ${resultadosProxima_Button}

Então deverá ver a segunda página do catálogo
    Get Text    ${resultadosPaginaAtual_label}    ==    2
    Get Text    ${resultadosContagem_label}    matches    ^\\d+–\\d+ de 9\\.742 filmes · \\d+ por página$
    ${contagem}=    Get Text    ${resultadosContagem_label}
    Should Not Start With    ${contagem}    1–

## Caso 6 ##
Dado que o participante já tenha avaliado o filme Matrix
    Criar massa de filmes avaliados    participante01    1

Quando pesquisar novamente pelo filme Matrix
    Acessar tela    resultados.html
    Pesquisar filme    Matrix

Então o resultado deverá mostrar a nota dada pelo participante
    Get Text    css=.result-grid .result-card:has(a[href="filme.html?id=2571"]) .rating em    ==    ✓ Sua nota: 5,0
