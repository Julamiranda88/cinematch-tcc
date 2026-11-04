# Testes automatizados do CineMatch

Testes E2E e de API do site CineMatch e dos algoritmos de recomendação (KNN, SVD e Redes Neurais/NCF),
em [Robot Framework](https://robotframework.org/) com a [Browser Library](https://marketsquare.github.io/robotframework-browser/Browser.html)
(Playwright, chromium). A estrutura segue o padrão do projeto de testes FrontEnd do PMS SaaS: import em
cascata pelo `base.resource`, camadas `frontEnd`/`backEnd`/`shared` com índices, locators separados das
keywords e casos em Gherkin em português.

## Estrutura

```
Testes/
├── configs/
│   ├── base.resource              # importa as libraries e os 3 índices de resources
│   └── global_variables.resource  # URL do site, API real, modo da API, browser, regras do site
├── data/participantes/participantes.json   # 10 participantes com perfis de gosto distintos
├── libs/
│   ├── Participantes.py           # Factory Participante, Listar Participantes, massa de avaliações
│   ├── Catalogo.py                # lê Site/js/catalogo.js (títulos, ids válidos)
│   └── ServidorCineMatch.py       # servidor local: serve Site/ e intermedeia a API (ver abaixo)
├── resources/
│   ├── frontEnd/{hooks,keywords,locators}/ + _indexFrontEnd.resource
│   ├── backEnd/recomendacao/      + _indexBackEnd.resource   # chamadas diretas à API
│   └── shared/{recomendacoes,participacao}/ + _indexShared.resource
├── Tests/
│   ├── Inicio/Inicio.robot                      # progresso, destaque, menu, busca vazia
│   ├── Pesquisa/Pesquisa.robot                  # busca, acentos, filtro, paginação
│   ├── Filme/AvaliacaoFilme.robot               # nota, meia estrela, comentário, edição
│   ├── Sugestoes/Sugestoes.robot                # mínimo, 3 algoritmos, notas, erros da API
│   ├── Participacao/Participacao10Usuarios.robot  # processo principal com 10 participantes
│   └── API/ApiRecomendacao.robot                # contrato e qualidade dos algoritmos
├── requirements.txt
└── runTests.ps1
```

Todo `.robot` importa só `Resource ../../configs/base.resource`. Ao criar um `.resource`, registre-o no
índice da camada, senão as keywords não resolvem.

## Como o site é testado

Há dois ambientes, escolhidos pelo `Suite Setup` de cada suíte:

| Suítes | Keyword de setup | Endereço |
|---|---|---|
| Início, Pesquisa, Filme | `Iniciar ambiente CineMatch publicado` | `${BASE_URL}` (GitHub Pages) |
| Sugestões, Participação | `Iniciar ambiente CineMatch` | `${BASE_URL_LOCAL}` (servidor local) |

As telas que não dependem da API rodam contra o site publicado, como o participante o vê. As que
dependem da API rodam no servidor local, porque o site publicado em `https` não consegue chamar a API
em `http` (o navegador bloqueia conteúdo misto). As keywords navegam sempre por `${URL_SITE}`, que o
setup aponta para um ou outro endereço.

O `ServidorCineMatch` sobe `Site/` em `http://localhost:5510` e reescreve, só na resposta, o endereço
da API fixo em `js/recomendacoes.js` para `/api/<rota>` do próprio servidor. Assim os testes:

- conferem o que o site enviou (`recomendacoes`: as avaliações; `avaliacoes`: as notas dos algoritmos);
- conferem se a tela exibe exatamente o que cada algoritmo devolveu, na mesma ordem;
- repassam `/recomendacoes` para a **API real** (`MODO_API=real`, padrão) ou respondem listas fixas
  (`MODO_API=simulada`, para rodar sem a API no ar);
- **não gravam** o envio final na base da pesquisa: `/avaliacoes` é só capturado, a menos que
  `ENVIAR_AVALIACOES_PARA_API=True`;
- simulam falhas da API para validar a tela de erro e o "Tentar novamente".

Cada caso abre um contexto novo do browser, com `localStorage` vazio, ou seja, um participante novo.
Pré-condições ("já avaliou 4 filmes") são gravadas direto no `localStorage`, no mesmo formato do site.

## Processo principal: 10 participantes

`Tests/Participacao/Participacao10Usuarios.robot` percorre, para cada um dos 10 participantes de
`data/participantes/participantes.json` (ficção científica, animação, terror, crime, romance, guerra,
fantasia, faroeste, documentário e um eclético com 6 filmes e notas baixas):

1. início zerado → busca de cada filme pelo título → nota (inclusive meias estrelas) e comentário → confirmação com o progresso certo;
2. no 5º filme, "Avaliar sugestões" → valida o payload enviado à API, as listas de KNN, SVD e NCF
   (sem repetição, só filmes do catálogo, nenhum já avaliado, até o top 5) e o que a tela exibe;
3. nota para cada algoritmo → envio → valida o payload final, a limpeza do `localStorage` e a volta ao início.

No fim, verifica se cada algoritmo personaliza (não devolve a mesma lista para todos) e grava
`logs/relatorio_participacao.json` com as recomendações de cada participante (com títulos) e a média
das notas dadas a cada algoritmo.

Um participante que falha não interrompe os outros: a falha é registrada e o caso continua.

## Instalação

```powershell
pip install -r Testes/requirements.txt
rfbrowser init chromium
```

## Execução

Sempre a partir da raiz do repositório:

```powershell
# todas as suítes (exclui o teste de robustez, que pode deixar uma chamada travada na API)
./Testes/runTests.ps1

# só o processo principal, com o browser visível
./Testes/runTests.ps1 Testes/Tests/Participacao -Visivel

# sem depender da API real
./Testes/runTests.ps1 Testes/Tests -ModoApi simulada
```

Ou direto com o Robot:

```powershell
python -m robot -d ./Testes/logs Testes/Tests/Sugestoes/Sugestoes.robot
python -m robot --include CT02_SugestoesTresAlgoritmos -d ./Testes/logs Testes/Tests/Sugestoes/Sugestoes.robot
```

Resultados em `Testes/logs/` (`log.html`, `report.html`, `output.xml`, `outputxunit.xml`), screenshots
em `Testes/logs/browser/screenshot/` nomeados pela tag `CT##_...` do caso.

Os testes de API (`Tests/API`) chamam a API real diretamente e não dependem do browser. Eles só usam a
rota `recomendacoes`; a rota `avaliacoes` nunca é chamada por eles.
