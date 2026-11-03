<#
.SYNOPSIS
  Copy skills from this central_skills library into a project.

.EXAMPLES
  # See what's available
  .\install-skills.ps1 -List

  # Install a ready-made bundle into a project (Claude Code: .claude\skills)
  .\install-skills.ps1 -ProjectPath C:\Dev\my-app -Bundle web

  # Install specific skills
  .\install-skills.ps1 -ProjectPath C:\Dev\my-app -Skills clean-typescript,web-security,code-review

  # Install for Codex (.codex\skills) or the generic agents layout (.agents\skills)
  .\install-skills.ps1 -ProjectPath C:\Dev\my-app -Bundle core -Target codex

  # Overwrite skills that already exist in the project
  .\install-skills.ps1 -ProjectPath C:\Dev\my-app -Bundle all -Force

  # Install Claude Code sub-agents (.claude\agents)
  .\install-skills.ps1 -ProjectPath C:\Dev\my-app -Agents DocsExplorer
  .\install-skills.ps1 -ProjectPath C:\Dev\my-app -AgentBundle crm-dev-team
  .\install-skills.ps1 -ProjectPath C:\Dev\my-app -Bundle web -AgentBundle all
#>
[CmdletBinding()]
param(
    [string]   $ProjectPath,
    [string[]] $Skills,
    [ValidateSet('core', 'web', 'mobile', 'backend', 'all')]
    [string]   $Bundle,
    [string[]] $Agents,
    [ValidateSet('cmd-dev-manage-team', 'crm-dev-team', 'all')]
    [string]   $AgentBundle,
    [ValidateSet('claude', 'codex', 'agents')]
    [string]   $Target = 'claude',
    [switch]   $Force,
    [switch]   $List
)

$ErrorActionPreference = 'Stop'
$LibRoot   = $PSScriptRoot
$SkillsDir = Join-Path $LibRoot 'skills'
$AgentsDir = Join-Path $LibRoot 'agents'

$Bundles = @{
    core    = @('clean-typescript', 'web-security', 'code-review', 'npm-package-manager')
    web     = @('modern-best-practice-react-components', 'modern-accessible-html-jsx', 'modern-browser-apis',
                'modern-tailwind', 'modern-best-practice-nextjs', 'vercel-react-next-best-practices')
    mobile  = @('react-npm-compat', 'modern-best-practice-react-components', 'vercel-react-native-skills',
                'modern-best-practice-react-native-expo-components')
    backend = @('api-structure', 'backend-api-structure', 'react-express-starter', 'sqlite-explorer',
                'better-auth-best-practices')
}

$AgentBundles = @{
    'cmd-dev-manage-team' = @('frontend-ui-engineer', 'senior-code-reviewer', 'test-engineer')
    'crm-dev-team'        = @('dev-orchestrator', 'frontend-engineer', 'backend-architect', 'code-reviewer', 'playwright-test-engineer')
}

$Available       = Get-ChildItem -Path $SkillsDir -Directory | Sort-Object Name | Select-Object -ExpandProperty Name
$AvailableAgents = Get-ChildItem -Path $AgentsDir -Filter *.md | Sort-Object Name | ForEach-Object { $_.BaseName }

if ($List) {
    Write-Host "`nSkills in $SkillsDir`n" -ForegroundColor Cyan
    $Available | ForEach-Object { Write-Host "  $_" }
    Write-Host "`nBundles (web, mobile and backend also include core):" -ForegroundColor Cyan
    foreach ($b in 'core', 'web', 'mobile', 'backend') { Write-Host ("  {0,-8} {1}" -f $b, ($Bundles[$b] -join ', ')) }
    Write-Host "  all      every skill above"
    Write-Host "`nAgents in $AgentsDir (Claude Code only, installed to .claude\agents)`n" -ForegroundColor Cyan
    $AvailableAgents | ForEach-Object { Write-Host "  $_" }
    Write-Host "`nAgent bundles:" -ForegroundColor Cyan
    foreach ($b in 'cmd-dev-manage-team', 'crm-dev-team') { Write-Host ("  {0,-20} {1}" -f $b, ($AgentBundles[$b] -join ', ')) }
    Write-Host "  all                  every agent above`n"
    return
}

if (-not $ProjectPath) { throw "Please give -ProjectPath (the project folder to install into), or use -List." }
if (-not (Test-Path -LiteralPath $ProjectPath -PathType Container)) { throw "Project folder not found: $ProjectPath" }
if (-not $Skills -and -not $Bundle -and -not $Agents -and -not $AgentBundle) {
    throw "Please give -Skills / -Bundle and/or -Agents / -AgentBundle. Run with -List to see names."
}

# Work out the list of skills to install
$Selected = New-Object System.Collections.Generic.List[string]
if ($Bundle -eq 'all') {
    $Available | ForEach-Object { $Selected.Add($_) }
} elseif ($Bundle) {
    if ($Bundle -ne 'core') { $Bundles['core'] | ForEach-Object { $Selected.Add($_) } }
    $Bundles[$Bundle] | ForEach-Object { $Selected.Add($_) }
}
foreach ($s in $Skills) { foreach ($part in ($s -split ',')) { if ($part.Trim()) { $Selected.Add($part.Trim()) } } }
$Selected = $Selected | Select-Object -Unique

