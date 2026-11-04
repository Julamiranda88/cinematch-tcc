*** Settings ***
Documentation       Testes da avaliação de filmes: nota, comentário, edição e liberação das sugestões

Resource            ../../configs/base.resource

Suite Setup         Iniciar ambiente CineMatch publicado
Suite Teardown      Encerrar ambiente CineMatch


*** Test Cases ***

Caso de Teste 01: Envio bloqueado enquanto não houver nota
    [Documentation]    Sem nota, "Enviar avaliação" fica desabilitado mesmo com comentário.
    [Tags]      CT01_FilmeEnvioSemNota
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante abra um filme ainda não avaliado
    Então o envio da avaliação deverá ficar bloqueado sem nota
    [Teardown]    Encerrar sessão do participante


Caso de Teste 02: Avaliar filme com meia estrela e comentário
    [Documentation]    Nota 3,5 com comentário é registrada no navegador e exibida na página do filme.
    [Tags]      CT02_FilmeAvaliarMeiaEstrela
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante abra um filme ainda não avaliado
    Quando avaliar o filme com meia estrela e comentário
    Então a avaliação deverá ser registrada com a nota e o comentário
    E a página do filme deverá exibir a avaliação registrada
    [Teardown]    Encerrar sessão do participante


Caso de Teste 03: Comentário limitado a 500 caracteres
    [Documentation]    O campo de opinião aceita no máximo 500 caracteres e o contador acompanha.
    [Tags]      CT03_FilmeLimiteComentario
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante abra um filme ainda não avaliado
    Quando escrever um comentário maior que o limite de 500 caracteres
    Então o comentário deverá ser limitado a 500 caracteres
    [Teardown]    Encerrar sessão do participante


Caso de Teste 04: Editar avaliação já registrada
    [Documentation]    "Editar avaliação" troca nota e comentário sem criar uma segunda avaliação.
    [Tags]      CT04_FilmeEditarAvaliacao
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante já tenha avaliado um filme
    Quando editar a nota e o comentário da avaliação
    Então a avaliação editada deverá substituir a anterior
    [Teardown]    Encerrar sessão do participante


Caso de Teste 05: Cancelar edição mantém a avaliação original
    [Documentation]    Mudar a nota e clicar em Cancelar não altera o que foi registrado.
    [Tags]      CT05_FilmeCancelarEdicao
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante já tenha avaliado um filme
    Quando desistir da edição da avaliação
    Então a avaliação original deverá ser mantida
    [Teardown]    Encerrar sessão do participante


Caso de Teste 06: Quinta avaliação libera as sugestões
    [Documentation]    Ao atingir o mínimo de 5 filmes, a confirmação oferece "Avaliar sugestões".
    [Tags]      CT06_FilmeQuintaAvaliacao
    [Setup]    Iniciar sessão de novo participante
    Dado que o participante já tenha avaliado 4 filmes
    Quando avaliar o quinto filme
    Então a confirmação deverá liberar a avaliação das sugestões
    [Teardown]    Encerrar sessão do participante
