*** Settings ***
Documentation       Locators da tela do filme (filme.html) e da confirmação (avaliacao-registrada.html)

Resource            ../../../configs/base.resource

*** Variables ***
## Filme ##
${filmeTitulo_label}                css=[data-filme] .page-title
${filmeBadgeAvaliar_label}          css=[data-badge-avaliar]
${filmeBadgeRegistrada_label}       css=[data-badge-registrada]
${filmeEstrela_Button}              css=form[data-rating] .stars button.star >> nth=0
${filmeNotaValor_label}             css=form[data-rating] .stars .value
${filmeComentario_Input}            css=#opiniao
${filmeContadorCaracteres_label}    css=form[data-rating] .char-count
${filmeEnviar_Button}               css=form[data-rating] button[type="submit"]
${filmeCancelar_Button}             css=form[data-rating] .actions a

## Filme já avaliado ##
${filmeAvaliado_area}               css=[data-modo-avaliado]
${filmeNotaRegistrada_label}        css=[data-modo-avaliado] .rated-value
${filmeComentarioRegistrado_label}  css=[data-modo-avaliado] [data-comentario]
${filmeEditar_Button}               css=[data-modo-avaliado] [data-editar]
${filmeMinimoTitulo_label}          css=[data-modo-avaliado] [data-minimo-titulo]

## Avaliação registrada ##
${registradaTitulo_label}           css=[data-registrada] h1
${registradaGuiaTitulo_label}       css=[data-registrada] [data-guia-titulo]
${registradaGuiaTexto_label}        css=[data-registrada] [data-guia-texto]
${registradaIncluirItens_Button}    css=[data-acoes-pendentes] a
${registradaAvaliarSugestoes_Button}    css=[data-acoes-liberadas] a.btn
${registradaIncluirItensLiberado_Click}    css=[data-acoes-liberadas] a.secondary-link
