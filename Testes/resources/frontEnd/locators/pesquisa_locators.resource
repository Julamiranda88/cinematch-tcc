*** Settings ***
Documentation       Locators das telas de busca (pesquisa.html e resultados.html)

Resource            ../../../configs/base.resource

*** Variables ***
## Barra de busca (presente no Início, na Pesquisa e nos Resultados) ##
${buscaTermo_Input}                 css=form[data-search] input[name="q"]
${buscaLimpar_Button}               css=form[data-search] button.clear

## Encontre seu próximo filme (pesquisa.html) ##
${pesquisaTitulo_label}             css=main h1.page-title
${pesquisaEstado_label}             css=.center-state h2

## Resultados da pesquisa (resultados.html) ##
${resultadosResumo_label}           css=.summary-row .results
${resultadosQuantidade_label}       css=.summary-row .count
${resultadosCards}                  css=.result-grid .result-card
${resultadosMetaCards_label}        css=.result-grid .result-card .meta
${resultadosVazio_label}            css=[data-empty] h2
${resultadosVazioTermo_label}       css=[data-empty] [data-query]
${resultadosAplicarFiltros_Button}  css=.filters [data-apply]
${resultadosLimparFiltros_Button}   css=.filters [data-clear-filters]
${resultadosContagem_label}         css=.results-pagination [data-contagem]
${resultadosProxima_Button}         css=.results-pagination .page-btn >> text=Próxima
${resultadosPaginaAtual_label}      css=.results-pagination .page-btn.current
