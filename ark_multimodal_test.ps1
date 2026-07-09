<#
.SYNOPSIS
  火山方舟 ARK 多模态 API 测试脚本（PowerShell + curl）
.DESCRIPTION
  使用 curl 调用 Doubao-vision-pro-32k 的多模态图文对话接口。
  请先设置环境变量: $env:ARK_API_KEY = "你的Key"
  重要：model 参数必须使用 ep-xxx 推理接入点 ID，禁止填写原始模型名。
#>

$ARK_API_KEY  = $env:ARK_API_KEY
$ENDPOINT     = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
$MODEL        = "ep-20260706162916-cwsp4"

$IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

$BODY = @"
{
  "model": "$MODEL",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "请用JSON格式详细描述这幅图。\n要求：\n1. 保留人物种族、性别、年龄、外貌特征、无纹身，动作、表情、姿态\n2. 保留场景环境\n3. 保留构图方式\n4. 保留镜头语言\n5. 保留光影氛围\n6. 保留色彩风格\n但不要描述人物当前上衣穿着的服装。请将服装上衣的描述替换为以下产品：\n\"上衣：图中的上衣\"\n输出完整中文版JSON。" },
        { "type": "image_url", "image_url": { "url": "data:image/png;base64,$IMAGE_BASE64", "detail": "high" } }
      ]
    }
  ],
  "max_tokens": 4096,
  "temperature": 0.3
}
"@

Write-Host "=== 火山方舟 ARK 多模态 API 测试 ===" -ForegroundColor Cyan
Write-Host "Endpoint: $ENDPOINT"
Write-Host "Model:    $MODEL"

if (-not $ARK_API_KEY) {
    Write-Host "[错误] 请先设置环境变量: `$env:ARK_API_KEY = '你的Key'" -ForegroundColor Red
    exit 1
}

try {
    $response = curl.exe -s -X POST $ENDPOINT `
        -H "Content-Type: application/json" `
        -H "Authorization: Bearer $ARK_API_KEY" `
        -d $BODY
    $parsed = $response | ConvertFrom-Json
    if ($parsed.choices -and $parsed.choices.Count -gt 0) {
        Write-Host "=== 返回结果 ===" -ForegroundColor Green
        Write-Host $parsed.choices[0].message.content
    } else {
        Write-Host "=== 原始响应 ===" -ForegroundColor Yellow
        Write-Host $response
    }
} catch {
    Write-Host "请求失败: $_" -ForegroundColor Red
}
