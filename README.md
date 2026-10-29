# CineMatch

Site de avaliação de filmes desenvolvido como Trabalho de Conclusão de Curso (TCC) para comparar sistemas de recomendação. O participante avalia pelo menos cinco filmes, compara as sugestões de três algoritmos (KNN, SVD e Redes Neurais) e dá de 1 a 5 estrelas às recomendações de cada um.

O projeto tem duas partes:

- **Site** (`Site/`): front-end em HTML, CSS e JavaScript, sem servidor e sem instalação, criado a partir do protótipo no Figma "TCC - CineMatch".
- **Algoritmos de recomendação** (`Projeto/Código + Base/`): implementações em Python de KNN, Matriz Fatorizada (SVD) e Rede Neural, aplicadas à base do MovieLens.

## Como abrir o site

1. Baixe o repositório inteiro (**Code → Download ZIP**) e extraia o arquivo.
2. Abra a pasta `Site` e dê dois cliques em `index.html`.

O `index.html` precisa ficar junto das pastas `css`, `js` e `img`. Aberto sozinho, o site aparece sem estilo e sem imagens.

## Como funciona a participação

1. **Avaliar 5 filmes:** pela busca, o participante encontra filmes que já viu e dá de 1 a 5 estrelas (o comentário é opcional). O início mostra o progresso, por exemplo "3 de 5 filmes avaliados · Faltam 2".
2. **Avaliar as sugestões:** com o mínimo atingido, a aba **Sugestões** mostra as recomendações de KNN, SVD e Redes Neurais lado a lado, e o participante dá uma nota de 1 a 5 para cada algoritmo. Antes disso, a aba avisa que ainda faltam filmes.
3. **Concluir:** com as três notas dadas, o botão **Enviar as três avaliações** registra a participação.

A qualquer momento é possível avaliar mais filmes. Todos aparecem em **Ver mais**, na tela de filmes avaliados.

## Telas

| Arquivo | Tela |
|---|---|
| `index.html` | Início: como participar, progresso, destaque, busca e filmes em alta |
| `pesquisa.html` | Encontre seu próximo filme (ponto de partida da busca) |
| `resultados.html` | Resultados da pesquisa, com filtros por gênero, nota e década |
| `filme.html` | Filme: avaliar ou ver a avaliação já registrada |
| `avaliacao-registrada.html` | Confirmação da avaliação (antes e depois do mínimo de cinco) |
| `sugestoes.html` | Comparar e avaliar os algoritmos (ou aviso de mínimo não atingido) |
| `recomendado.html` | Filme recomendado por um algoritmo, com retorno à comparação |
| `avaliados.html` | Filmes avaliados desta participação |
| `concluido.html` | Avaliações enviadas |
| `sobre.html` | Sobre o projeto |

## Integração com os algoritmos

O site **não** executa os algoritmos. As recomendações vêm da função `obterRecomendacoes()`, em `Site/js/recomendacoes.js`. Hoje ela devolve as listas de demonstração do Figma.

Para integrar, essa função deve devolver, para cada algoritmo (`knn`, `svd` e `ncf`), uma lista de `movieId`s de `movies_small.csv`, da recomendação mais forte para a mais fraca. Ela recebe as avaliações do participante no formato `{ movieId: { nota, comentario, data } }`.

Cada envio fica guardado no navegador, na chave `cinematch:envios` do `localStorage`, com as notas dos três algoritmos, os filmes avaliados e as recomendações mostradas.

## Dados e limitações

- Os filmes, gêneros e notas vêm do **MovieLens** (`ml-latest-small`), em `movies_small.csv` e `ratings_small.csv`. A base vai até 2018.
- Títulos em português, sinopses, elenco e pôsteres vêm do **TMDB**.
- Avaliações e envios ficam guardados no navegador (`localStorage`) de quem usa o site. Não há servidor nem banco de dados, então esses dados não são compartilhados entre pessoas, navegadores ou computadores.

## Estrutura

```
Site/                       Site (abrir index.html)
  css/, img/                Estilos, pôsteres e ilustrações
  js/app.js                 Lógica das telas
  js/recomendacoes.js       Ponto de integração com os algoritmos
  js/catalogo.js            Catálogo de filmes gerado a partir da base
  ferramentas/              Gerador do catálogo (Python)
Projeto/Código + Base/      Algoritmos de recomendação e bases CSV
```

## Algoritmos de recomendação

Em `Projeto/Código + Base/`, o `main.py` carrega a base, cadastra um usuário fictício com cinco avaliações e gera o top 5 de recomendações com cada algoritmo:

- `knn.py`: filtragem colaborativa por vizinhos mais próximos.
- `matriz_fatorizada.py`: fatoração de matriz (SVD).
- `rede_neural.py`: rede neural.
- `filtros.py`: filtro de gêneros, com base no perfil do usuário.

Para executar:

```bash
cd "Projeto/Código + Base"
python main.py
```

O `ratings.csv` completo (cerca de 877 MB) não está neste repositório. O `main.py` usa a versão reduzida, `ratings_small.csv`, que está incluída. A base completa pode ser baixada em [grouplens.org/datasets/movielens](https://grouplens.org/datasets/movielens/).

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
