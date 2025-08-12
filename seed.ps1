$ErrorActionPreference = 'Stop'

Write-Host 'Aguardando o servidor iniciar em http://localhost:3000 ...'

$maxAttempts = 40
for ($i = 0; $i -lt $maxAttempts; $i++) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/login' -Method GET -TimeoutSec 2
    if ($r.StatusCode -eq 200) { break }
  } catch {
    Start-Sleep -Milliseconds 500
  }
}

if ($i -ge $maxAttempts) {
  throw 'Servidor não respondeu a tempo. Verifique se está rodando em http://localhost:3000'
}

Write-Host 'Servidor disponível. Iniciando criação de usuários de teste...'

$base = 'http://localhost:3000/api'

function Register-User($name, $email, $password) {
  try {
    $body = @{ name = $name; email = $email; password = $password } | ConvertTo-Json
    $res = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $body
    return $res
  } catch {
    $err = $_.Exception.Response
    if ($err -and $err.StatusCode.value__ -eq 400) {
      Write-Host "Usuário já existe: $email"
      return $null
    } else {
      throw
    }
  }
}

function Login-User($email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $res = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body
  return $res
}

function Create-Appointment($token, $branch, $professional, $service, $datetime) {
  $headers = @{ Authorization = "Bearer $token" }
  $body = @{ branch = $branch; professional = $professional; service = $service; datetime = $datetime } | ConvertTo-Json
  $res = Invoke-RestMethod -Method Post -Uri "$base/appointments" -Headers $headers -ContentType 'application/json' -Body $body
  return $res
}

# Usuários de teste
$users = @(
  @{ name = 'Admin Teste';    email = 'admin@teste.com';    password = '123456' },
  @{ name = 'Barbeiro Teste'; email = 'barbeiro@teste.com'; password = '123456' },
  @{ name = 'Cliente Teste';  email = 'cliente@teste.com';  password = '123456' }
)

foreach ($u in $users) {
  Register-User -name $u.name -email $u.email -password $u.password | Out-Null
}

Write-Host 'Realizando login como Cliente Teste para criar agendamentos...'
$login = Login-User -email 'cliente@teste.com' -password '123456'
$token = $login.accessToken

if (-not $token) { throw 'Falha ao obter token do cliente.' }

Write-Host 'Criando agendamentos de exemplo...'
Create-Appointment -token $token -branch 'Matriz' -professional 'João'  -service 'Corte Tradicional' -datetime ((Get-Date).AddDays(1).Date.AddHours(14)).ToString('s') | Out-Null
Create-Appointment -token $token -branch 'Filial Centro' -professional 'Carlos' -service 'Barba Completa'   -datetime ((Get-Date).AddDays(2).Date.AddHours(10)).ToString('s') | Out-Null

Write-Host 'Seed concluído com sucesso.'

