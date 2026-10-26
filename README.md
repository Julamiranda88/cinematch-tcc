# CineMatch

Site de avaliação e recomendação de filmes, desenvolvido como Trabalho de Conclusão de Curso (TCC). O usuário busca filmes, avalia com notas e comentários, explora coleções sugeridas pela comunidade, vota na preferida e acompanha o próprio histórico.

O projeto tem duas partes:

- **Site** (`Site/`): front-end em HTML, CSS e JavaScript, sem servidor e sem instalação, criado a partir do protótipo no Figma "TCC - CineMatch".
- **Algoritmos de recomendação** (`Projeto/Código + Base/`): implementações em Python de KNN, Matriz Fatorizada (SVD) e Rede Neural, aplicadas à base do MovieLens.

## Como abrir o site

1. Baixe o repositório inteiro (**Code → Download ZIP**) e extraia o arquivo.
2. Abra a pasta `Site` e dê dois cliques em `index.html`.

O `index.html` precisa ficar junto das pastas `css`, `js` e `img`. Aberto sozinho, o site aparece sem estilo e sem imagens.

Para entrar, crie uma conta em **Cadastre-se** ou use a conta de demonstração:

- **E-mail:** joao.silva@email.com
- **Senha:** cinematch

## Funcionalidades

- Cadastro (nome, e-mail e senha) e login por e-mail, com validação, senhas guardadas em hash e botão para mostrar/ocultar a senha.
- Submenu da conta (Meu perfil, Minhas avaliações e Sair) ao clicar no avatar.
- Busca entre 9.742 filmes, com filtros por gênero, nota e década.
- Página de cada filme com sinopse, direção, elenco e nota da comunidade.
- Avaliação de 1 a 5 estrelas, com comentário opcional.
- Coleções sugeridas, votação e tela de confirmação.
- Perfil e histórico de avaliações, separados por usuário.

## Dados e limitações

- Os filmes, gêneros e notas vêm do **MovieLens** (`ml-latest-small`), em `movies_small.csv` e `ratings_small.csv`.
- Títulos em português, sinopses, elenco e pôsteres vêm do **TMDB**.
- Contas, avaliações e votos ficam guardados no navegador (`localStorage`) de quem usa o site. Não há servidor nem banco de dados, então esses dados não são compartilhados entre pessoas, navegadores ou computadores.

## Estrutura
Site/ Site (abrir index.html)
css/, js/, img/ Estilos, scripts e pôsteres
js/catalogo.js Catálogo de filmes gerado a partir da base
ferramentas/ Gerador do catálogo (Python)
Projeto/Código + Base/ Algoritmos de recomendação e bases CSV

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
