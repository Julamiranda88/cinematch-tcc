*** Settings ***
Documentation       Testes da busca de filmes, filtros e paginação dos resultados

Resource            ../../configs/base.resource

Suite Setup         Iniciar ambiente CineMatch publicado
Suite Teardown      Encerrar ambiente CineMatch


*** Test Cases ***

Caso de Teste 01: Pesquisar filme pelo título
    [Documentation]    A busca por "Matrix" traz o filme em primeiro lugar e abre seus detalhes.
    [Tags]      CT01_PesquisaPorTitulo
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante esteja nos resultados da pesquisa
    Quando pesquisar pelo título Matrix
    Então o filme Matrix deverá aparecer nos resultados
    [Teardown]    Encerrar sessão do participante


Caso de Teste 02: Pesquisa sem resultados
    [Documentation]    Um termo que não existe no catálogo mostra "Não encontramos esse filme".
    [Tags]      CT02_PesquisaSemResultados
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante esteja nos resultados da pesquisa
    Quando pesquisar por um filme que não existe no catálogo
    Então deverá ver a mensagem de filme não encontrado
    [Teardown]    Encerrar sessão do participante


Caso de Teste 03: Pesquisa ignora acentos
    [Documentation]    "coracao valente" encontra "Coração Valente".
    [Tags]      CT03_PesquisaSemAcentos
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante esteja nos resultados da pesquisa
    Quando pesquisar um título sem acentos
    Então o filme com acento deverá ser encontrado
    [Teardown]    Encerrar sessão do participante


Caso de Teste 04: Filtrar resultados por gênero
    [Documentation]    O filtro Gênero = Terror deixa só filmes de terror, e "Limpar filtros" restaura a lista.
    [Tags]      CT04_PesquisaFiltroGenero
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante esteja nos resultados da pesquisa
    Quando filtrar os resultados pelo gênero Terror
    Então todos os filmes exibidos deverão ser de Terror
    E limpar os filtros deverá voltar à lista completa
    [Teardown]    Encerrar sessão do participante


Caso de Teste 05: Paginação dos resultados
    [Documentation]    "Próxima" avança para a página 2 do catálogo completo (9.742 filmes).
    [Tags]      CT05_PesquisaPaginacao
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante esteja nos resultados da pesquisa
    Quando avançar para a próxima página de resultados
    Então deverá ver a segunda página do catálogo
    [Teardown]    Encerrar sessão do participante


Caso de Teste 06: Resultado mostra a nota de um filme já avaliado
    [Documentation]    Filme já avaliado aparece nos resultados com "✓ Sua nota".
    [Tags]      CT06_PesquisaNotaDoParticipante
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante já tenha avaliado o filme Matrix
    Quando pesquisar novamente pelo filme Matrix
    Então o resultado deverá mostrar a nota dada pelo participante
    [Teardown]    Encerrar sessão do participante
