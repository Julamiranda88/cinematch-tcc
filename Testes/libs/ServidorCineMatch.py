"""Servidor local usado pelos testes E2E do CineMatch.

- Serve os arquivos de Site/ (mesmo conteúdo publicado no GitHub Pages).
- Reescreve o endereço da API fixo em js/recomendacoes.js para /api/<rota> no próprio servidor.
  Assim toda chamada do site à API passa por aqui, sem precisar de CORS, e os testes conseguem:
    * conferir o payload que o site enviou e a resposta que os algoritmos devolveram;
    * repassar /recomendacoes para a API real (modo "real") ou responder dados fixos (modo "simulada");
    * capturar o envio final /avaliacoes sem gravá-lo na base da pesquisa (padrão), ou repassá-lo;
    * simular falhas da API para validar a tela de erro ("Tentar novamente").
"""

import json
import re
import sys
import threading
import urllib.error
import urllib.request
from copy import deepcopy
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from robot.api import logger
from robot.api.deco import keyword, library

URL_API_NO_SITE = re.compile(r"https?://[^`]+/\$\{rota\}")


@library(scope="GLOBAL", auto_keywords=False)
class ServidorCineMatch:

    def __init__(self):
        self._servidor = None
        self._thread = None
        self._lock = threading.Lock()
        self._requisicoes = []
        self._falhas = {}
        self.api_real = ""
        self.modo = "real"
        self.encaminhar_avaliacoes = False
        self.timeout = 60

    # ---------- Keywords ----------
    @keyword("Iniciar Servidor CineMatch")
    def iniciar_servidor(self, pasta_site, porta, api_real, modo="real", encaminhar_avaliacoes=False, timeout=60):
        """Sobe o servidor em http://localhost:<porta>. Se já estiver no ar, só atualiza a configuração."""
        self.api_real = str(api_real).rstrip("/")
        self.modo = str(modo).lower()
        self.encaminhar_avaliacoes = str(encaminhar_avaliacoes).lower() == "true"
        self.timeout = float(str(timeout).rstrip("s"))
        self.limpar_requisicoes()
        self.remover_falhas_da_api()
        if self._servidor:
            return
        pasta = Path(pasta_site).resolve()
        js = (pasta / "js" / "recomendacoes.js").read_text(encoding="utf-8")
        if not URL_API_NO_SITE.search(js):
            raise AssertionError("Não encontrei a URL da API em js/recomendacoes.js (const url = `http://.../${rota}`).")
        handler = partial(_Handler, self, directory=str(pasta))
        self._servidor = _ServidorSilencioso(("127.0.0.1", int(porta)), handler)
        self._thread = threading.Thread(target=self._servidor.serve_forever, daemon=True)
        self._thread.start()
        logger.info(f"Servidor CineMatch em http://localhost:{porta} · API {self.modo} ({self.api_real})")

    @keyword("Parar Servidor CineMatch")
    def parar_servidor(self):
        if self._servidor:
            self._servidor.shutdown()
            self._servidor.server_close()
            self._servidor = None

    @keyword("Limpar Requisições Da API")
    def limpar_requisicoes(self):
        with self._lock:
            self._requisicoes = []

    @keyword("Obter Requisições Da API")
    def obter_requisicoes(self, rota):
        """Lista de {'payload', 'status', 'resposta'} de cada chamada do site à rota, da mais antiga à mais recente."""
        with self._lock:
            return [deepcopy(r) for r in self._requisicoes if r["rota"] == rota]

    @keyword("Obter Última Requisição Da API")
    def obter_ultima_requisicao(self, rota):
        requisicoes = self.obter_requisicoes(rota)
        if not requisicoes:
            raise AssertionError(f"O site não chamou a rota '{rota}' da API.")
        return requisicoes[-1]

    @keyword("Simular Falha Da API")
    def simular_falha(self, rota, status=500):
        with self._lock:
            self._falhas[rota] = int(status)

    @keyword("Remover Falhas Da API")
    def remover_falhas_da_api(self):
        with self._lock:
            self._falhas = {}

    # ---------- Tratamento das chamadas ----------
    def _responder_api(self, rota, payload):
        with self._lock:
            falha = self._falhas.get(rota)
        if falha:
            return falha, {"erro": "falha simulada pelos testes"}
        if rota == "recomendacoes" and self.modo == "real":
            return self._repassar(rota, payload)
        if rota == "recomendacoes":
            return 200, self._recomendacoes_simuladas(payload)
        if rota == "avaliacoes" and self.encaminhar_avaliacoes:
            return self._repassar(rota, payload)
        if rota == "avaliacoes":
            return 200, {"mensagem": "Avaliações capturadas pelos testes (não enviadas à API real)"}
        return 404, {"erro": f"rota desconhecida: {rota}"}

    def _repassar(self, rota, payload):
        req = urllib.request.Request(
            f"{self.api_real}/{rota}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                return r.status, json.loads(r.read().decode("utf-8") or "null")
        except urllib.error.HTTPError as e:
            return e.code, {"erro": e.read().decode("utf-8", "replace")}
        except Exception as e:  # API fora do ar ou timeout
            return 502, {"erro": f"API real indisponível: {e}"}

    @staticmethod
    def _recomendacoes_simuladas(payload):
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from Catalogo import filmes_populares

        avaliados = {int(i) for i in (payload or {}).get("avaliacoes", {})}
        livres = [i for i in filmes_populares(60) if i not in avaliados]
        return {"knn": livres[0:5], "svd": livres[5:10], "ncf": livres[10:15]}

    def _registrar(self, rota, payload, status, resposta):
        with self._lock:
            self._requisicoes.append({"rota": rota, "payload": payload, "status": status, "resposta": resposta})


class _ServidorSilencioso(ThreadingHTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        # O browser cancela downloads quando a página navega antes de terminar (ex.: catalogo.js);
        # isso não é falha do site nem do teste.
        if isinstance(sys.exc_info()[1], (ConnectionAbortedError, ConnectionResetError, BrokenPipeError)):
            return
        super().handle_error(request, client_address)


class _Handler(SimpleHTTPRequestHandler):

    def __init__(self, servidor, *args, **kwargs):
        self.servidor = servidor
        super().__init__(*args, **kwargs)

    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?")[0] == "/js/recomendacoes.js":
            js = (Path(self.directory) / "js" / "recomendacoes.js").read_text(encoding="utf-8")
            js = URL_API_NO_SITE.sub("/api/${rota}", js)
            self._enviar(200, js.encode("utf-8"), "application/javascript; charset=utf-8")
            return
        super().do_GET()

    def do_POST(self):
        if not self.path.startswith("/api/"):
            self._enviar(404, b"{}", "application/json")
            return
        rota = self.path[len("/api/"):].split("?")[0]
        tamanho = int(self.headers.get("Content-Length") or 0)
        try:
            payload = json.loads(self.rfile.read(tamanho).decode("utf-8") or "null")
        except json.JSONDecodeError:
            payload = None
        status, resposta = self.servidor._responder_api(rota, payload)
        self.servidor._registrar(rota, payload, status, resposta)
        self._enviar(status, json.dumps(resposta).encode("utf-8"), "application/json")

    def _enviar(self, status, corpo, tipo):
        self.send_response(status)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)
