*** Settings ***
Documentation       Testes da comparação e avaliação dos algoritmos (KNN, SVD e Redes Neurais)

Resource            ../../configs/base.resource

Suite Setup         Iniciar ambiente CineMatch
Suite Teardown      Encerrar ambiente CineMatch


*** Test Cases ***

Caso de Teste 01: Sugestões bloqueadas antes do mínimo de filmes
    [Documentation]    Com 4 filmes, a aba Sugestões avisa que faltam filmes e não chama a API.
    [Tags]      CT01_SugestoesSemMinimo
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante tenha avaliado menos filmes que o mínimo
    Então deverá ver o aviso de que ainda não há sugestões
    [Teardown]    Encerrar sessão do participante


Caso de Teste 02: Comparação exibe as recomendações dos três algoritmos
    [Documentation]    O site envia as avaliações à API e exibe, por algoritmo, exatamente os filmes devolvidos.
    [Tags]      CT02_SugestoesTresAlgoritmos
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante tenha avaliado o mínimo de filmes
    Quando abrir a tela de sugestões
    Então deverá ver as recomendações dos três algoritmos
    E as recomendações exibidas deverão ser as devolvidas pelos algoritmos
    [Teardown]    Encerrar sessão do participante


Caso de Teste 03: Envio liberado só com os três algoritmos avaliados
    [Documentation]    O progresso e a pendência acompanham cada nota; o envio só libera com as três.
    [Tags]      CT03_SugestoesEnvioBloqueado
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante esteja comparando as sugestões
    Quando avaliar os algoritmos um a um
    Então o envio deverá ser liberado só com os três algoritmos avaliados
    [Teardown]    Encerrar sessão do participante


Caso de Teste 04: Notas dos algoritmos mantidas ao recarregar
    [Documentation]    As notas já dadas continuam na tela depois de recarregar a página.
    [Tags]      CT04_SugestoesNotasMantidas
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante esteja comparando as sugestões
    Quando avaliar dois algoritmos e recarregar a página
    Então as notas dadas deverão ser mantidas
    [Teardown]    Encerrar sessão do participante


Caso de Teste 05: Filme recomendado indica o algoritmo de origem
    [Documentation]    Abrir um filme recomendado pelo SVD mostra "Recomendado por SVD" e volta à comparação.
    [Tags]      CT05_SugestoesFilmeRecomendado
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante esteja comparando as sugestões
    Quando abrir o primeiro filme recomendado pelo algoritmo    svd
    Então a página deverá indicar o algoritmo de origem e voltar à comparação    svd
    [Teardown]    Encerrar sessão do participante


Caso de Teste 06: Falha da API ao buscar recomendações
    [Documentation]    Com a API respondendo erro, a tela mostra "Tentar novamente", que recupera quando a API volta.
    [Tags]      CT06_SugestoesErroApi
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante tenha avaliado o mínimo de filmes
    Quando a API de recomendação falhar ao abrir as sugestões
    Então deverá ver o erro com a opção de tentar novamente
    E tentar novamente deverá carregar as sugestões quando a API voltar
    [Teardown]    Run Keywords    Remover Falhas Da API    AND
    ...                           Encerrar sessão do participante


Caso de Teste 07: Falha no envio final mantém a participação
    [Documentation]    Se o envio das três notas falhar, nada é apagado e "Tentar novamente" conclui o envio.
    [Tags]      CT07_SugestoesErroEnvioFinal
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante tenha avaliado os três algoritmos
    Quando o envio final falhar na API
    Então os dados da participação deverão ser mantidos para nova tentativa
    E tentar novamente deverá concluir o envio
    [Teardown]    Run Keywords    Remover Falhas Da API    AND
    ...                           Encerrar sessão do participante


Caso de Teste 08: Ver mais lista os filmes avaliados
    [Documentation]    "Ver mais" na comparação abre todos os filmes avaliados com a nota de cada um.
    [Tags]      CT08_SugestoesVerMais
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante esteja comparando as sugestões
    Quando abrir Ver mais na comparação
    Então deverá ver todos os filmes avaliados na participação
    [Teardown]    Encerrar sessão do participante