$Unknown = $Selected | Where-Object { $Available -notcontains $_ }
if ($Unknown) { throw ("Unknown skill(s): {0}. Run with -List to see names." -f ($Unknown -join ', ')) }

# Work out the list of agents to install
$SelectedAgents = New-Object System.Collections.Generic.List[string]
if ($AgentBundle -eq 'all') { $AvailableAgents | ForEach-Object { $SelectedAgents.Add($_) } }
elseif ($AgentBundle)       { $AgentBundles[$AgentBundle] | ForEach-Object { $SelectedAgents.Add($_) } }
foreach ($a in $Agents) { foreach ($part in ($a -split ',')) { if ($part.Trim()) { $SelectedAgents.Add(($part.Trim() -replace '\.md$', '')) } } }
if ($Selected -contains 'cmd-dev-manage') { $AgentBundles['cmd-dev-manage-team'] | ForEach-Object { $SelectedAgents.Add($_) } }
$SelectedAgents = @($SelectedAgents | Select-Object -Unique)

$UnknownAgents = $SelectedAgents | Where-Object { $AvailableAgents -notcontains $_ }
if ($UnknownAgents) { throw ("Unknown agent(s): {0}. Run with -List to see names." -f ($UnknownAgents -join ', ')) }

$SubDir = @{ claude = '.claude\skills'; codex = '.codex\skills'; agents = '.agents\skills' }[$Target]
$Dest   = Join-Path $ProjectPath $SubDir
if ($Selected) { New-Item -ItemType Directory -Path $Dest -Force | Out-Null }

$installed = 0; $skipped = 0
foreach ($name in $Selected) {
    $src = Join-Path $SkillsDir $name
    $dst = Join-Path $Dest $name
    if (Test-Path -LiteralPath $dst) {
        if (-not $Force) { Write-Host "  skip    $name (already in project - use -Force to overwrite)" -ForegroundColor Yellow; $skipped++; continue }
        Remove-Item -LiteralPath $dst -Recurse -Force
    }
    Copy-Item -LiteralPath $src -Destination $dst -Recurse
    Write-Host "  copied  $name" -ForegroundColor Green
    $installed++
}

# Sub-agents are a Claude Code feature, always installed to .claude\agents
# (cmd-dev-manage automatically pulls in its three agents)
$agentsInstalled = 0
if ($SelectedAgents.Count -gt 0) {
    if ($Target -ne 'claude' -and -not $Agents -and -not $AgentBundle) {
        Write-Warning "cmd-dev-manage uses Claude Code sub-agents; they are installed to .claude\agents even though -Target is '$Target'."
    }
    $agentDest = Join-Path $ProjectPath '.claude\agents'
    New-Item -ItemType Directory -Path $agentDest -Force | Out-Null
    foreach ($a in $SelectedAgents) {
        $from = Join-Path $AgentsDir "$a.md"
        $to   = Join-Path $agentDest "$a.md"
        if ((Test-Path -LiteralPath $to) -and -not $Force) {
            Write-Host "  skip    agent $a (already in project - use -Force to overwrite)" -ForegroundColor Yellow; $skipped++; continue
        }
        Copy-Item -LiteralPath $from -Destination $to -Force
        Write-Host "  copied  agent $a" -ForegroundColor Green
        $agentsInstalled++
    }
}

Write-Host ("`nDone: {0} skill(s) and {1} agent(s) installed, {2} skipped." -f $installed, $agentsInstalled, $skipped) -ForegroundColor Cyan
if ($Selected)       { Write-Host "  skills -> $Dest" }
if ($SelectedAgents) { Write-Host ("  agents -> {0}" -f (Join-Path $ProjectPath '.claude\agents')) }
if ($SelectedAgents -contains 'dev-orchestrator') {
    Write-Host "  note    dev-orchestrator: hands backend work to 'backend-engineer', but the agent is named 'backend-architect' - rename one so they match." -ForegroundColor Magenta
}

# Reminders for skills that need something extra
$Notes = @{
    'gemini-image-gen'               = 'needs: pip install google-genai  and  GEMINI_API_KEY environment variable'
    'sqlite-explorer'                = 'needs: Bun installed (script runs with bun)'
    'docx'                           = 'needs: Python 3, npm install -g docx; pandoc / LibreOffice for some operations (see SKILL.md)'
    'playwright-cli'                 = 'needs: npm install -g @playwright/cli@latest  (or a local npx playwright cli)'
    'paris-sport-hub-email-responder'= 'needs: Gmail connector in Claude'
    'digitech-design'                = 'INCOMPLETE: brand files (README, colors_and_type.css, assets/, ui_kits/, preview/) are missing'
}
foreach ($name in $Selected) { if ($Notes.ContainsKey($name)) { Write-Host "  note    ${name}: $($Notes[$name])" -ForegroundColor Magenta } }
