// CineMatch — ponto de integração com os algoritmos de recomendação
//
// Os algoritmos (KNN, SVD e Redes Neurais/NCF) são implementados à parte, em Python.
// Enquanto isso, obterRecomendacoes() devolve as listas de demonstração do Figma.
//
// Para integrar: faça obterRecomendacoes() devolver, para cada algoritmo, uma lista de
// movieIds (os mesmos de movies_small.csv), da recomendação mais forte para a mais fraca.
// Ela recebe as avaliações do participante no formato { movieId: { nota, comentario, data } }.

const ALGORITMOS = [
  {
    id: "knn",
    nome: "KNN",
    metodo: "Baseado em vizinhos",
    descricao: "Seu gosto tem companhia! Usa avaliações de vizinhos com preferências parecidas para sugerir filmes.",
    explicacao: "Seu gosto tem companhia! O KNN usa avaliações de vizinhos com preferências parecidas para sugerir filmes.",
  },
  {
    id: "svd",
    nome: "SVD",
    metodo: "Fatoração de matrizes",
    descricao: "Nos bastidores das notas! Encontre fatores latentes que aproximam seus gostos e os filmes.",
    explicacao: "Nos bastidores das notas! O SVD encontra fatores latentes que aproximam seus gostos e os filmes.",
  },
  {
    id: "ncf",
    nome: "Redes Neurais",
    sigla: "NCF",
    metodo: "NCF",
    descricao: "Conexões de cinema! Aprende relações não lineares entre usuários e filmes para recomendar.",
    explicacao: "Conexões de cinema! A rede neural (NCF) aprende relações não lineares entre usuários e filmes para recomendar.",
  },
];

// Listas de demonstração (A Chegada, Gravidade, Perdido em Marte, Matrix e Blade Runner 2049)
const RECOMENDACOES_DEMO = {
  knn: [164179, 104841, 134130, 2571, 176371],
  svd: [134130, 164179, 104841, 176371, 2571],
  ncf: [104841, 134130, 164179, 2571, 176371],
};

function obterRecomendacoes(avaliacoes) { // eslint-disable-line no-unused-vars
  return RECOMENDACOES_DEMO;
}
