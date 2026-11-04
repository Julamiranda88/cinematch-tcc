*** Settings ***
Documentation       Locators comuns a todas as telas (cabeçalho e rodapé)

Resource            ../../../configs/base.resource

*** Variables ***
${menuInicio_Click}                 css=.main-nav a[href="index.html"]
${menuSugestoes_Click}              css=.main-nav a[href="sugestoes.html"]
${menuSobre_Click}                  css=.main-nav a[href="sobre.html"]
${menuAtivo_label}                  css=.main-nav a[aria-current="page"]
${marcaCineMatch_Click}             css=header .brand
${rodape_label}                     css=footer.site-footer
${sobreTitulo_label}                css=h1.page-title
