*** Settings ***
Documentation       Keywords da tela Início e da navegação principal

Resource            ../../../configs/base.resource

*** Keywords ***
Validar progresso no início
    [Arguments]    ${contagem}    ${estado}
    Get Text    ${inicioContagem_label}    ==    ${contagem}
    Get Text    ${inicioEstado_label}    ==    ${estado}

## Caso 1 ##
Então deverá ver o progresso zerado da participação
    Validar progresso no início    0 de ${MINIMO_FILMES} filmes avaliados · Faltam ${MINIMO_FILMES}    Mínimo ainda não atingido
    Get Style    ${inicioBarraProgresso_label}    width    ==    0px

E os atalhos de sugestões deverão estar bloqueados
    Get Attribute    ${inicioAvaliarMais_Button}    aria-disabled    ==    true
    Get Attribute    ${inicioAvaliarSugestoes_Button}    aria-disabled    ==    true
    Get Attribute    ${inicioAvaliarSugestoes_Button}    href    ==    ${None}
    Registrar evidência    inicio

## Caso 2 ##
Então deverá ver Interestelar em destaque e os filmes em alta
    Get Text    ${inicioDestaqueTitulo_label}    ==    Interestelar
    Get Element Count    ${inicioEmAlta_Cards}    ==    12

Quando abrir os detalhes do filme em destaque
    Click    ${inicioDestaqueDetalhes_Button}

Então deverá ver a página do filme em destaque
    Get Url    contains    filme.html?id=109487
    Get Text    ${filmeTitulo_label}    ==    Interestelar
    Registrar evidência    destaque

## Caso 3 ##
Quando navegar pelo menu principal
    Click    ${menuSugestoes_Click}
    Get Url    contains    sugestoes.html
    Get Text    ${menuAtivo_label}    ==    Sugestões
    Click    ${menuSobre_Click}
    Get Url    contains    sobre.html
    Get Text    ${menuAtivo_label}    ==    Sobre

Então cada item do menu deverá abrir a tela correspondente
    Get Text    ${sobreTitulo_label}    ==    Sobre o CineMatch
    Click    ${menuInicio_Click}
    Get Url    contains    index.html
    Get Text    ${menuAtivo_label}    ==    Início
    Get Text    ${rodape_label}    contains    CineMatch

## Caso 4 ##
Quando pesquisar sem digitar nenhum termo no início
    Fill Text    ${buscaTermo_Input}    ${EMPTY}
    Press Keys    ${buscaTermo_Input}    Enter

Então deverá abrir a tela Encontre seu próximo filme
    Get Url    contains    pesquisa.html
    Get Text    ${pesquisaTitulo_label}    ==    Encontre seu próximo filme
    Get Text    ${pesquisaEstado_label}    ==    Busque mundos incríveis

## Caso 5 ##
Dado que o participante já tenha avaliado 3 filmes
    Criar massa de filmes avaliados    participante01    3

Então o início deverá indicar que faltam 2 filmes
    Validar progresso no início    3 de ${MINIMO_FILMES} filmes avaliados · Faltam 2    Mínimo ainda não atingido
    Get Style    ${inicioBarraProgresso_label}    width    !=    0px

## Caso 6 ##
Dado que o participante já tenha avaliado o mínimo de filmes
    Criar massa de filmes avaliados    participante02    ${MINIMO_FILMES}

Então o início deverá indicar as sugestões liberadas
    Validar progresso no início    5 filmes avaliados · mínimo: ${MINIMO_FILMES}    Sugestões liberadas
    Get Attribute    ${inicioAvaliarSugestoes_Button}    href    ==    sugestoes.html
    Registrar evidência    liberado

E o atalho Avaliar sugestões deverá abrir a comparação
    Click    ${inicioAvaliarSugestoes_Button}
    Get Url    contains    sugestoes.html
    Wait For Elements State    ${sugestoesComparacao_area}    visible
