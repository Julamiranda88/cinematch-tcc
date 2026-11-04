*** Settings ***
Documentation       Hooks: ambiente de teste, browser, sessão do participante e massa de dados

Resource            ../../../configs/base.resource

*** Keywords ***
## Ambiente ##
# Site publicado (GitHub Pages): para telas que não dependem da API
Iniciar ambiente CineMatch publicado
    ${url}=    Evaluate    $BASE_URL.rstrip("/")
    Set Suite Variable    ${URL_SITE}    ${url}
    Abrir Browser

# Site servido localmente: o servidor intermedeia a API (captura, simulação de falhas, modo simulada)
Iniciar ambiente CineMatch
    Iniciar Servidor CineMatch    ${PASTA_SITE}    ${PORTA_SITE}    ${API_RECOMENDACAO}
    ...    modo=${MODO_API}    encaminhar_avaliacoes=${ENVIAR_AVALIACOES_PARA_API}    timeout=${TIMEOUT_API}
    Set Suite Variable    ${URL_SITE}    ${BASE_URL_LOCAL}
    Abrir Browser

Encerrar ambiente CineMatch
    Fechar Browser
    Parar Servidor CineMatch

Abrir Browser
    New Browser
    ...    browser=chromium
    ...    headless=${HEADLESS}
    ...    channel=${CHANNEL}
    ...    slowMo=${SLOWMO}
    ...    args=["--disable-dev-shm-usage","--disable-features=Translate"]
    Set Browser Timeout    20s

Fechar Browser
    Close Browser    ALL

## Sessão do participante ##
# Cada contexto do browser tem seu próprio localStorage: um contexto novo é um participante novo.
Iniciar sessão de novo participante
    New Context    viewport=${VIEWPORT}    locale=pt-BR
    New Page    ${URL_SITE}/index.html
    Wait For Elements State    ${inicioContagem_label}    visible

Encerrar sessão do participante
    Run Keyword If Test Failed    Registrar evidência    falha
    Close Context    CURRENT

Dado que um novo participante acesse o CineMatch
    Go To    ${URL_SITE}/index.html
    Get Text    ${inicioTitulo_label}    ==    Como participar do TCC

Acessar tela
    [Arguments]    ${pagina}
    Go To    ${URL_SITE}/${pagina}

## Massa de dados ##
# Grava as avaliações direto no localStorage, no mesmo formato do site (js/app.js → registrarAvaliacao),
# para montar a pré-condição sem repetir o fluxo de avaliação pela tela.
Criar massa de filmes avaliados
    [Arguments]    ${participante}    ${quantidade}
    ${avaliacoes}=    Montar Avaliacoes Do Participante    ${participante}    ${quantidade}
    ${json}=    Evaluate    json.dumps($avaliacoes)    modules=json
    LocalStorage Set Item    cinematch:avaliacoes    ${json}
    Reload
    RETURN    ${avaliacoes}

Criar massa de notas dos algoritmos
    [Arguments]    ${notas}
    ${json}=    Evaluate    json.dumps($notas)    modules=json
    LocalStorage Set Item    cinematch:notasAlgoritmos    ${json}
    Reload

Obter avaliações guardadas no navegador
    ${json}=    LocalStorage Get Item    cinematch:avaliacoes
    ${avaliacoes}=    Evaluate    json.loads($json) if $json else {}    modules=json
    RETURN    ${avaliacoes}

## Utilitários ##
Formatar nota
    [Documentation]    Mesmo formato do site: 4.5 → "4,5" e 5 → "5,0"
    [Arguments]    ${nota}
    ${texto}=    Evaluate    f"{float($nota):.1f}".replace(".", ",")
    RETURN    ${texto}

Pegar Tag do teste
    ${tag}=    Set Variable    ${TEST_TAGS}[0]
    RETURN    ${tag}

Registrar evidência
    [Arguments]    ${sufixo}=evidencia
    ${tag}=    Pegar Tag do teste
    Take Screenshot    filename=${tag}_${sufixo}    fullPage=True
