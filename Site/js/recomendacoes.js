// CineMatch — ponto de integração com a api
//
// Os algoritmos (KNN, SVD e Redes Neurais/NCF) são implementados à parte, em Python.
//
// A rota 'recomendacoes' envia as avaliações do participante para a API e recebe de volta, 
// para cada algoritmo, uma lista de movieIds.
// Ela envia as avaliações do participante no formato {'avaliacoes': { movieId: { nota, comentario, data } }},
// e recebe as recomendações no formato { knn: [movieId1, movieId2, ...], svd: [...], ncf: [...] }.
//
// A rota 'avaliacoes' envia as avaliações dos algoritmos para a API.
// Ela envia as avaliações dos algoritmos no formato {'avaliacoes': { knn: '', svd: '', ncf: ''}}

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

async function comunicacaoApi(rota, dados) {

    const url = `http://77.113.59.232:8000/${rota}`;
    
    if (!dados || Object.keys(dados).length === 0) {
        throw new Error("Nenhum dado fornecido.");
    }

    try {
        const resposta = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        // Verifica se a API retornou erro (ex: 404, 500)
        if (!resposta.ok) {
            throw new Error(`Erro na API: ${resposta.status}`);
        }

        // Converte a resposta da API de volta para um objeto JavaScript
        const mensagem = await resposta.json();
        console.log("Mensagem final:", mensagem);
        
        return mensagem;

    } catch (erro) {
        throw new Error("Falha ao comunicar com o servidor:", erro);
    }

}