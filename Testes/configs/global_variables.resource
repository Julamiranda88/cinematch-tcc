*** Settings ***
Documentation       Arquivo de variáveis globais do projeto


*** Variables ***
## Site ##
# Site publicado no GitHub Pages: usado pelas suítes que não dependem da API (Início, Pesquisa e Filme)
${BASE_URL}                             https://julamiranda88.github.io/cinematch-tcc/
# Pasta do site servida pelo servidor local de testes (libs/ServidorCineMatch.py): usado por Sugestões e
# Participação, porque o site publicado em https não consegue chamar a API em http (conteúdo misto)
${PASTA_SITE}                           ${CURDIR}/../../Site
${PORTA_SITE}                           5510
${BASE_URL_LOCAL}                       http://localhost:${PORTA_SITE}
# Endereço em uso na suíte atual; definido pelo hook de ambiente (publicado ou local)
${URL_SITE}                             ${BASE_URL_LOCAL}

## API de recomendação ##
# Endereço real da API (o mesmo fixo em Site/js/recomendacoes.js)
${API_RECOMENDACAO}                     http://77.113.59.232:8000
# real     → o servidor local repassa /recomendacoes para a API real (valida os algoritmos de verdade)
# simulada → o servidor local responde recomendações fixas (roda sem a API no ar)
${MODO_API}                             real
# Com False, o envio final (/avaliacoes) é só capturado pelo servidor local e NÃO chega à API real,
# para não misturar participantes de teste com os dados da pesquisa do TCC.
${ENVIAR_AVALIACOES_PARA_API}           ${False}
${TIMEOUT_API}                          60s

## Configurações Abrir Browser ##
${CHANNEL}
${HEADLESS}                             ${True}
# Pausa entre ações do browser, para acompanhar a execução com o browser visível (ex.: 300ms)
${SLOWMO}                               0ms
# Tamanho do protótipo no Figma: com ele o site não aplica zoom (js/escala.js)
${VIEWPORT}                             {'width': 1280, 'height': 832}

## Regras do site (js/app.js) ##
${MINIMO_FILMES}                        5
${TOP_N_RECOMENDACOES}                  5
@{ALGORITMOS}                           knn    svd    ncf
&{NOME_ALGORITMO}                       knn=KNN    svd=SVD    ncf=Redes Neurais
&{SIGLA_ALGORITMO}                      knn=KNN    svd=SVD    ncf=NCF

## Evidências ##
${PASTA_EVIDENCIAS}                     ${OUTPUT DIR}/evidencias
