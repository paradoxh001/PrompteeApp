param(
  [Parameter(Mandatory=$true)][string]$Key,
  [Parameter(Mandatory=$true)][string]$Ep,
  [string]$Url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  [int]$MaxTokens = 16
)

# 清掉粘贴时可能带进来的换行、制表符等控制字符
$Key = ($Key -replace '[\r\n\t]', '').Trim()
$Ep  = ($Ep  -replace '[\r\n\t]', '').Trim()

$bodyObj = @{
  model      = $Ep
  messages   = @(@{ role = "user"; content = "你好" })
  max_tokens = $MaxTokens
}
$body = $bodyObj | ConvertTo-Json -Depth 5

Write-Host "目标地址 : $Url"
Write-Host "接入点ID : $Ep"
Write-Host "Key 长度 : $($Key.Length)"
Write-Host "请求体   : $body"
Write-Host ""

try {
  $resp = Invoke-RestMethod -Uri $Url -Method Post -Headers @{ Authorization = "Bearer $Key" } -ContentType "application/json" -Body $body -TimeoutSec 60
  Write-Host "结果: 成功" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 6
}
catch {
  Write-Host "结果: 失败" -ForegroundColor Red
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host "--- 服务端返回 ---"
    Write-Host $_.ErrorDetails.Message
  }
  Write-Host "--- 异常信息 ---"
  Write-Host $_.Exception.Message
}