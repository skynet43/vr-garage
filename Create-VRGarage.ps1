# ================================================
# VR Garage - Complete Project Bootstrap
# ================================================

$Root = "D:\VRGarage"

Write-Host ""
Write-Host "Creating VR Garage..." -ForegroundColor Cyan

$Folders = @(
".github",".github\workflows",".vscode",
"app","desktop",
"src","src\assets","src\components","src\components\common","src\components\layout",
"src\components\viewer","src\pages","src\routes","src\hooks","src\styles",
"src\store","src\context","src\utils","src\types",
"database","database\schema","database\models","database\seed",
"database\migrations","database\backups",
"vehicles","parts","procedures",
"viewer","viewer\models","viewer\textures","viewer\materials",
"viewer\animations","viewer\lighting","viewer\physics",
"viewer\exploded","viewer\cameras",
"vr","services","plugins",
"ai","ai\agents","ai\skills","ai\prompts","ai\memory",
"assets","assets\icons","assets\images","assets\fonts",
"assets\logos","assets\audio","assets\video",
"docs","docs\api","docs\architecture","docs\design",
"docs\manuals","docs\images","docs\research",
"tests","tests\unit","tests\integration","tests\e2e","tests\data",
"scripts","installer","config","logs","temp","backups"
)

foreach($Folder in $Folders){
    New-Item -ItemType Directory -Force -Path (Join-Path $Root $Folder) | Out-Null
}

$RootFiles=@(
"README.md","AGENTS.md","SKILLS.md","ROADMAP.md","ARCHITECTURE.md",
"CHANGELOG.md","CONTRIBUTING.md","SECURITY.md","CODE_OF_CONDUCT.md",
"INSTALL.md","BUILD.md","TODO.md","LICENSE","AUTHORS.md","CREDITS.md",
"FAQ.md","API.md","DATABASE.md","STYLEGUIDE.md","CODING-STANDARDS.md",
"TESTING.md","RELEASE.md","VERSIONING.md","PLUGIN-SDK.md",
"VEHICLE-DATA.md","PARTS-DATABASE.md","TORQUE-SPECS.md","WIRING.md",
"DIAGNOSTICS.md","REPAIR-PROCEDURES.md","3D-VIEWER.md","VR-SUPPORT.md",
"USER-GUIDE.md","DEVELOPER-GUIDE.md","KNOWN-ISSUES.md",
"CHANGE-REQUESTS.md","MILESTONES.md","FEATURES.md","BACKLOG.md","NOTES.md",
"package.json","package-lock.json","tsconfig.json",
"vite.config.ts","electron.vite.config.ts",
".gitignore",".gitattributes",".editorconfig",".prettierrc",
".eslintrc.json",".env",".env.example",".npmrc"
)

foreach($File in $RootFiles){
    New-Item -ItemType File -Force -Path (Join-Path $Root $File) | Out-Null
}

$Agents=@(
"ProjectManager","Architecture","Desktop","Frontend","Backend","Database",
"SQLite","API","Viewer","ThreeJS","Renderer","Vehicle","Engine",
"Transmission","Suspension","Brake","Electrical","Wiring","Diagnostics",
"OBD","Repair","Procedure","Parts","Inventory","Search","VIN","Torque",
"Printing","PDF","Export","Import","Settings","Theme","Plugin",
"Installer","Updater","Authentication","Logging","Telemetry","Security",
"Performance","Memory","Testing","UnitTests","IntegrationTests","E2E",
"Documentation","Release","DevOps","CI","Build","Assets","Animation",
"Physics","VR","AI","Voice","Localization","Accessibility"
)

foreach($A in $Agents){
    New-Item -ItemType File -Force -Path (Join-Path $Root "ai\agents\$A.agent.md") | Out-Null
}

$Skills=@(
"Project","Architecture","Desktop","Electron","React","TypeScript",
"JavaScript","NodeJS","Vite","Database","SQLite","SQL","API","Backend",
"Frontend","UI","UX","ThreeJS","Renderer","Animation","Physics",
"Materials","Textures","Lighting","Camera","Viewer","Vehicle","Engine",
"Transmission","Suspension","Steering","Brakes","Electrical","Wiring",
"Diagnostics","OBD","DTC","VIN","Repair","Procedures","Parts",
"Inventory","Torque","Fluids","Search","Printing","PDF","Import",
"Export","Plugin","Settings","Themes","Installer","Updater","Security",
"Performance","Logging","Telemetry","Testing","UnitTests",
"IntegrationTests","E2E","Accessibility","Localization",
"Documentation","Build","CI","Release","VR","AI","Voice"
)

foreach($S in $Skills){
    New-Item -ItemType File -Force -Path (Join-Path $Root "ai\skills\$S.skills.md") | Out-Null
}

Write-Host ""
Write-Host "VR Garage bootstrap complete!" -ForegroundColor Green
Write-Host "Location: $Root" -ForegroundColor Yellow
