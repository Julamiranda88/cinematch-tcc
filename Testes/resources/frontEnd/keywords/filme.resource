*** Settings ***
Documentation       Keywords da tela do filme (avaliar, ver e editar avaliação) e da confirmação

Resource            ../../../configs/base.resource

*** Keywords ***
Abrir página do filme
    [Arguments]    ${movieId}
    Acessar tela    filme.html?id=${movieId}
    ${titulo}=    Obter Titulo Do Filme    ${movieId}
    Get Text    ${filmeTitulo_label}    ==    ${titulo}

Dar nota ao filme
    [Documentation]    Usa o teclado das estrelas (cada seta → 0,5), o que permite qualquer nota de 0,5 a 5.
    [Arguments]    ${nota}
    ${toques}=    Evaluate    int(round(float($nota) * 2))
    @{teclas}=    Evaluate    ["ArrowRight"] * $toques
    Press Keys    ${filmeEstrela_Button}    @{teclas}
    ${notaFormatada}=    Formatar nota    ${nota}
    Get Text    ${filmeNotaValor_label}    validate    value.strip() == "${notaFormatada}"

Ajustar nota do filme
    [Documentation]    Parte da nota já preenchida (modo edição) e chega à nota nova com as setas.
    [Arguments]    ${notaAtual}    ${notaNova}
    ${passos}=    Evaluate    int(round((float($notaNova) - float($notaAtual)) * 2))
    ${tecla}=    Set Variable If    ${passos} >= 0    ArrowRight    ArrowLeft
    @{teclas}=    Evaluate    [$tecla] * abs($passos)
    Press Keys    ${filmeEstrela_Button}    @{teclas}
    ${notaFormatada}=    Formatar nota    ${notaNova}
    Get Text    ${filmeNotaValor_label}    validate    value.strip() == "${notaFormatada}"

Escrever comentário do filme
    [Arguments]    ${comentario}
    Fill Text    ${filmeComentario_Input}    ${comentario}
    ${tamanho}=    Get Length    ${comentario}
    Get Text    ${filmeContadorCaracteres_label}    ==    ${tamanho}/500

Enviar avaliação do filme
    Get Element States    ${filmeEnviar_Button}    contains    enabled
    Click    ${filmeEnviar_Button}

Validar confirmação da avaliação
    [Arguments]    ${movieId}    ${nota}    ${totalAvaliados}
    Get Text    ${registradaTitulo_label}    ==    Avaliação registrada!
    ${titulo}=    Obter Titulo Do Filme    ${movieId}
    ${notaFormatada}=    Formatar nota    ${nota}
    Get Text    ${registradaGuiaTexto_label}    contains    ${titulo} · Sua nota: ${notaFormatada}.
    ${faltam}=    Evaluate    ${MINIMO_FILMES} - ${totalAvaliados}
    IF    ${faltam} > 0
        ${textoFaltam}=    Set Variable If    ${faltam} == 1    Falta 1 filme    Faltam ${faltam} filmes
        Get Text    ${registradaGuiaTitulo_label}    ==    Continue avaliando filmes
        Get Text    ${registradaGuiaTexto_label}    contains
        ...    Você avaliou ${totalAvaliados} de ${MINIMO_FILMES} filmes. ${textoFaltam} para liberar as sugestões.
        Wait For Elements State    ${registradaAvaliarSugestoes_Button}    hidden
    ELSE
        Get Text    ${registradaGuiaTitulo_label}    ==    Próxima etapa · Avaliar sugestões
        Get Text    ${registradaGuiaTexto_label}    contains
        ...    Você já avaliou ${totalAvaliados} filmes e atingiu o mínimo de cinco.
        Wait For Elements State    ${registradaAvaliarSugestoes_Button}    visible
    END

## Caso 1 ##
Dado que o participante abra um filme ainda não avaliado
    Abrir página do filme    2571
    Get Text    ${filmeBadgeAvaliar_label}    ==    Avaliar filme

Então o envio da avaliação deverá ficar bloqueado sem nota
    Get Text    ${filmeNotaValor_label}    validate    value.strip() == "Escolha uma nota"
    Get Element States    ${filmeEnviar_Button}    contains    disabled
    Escrever comentário do filme    Só comentário, sem nota.
    Get Element States    ${filmeEnviar_Button}    contains    disabled

