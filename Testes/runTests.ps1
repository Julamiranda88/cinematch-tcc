# Executa os testes do CineMatch a partir da raiz do repositório.
# Uso:
#   ./Testes/runTests.ps1                         # todas as suítes
#   ./Testes/runTests.ps1 Testes/Tests/Participacao  # uma pasta ou arquivo
#   ./Testes/runTests.ps1 Testes/Tests -ModoApi simulada -Visivel
param(
    [string]$Alvo = "Testes/Tests",
    [ValidateSet("real", "simulada")] [string]$ModoApi = "real",
    [switch]$Visivel,
    [switch]$EnviarAvaliacoes
)

$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

$headless = if ($Visivel) { "False" } else { "True" }
$slowmo = if ($Visivel) { "300ms" } else { "0ms" }
$enviar = if ($EnviarAvaliacoes) { "True" } else { "False" }

python -m robot `
    --variable MODO_API:$ModoApi `
    --variable HEADLESS:$headless `
    --variable SLOWMO:$slowmo `
    --variable ENVIAR_AVALIACOES_PARA_API:$enviar `
    --exclude robustez `
    -d ./Testes/logs `
    -x outputxunit.xml `
    $Alvo
