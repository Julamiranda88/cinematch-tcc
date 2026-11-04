*** Settings ***
Documentation       Testes da tela Início e da navegação do CineMatch

Resource            ../../configs/base.resource

Suite Setup         Iniciar ambiente CineMatch publicado
Suite Teardown      Encerrar ambiente CineMatch


*** Test Cases ***

Caso de Teste 01: Primeiro acesso mostra a participação zerada
    [Documentation]    Sem avaliações no navegador, o início mostra 0 de 5 e bloqueia os atalhos de sugestões.
    [Tags]      CT01_InicioParticipacaoZerada
    [Setup]    Iniciar sessão de novo participante
    Dado que um novo participante acesse o CineMatch
    Então deverá ver o progresso zerado da participação
    E os atalhos de sugestões deverão estar bloqueados
    [Teardown]    Encerrar sessão do participante


Caso de Teste 02: Filme em destaque e filmes em alta
    [Documentation]    O destaque é Interestelar, "Em alta agora" lista 12 filmes e "Ver detalhes" abre o filme.
    [Tags]      CT02_InicioDestaqueEmAlta
    [Setup]    Iniciar sessão de novo participante
    Dado que um novo participante acesse o CineMatch
    Então deverá ver Interestelar em destaque e os filmes em alta
    Quando abrir os detalhes do filme em destaque
    Então deverá ver a página do filme em destaque
    [Teardown]    Encerrar sessão do participante


Caso de Teste 03: Menu principal navega entre Início, Sugestões e Sobre
    [Documentation]    Cada item do menu abre sua tela e fica marcado como ativo.
    [Tags]      CT03_InicioMenuPrincipal
    [Setup]    Iniciar sessão de novo participante
    Dado que um novo participante acesse o CineMatch
    Quando navegar pelo menu principal
    Então cada item do menu deverá abrir a tela correspondente
    [Teardown]    Encerrar sessão do participante


Caso de Teste 04: Busca vazia no início abre a tela de pesquisa
    [Documentation]    Enviar a busca do início sem texto leva a "Encontre seu próximo filme".
    [Tags]      CT04_InicioBuscaVazia
    [Setup]    Iniciar sessão de novo participante
    Dado que um novo participante acesse o CineMatch
    Quando pesquisar sem digitar nenhum termo no início
    Então deverá abrir a tela Encontre seu próximo filme
    [Teardown]    Encerrar sessão do participante


Caso de Teste 05: Progresso parcial indica quantos filmes faltam
    [Documentation]    Com 3 filmes avaliados, o início mostra "3 de 5 · Faltam 2".
    [Tags]      CT05_InicioProgressoParcial
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante já tenha avaliado 3 filmes
    Então o início deverá indicar que faltam 2 filmes
    [Teardown]    Encerrar sessão do participante


Caso de Teste 06: Mínimo atingido libera as sugestões no início
    [Documentation]    Com 5 filmes avaliados, o início mostra "Sugestões liberadas" e o atalho abre a comparação.
    [Tags]      CT06_InicioSugestoesLiberadas
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante já tenha avaliado o mínimo de filmes
    Então o início deverá indicar as sugestões liberadas
    E o atalho Avaliar sugestões deverá abrir a comparação
    [Teardown]    Encerrar sessão do participante
