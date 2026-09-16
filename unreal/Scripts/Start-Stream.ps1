# VR Garage - start Pixel Streaming from the shop PC.
#
# Prereqs: Unreal Engine 5.8, Node.js 18+, NVIDIA/AMD GPU with HW encoder.
# Usage:  .\Start-Stream.ps1 [-EngineDir "C:\Program Files\Epic Games\UE_5.8"]
param(
  [string]$EngineDir = ""
)

$ErrorActionPreference = "Stop"
$UnrealDir = Split-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) -Parent
$Project = Join-Path $UnrealDir "VRGarage.uproject"

if (-not $EngineDir) {
  foreach ($cand in @(
    "C:\Program Files\Epic Games\UE_5.8",
    "D:\Program Files\Epic Games\UE_5.8",
    "$env:ProgramFiles\Epic Games\UE_5.8"
  )) { if (Test-Path $cand) { $EngineDir = $cand; break } }
}
if (-not $EngineDir -or -not (Test-Path $EngineDir)) {
  Write-Host "Unreal Engine 5.8 not found. Pass -EngineDir explicitly." -ForegroundColor Red
  exit 1
}
Write-Host "Engine: $EngineDir" -ForegroundColor Cyan

$Cirrus = Join-Path $EngineDir "Engine\Source\Programs\PixelStreaming\WebServers\SignallingWebServer\cirrus.js"
if (-not (Test-Path $Cirrus)) { Write-Host "SignallingWebServer not found: $Cirrus" -ForegroundColor Red; exit 1 }
try { node --version | Out-Null } catch { Write-Host "Node.js is required for the signalling server." -ForegroundColor Red; exit 1 }

Write-Host "Starting signalling server on ws://127.0.0.1:8888 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node `"$Cirrus`" --port 8888" -WorkingDirectory (Split-Path $Cirrus -Parent)

$Editor = Join-Path $EngineDir "Engine\Binaries\Win64\UnrealEditor.exe"
$Map = "/Game/Garage/Maps/GarageBay"
Write-Host "Launching VRGarage (game mode, offscreen render) ..." -ForegroundColor Cyan
Write-Host "Then open VR Garage -> 3D Engine Viewer -> Unreal Engine stream -> Connect to UE." -ForegroundColor Yellow
& $Editor "`"$Project`"" $Map -game -PixelStreamingURL=ws://127.0.0.1:8888 -RenderOffScreen -ResX=1280 -ResY=720 -Log