## Caso 2 ##
Quando avaliar o filme com meia estrela e comentário
    Dar nota ao filme    3.5
    Escrever comentário do filme    Bom, mas esperava mais do final.
    Enviar avaliação do filme

Então a avaliação deverá ser registrada com a nota e o comentário
    Validar confirmação da avaliação    2571    3.5    1
    Registrar evidência    confirmacao
    ${avaliacoes}=    Obter avaliações guardadas no navegador
    Should Be Equal As Numbers    ${avaliacoes}[2571][nota]    3.5
    Should Be Equal    ${avaliacoes}[2571][comentario]    Bom, mas esperava mais do final.
    Should Match Regexp    ${avaliacoes}[2571][data]    ^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$

E a página do filme deverá exibir a avaliação registrada
    Abrir página do filme    2571
    Wait For Elements State    ${filmeAvaliado_area}    visible
    Get Text    ${filmeBadgeRegistrada_label}    ==    ✓ Avaliação registrada
    Get Text    ${filmeNotaRegistrada_label}    ==    3,5 / 5
    Get Text    ${filmeComentarioRegistrado_label}    ==    Bom, mas esperava mais do final.
    Get Text    ${filmeMinimoTitulo_label}    ==    Você avaliou 1 de 5 filmes · Faltam 4 filmes para liberar as sugestões

## Caso 3 ##
Quando escrever um comentário maior que o limite de 500 caracteres
    ${textoLongo}=    Evaluate    "a" * 510
    Fill Text    ${filmeComentario_Input}    ${textoLongo}

Então o comentário deverá ser limitado a 500 caracteres
    Get Text    ${filmeContadorCaracteres_label}    ==    500/500
    Get Property    ${filmeComentario_Input}    value    validate    len(value) == 500

## Caso 4 ##
Dado que o participante já tenha avaliado um filme
    Criar massa de filmes avaliados    participante01    1
    Abrir página do filme    2571
    Wait For Elements State    ${filmeAvaliado_area}    visible

Quando editar a nota e o comentário da avaliação
    Click    ${filmeEditar_Button}
    Get Text    ${filmeBadgeAvaliar_label}    ==    Editar avaliação
    Get Property    ${filmeComentario_Input}    value    ==    Mudou a forma como vejo ficção científica.
    Ajustar nota do filme    5    2.5
    Escrever comentário do filme    Revi e não gostei tanto.
    Enviar avaliação do filme

Então a avaliação editada deverá substituir a anterior
    Wait For Elements State    ${filmeAvaliado_area}    visible
    Get Text    ${filmeNotaRegistrada_label}    ==    2,5 / 5
    Get Text    ${filmeComentarioRegistrado_label}    ==    Revi e não gostei tanto.
    ${avaliacoes}=    Obter avaliações guardadas no navegador
    Length Should Be    ${avaliacoes}    1
    Should Be Equal As Numbers    ${avaliacoes}[2571][nota]    2.5
    Registrar evidência    editada

## Caso 5 ##
Quando desistir da edição da avaliação
    Click    ${filmeEditar_Button}
    Ajustar nota do filme    5    1
    Click    ${filmeCancelar_Button}

Então a avaliação original deverá ser mantida
    Wait For Elements State    ${filmeAvaliado_area}    visible
    Get Text    ${filmeNotaRegistrada_label}    ==    5,0 / 5
    ${avaliacoes}=    Obter avaliações guardadas no navegador
    Should Be Equal As Numbers    ${avaliacoes}[2571][nota]    5

## Caso 6 ##
Dado que o participante já tenha avaliado 4 filmes
    Criar massa de filmes avaliados    participante02    4

Quando avaliar o quinto filme
    Abrir página do filme    6377
    Dar nota ao filme    5
    Enviar avaliação do filme

Então a confirmação deverá liberar a avaliação das sugestões
    Validar confirmação da avaliação    6377    5    5
    Registrar evidência    liberou
    Click    ${registradaAvaliarSugestoes_Button}
    Get Url    contains    sugestoes.html
