# ComfyUI Stub PowerShell Testing Scripts

This guide provides commands to verify endpoints using PowerShell.

## 1. GET /health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8188/health" -Method GET
```

## 2. POST /run - Valid Request
```powershell
$body = @{
  event_id = "9b7a421e-ea14-48f1-8cb5-7eb77c8e9b88"
  event_type = "COMFYUI_GENERATION_REQUESTED"
  correlation_id = "18f94e96-a83d-4c3e-8c34-77e8a9394fa9"
  brand_id = "brand_demo_001"
  campaign_id = "campaign_demo_001"
  job_id = "job_demo_001"
  module_name = "comfyui-pipeline"
  callback_url = "http://localhost:5678/webhook/module-callback"
  payload = @{
    prompt = "A modern dark glassmorphism banner"
    negative_prompt = "blurry"
    steps = 25
  }
  safety = @{
    requires_approval = $true
    final_approval_granted = $true
    allow_real_world_action = $true
    allow_auto_publish = $false
    allow_ads_spend = $false
    allow_customer_messaging = $false
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:8188/run" -Method POST -Body $body -ContentType "application/json"
```

## 3. POST /run - Invalid Request (Missing Safety object)
```powershell
$body = @{
  event_id = "9b7a421e-ea14-48f1-8cb5-7eb77c8e9b88"
  correlation_id = "18f94e96-a83d-4c3e-8c34-77e8a9394fa9"
} | ConvertTo-Json

try {
  Invoke-WebRequest -Uri "http://localhost:8188/run" -Method POST -Body $body -ContentType "application/json"
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  $bodyText = $reader.ReadToEnd()
  Write-Output "Status: $([int]$_.Exception.Response.StatusCode) - $bodyText"
}
```

## 4. POST /simulate-callback
```powershell
$body = @{
  job_id = "job_demo_001"
  correlation_id = "18f94e96-a83d-4c3e-8c34-77e8a9394fa9"
  simulate_status = "COMPLETED"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8188/simulate-callback" -Method POST -Body $body -ContentType "application/json"
```
