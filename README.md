# CineMatch

Site de avaliação de filmes desenvolvido como Trabalho de Conclusão de Curso (TCC) para comparar sistemas de recomendação. O participante avalia pelo menos cinco filmes, compara as sugestões de três algoritmos (KNN, SVD e Redes Neurais) e dá de 0.5 a 5 estrelas, às recomendações de cada um.

O projeto tem duas partes:

- **Site** (`Site/`): front-end em HTML, CSS e JavaScript, criado a partir do protótipo no Figma "TCC - CineMatch". Não precisa de instalação.
- **API de recomendação**: servidor em Python que executa KNN, Matriz Fatorizada (SVD) e Rede Neural, aplicados à base do MovieLens. Ela fica fora deste repositório, e o site se comunica com ela por HTTP.

## Como abrir o site

1. Baixe o repositório inteiro (**Code → Download ZIP**) e extraia o arquivo.
2. Abra a pasta `Site` e dê dois cliques em `index.html`.

O `index.html` precisa ficar junto das pastas `css`, `js` e `img`. Aberto sozinho, o site aparece sem estilo e sem imagens.

A navegação, a busca e a avaliação de filmes funcionam sem a API. Já a aba **Sugestões** e o envio final dependem dela: com a API fora do ar, a tela mostra uma mensagem de erro com o botão **Tentar novamente**.

## Como funciona a participação

1. **Avaliar 5 filmes:** pela busca, o participante encontra filmes que já viu e dá uma nota de 0.5 a 5 estrelas. A nota é escolhida clicando ou arrastando sobre as estrelas (ou com as setas do teclado). O comentário é opcional. O início mostra o progresso, por exemplo "3 de 5 filmes avaliados · Faltam 2". Na página do filme, o botão **Editar avaliação** permite mudar a nota e o comentário depois de registrados.
2. **Avaliar as sugestões:** com o mínimo atingido, a aba **Sugestões** envia as avaliações à API e mostra, enquanto espera, o aviso "Processando recomendações...". Em seguida exibe as recomendações de KNN, SVD e Redes Neurais lado a lado, e o participante dá uma nota de 0.5 a 5 para cada algoritmo. Antes do mínimo, a aba avisa que ainda faltam filmes.
3. **Concluir:** com as três notas dadas, o botão **Enviar as três avaliações** manda as notas à API. Se o envio der certo, as avaliações guardadas no navegador são apagadas e o participante vai para a tela de conclusão.

A qualquer momento é possível avaliar mais filmes. Todos aparecem em **Ver mais**, na tela de filmes avaliados.

## Telas

| Arquivo | Tela |
|---|---|
| `index.html` | Início: como participar, progresso, destaque, busca e filmes em alta |
| `pesquisa.html` | Encontre seu próximo filme (ponto de partida da busca) |
| `resultados.html` | Resultados da pesquisa, com filtros por gênero, nota e década |
| `filme.html` | Filme: avaliar, ver a avaliação já registrada ou editá-la |
| `avaliacao-registrada.html` | Confirmação da avaliação (antes e depois do mínimo de cinco) |
| `sugestoes.html` | Comparar e avaliar os algoritmos, com recomendações vindas da API (ou aviso de mínimo não atingido) |
| `recomendado.html` | Filme recomendado por um algoritmo, com retorno à comparação |
| `avaliados.html` | Filmes avaliados desta participação |
| `concluido.html` | Avaliações enviadas |
| `sobre.html` | Sobre o projeto |

## Integração com a API

O site **não** executa os algoritmos. Toda a comunicação passa pela função `comunicacaoApi(rota, dados)`, em `Site/js/recomendacoes.js`, que envia um `POST` com JSON para a API. O endereço do servidor fica na constante `url` dessa função. Para usar outro servidor, basta alterá-la.

| Rota | O site envia | A API responde |
|---|---|---|
| `recomendacoes` | `{ "avaliacoes": { "<movieId>": { "nota", "comentario", "data" } } }` | `{ "knn": [...], "svd": [...], "ncf": [...] }`, com listas de `movieId`s de `movies_small.csv`, da recomendação mais forte para a mais fraca |
| `avaliacoes` | `{ "avaliacoes": { "knn": 4.5, "svd": 3.5, "ncf": 4 } }`, com a nota dada a cada algoritmo | Confirmação do registro |

Requisitos para a API funcionar com o site:

- Liberar CORS para o endereço de onde o site é aberto.
- Estar acessível pelo navegador de quem participa. Se o site for publicado em `https`, a API também precisa usar `https`, porque os navegadores bloqueiam chamadas `http` a partir de páginas seguras.

## Dados e limitações

- Os filmes, gêneros e notas vêm do **MovieLens** (`ml-latest-small`), em `movies_small.csv` e `ratings_small.csv`. A base vai até 2018.
- Títulos em português, sinopses, elenco e pôsteres vêm do **TMDB**.
- As avaliações dos filmes e as notas dos algoritmos ficam guardadas no navegador (`localStorage`) de quem usa o site, até o envio final. Elas não são compartilhadas entre pessoas, navegadores ou computadores.
- No envio, as notas dadas aos três algoritmos são registradas pela API, e os dados locais são apagados.

## Estrutura

```
Site/                       Site (abrir index.html)
  css/, img/                Estilos, pôsteres e ilustrações
  js/app.js                 Lógica das telas
  js/recomendacoes.js       Comunicação com a API (comunicacaoApi)
  js/catalogo.js            Catálogo de filmes gerado a partir da base
  ferramentas/              Gerador do catálogo (Python)
```

## Algoritmos de recomendação

Os algoritmos rodam na API, fora deste repositório. Cada um devolve o top 5 de filmes para o participante:

- **KNN:** filtragem colaborativa por vizinhos mais próximos.
- **SVD:** fatoração de matriz (matriz fatorizada).
- **Redes Neurais (NCF):** rede neural que combina vetores de usuário e filme.

A base completa do MovieLens pode ser baixada em [grouplens.org/datasets/movielens](https://grouplens.org/datasets/movielens/).

## Regenerar o catálogo e os pôsteres

Só é necessário se a base de filmes mudar. É preciso uma chave gratuita da API do TMDB, salva em `Projeto/tmdb_chave.txt` (arquivo que não é versionado):

```bash
cd Site/ferramentas
python gerar_catalogo.py
```

## Créditos

- Base de filmes e avaliações: [MovieLens](https://grouplens.org/datasets/movielens/), do GroupLens Research, Universidade de Minnesota.
- Sinopses, elenco e pôsteres: [TMDB](https://www.themoviedb.org/). Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
- Protótipo de interface: Figma "TCC - CineMatch".