// Escala o site inteiro conforme a tela: o layout foi desenhado no Figma para 1280 × 832.
// Em telas maiores tudo cresce na mesma proporção (o lado que cresce menos manda, para nada sair da tela).
// Em telas menores que isso a escala fica em 1 e o layout responsivo do CSS assume.
(function () {
  const BASE_LARGURA = 1280;
  const BASE_ALTURA = 832;
  function ajustar() {
    const escala = Math.max(1, Math.min(window.innerWidth / BASE_LARGURA, window.innerHeight / BASE_ALTURA));
    document.documentElement.style.setProperty("--escala", escala);
    document.documentElement.style.zoom = escala;
  }
  ajustar();
  window.addEventListener("resize", ajustar);
})();
