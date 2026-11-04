*** Settings ***
Documentation       Locators das telas de sugestões (sugestoes.html, recomendado.html, avaliados.html e concluido.html)

Resource            ../../../configs/base.resource

*** Variables ***
## Sugestões: mínimo não atingido ##
${sugestoesMinimo_label}            css=[data-minimo] h1
${sugestoesMinimoAvaliar_Button}    css=[data-minimo] a.btn

## Sugestões: comparar e avaliar ##
${sugestoesComparacao_area}         css=[data-comparacao]
${sugestoesPontoPartida_label}      css=[data-ponto-partida]
${sugestoesVerMais_Click}           css=[data-ver-mais]
${sugestoesFaixaFilmes}             css=[data-faixa] .mini-film
${sugestoesLiberadas_label}         css=[data-liberadas]
${sugestoesCarregando_label}        css=[data-algoritmos] .carrega h3
${sugestoesCardsOuErro}             css=[data-algoritmos] .algo-card, [data-algoritmos] .erro
${sugestoesCards}                   css=[data-algoritmos] .algo-card
${sugestoesErro_label}              css=[data-algoritmos] .erro h3
${sugestoesTentarNovamente_Button}  css=#btn-tentar-novamente
${sugestoesProgresso_label}         css=[data-progresso]
${sugestoesPendencia_label}         css=[data-pendencia]
${sugestoesEnviar_Button}           css=[data-enviar]

## Recomendado ##
${recomendadoPor_label}             css=[data-recomendado-por]
${recomendadoTitulo_label}          css=[data-recomendado] .page-title
${recomendadoAlgoritmo_label}       css=[data-algoritmo]
${recomendadoVoltar_Button}         css=[data-voltar-botao]

## Filmes avaliados ##
${avaliadosResumo_label}            css=[data-resumo-participacao]
${avaliadosCards}                   css=.rated-grid .result-card

## Concluído ##
${concluidoTitulo_label}            css=.confirm .message h1
${concluidoVoltarInicio_Button}     css=.confirm a.btn[href="index.html"]
