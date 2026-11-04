*** Settings ***
Documentation       Locators da tela Início (index.html)

Resource            ../../../configs/base.resource

*** Variables ***
${inicioTitulo_label}               css=#como-participar
${inicioContagem_label}             css=[data-resumo] [data-contagem]
${inicioEstado_label}               css=[data-resumo] [data-estado]
${inicioBarraProgresso_label}       css=[data-resumo] .progress-fill
${inicioAvaliarMais_Button}         css=.resumo-acoes .btn >> nth=0
${inicioAvaliarSugestoes_Button}    css=.resumo-acoes .btn >> nth=1
${inicioDestaqueTitulo_label}       css=[data-destaque] h2
${inicioDestaqueDetalhes_Button}    css=[data-destaque] a.btn
${inicioEmAlta_Cards}               css=.trending .movie-card
${inicioExplorarFilmes_Click}       css=.section-head a[href="resultados.html"]
