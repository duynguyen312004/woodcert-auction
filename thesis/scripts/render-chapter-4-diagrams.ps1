$ErrorActionPreference = 'Stop'

$thesisRoot = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $thesisRoot 'diagrams\plantuml'
$outputDir = Join-Path $thesisRoot 'figures\chapter-4'
$plantUmlJar = Join-Path $PSScriptRoot 'plantuml.jar'
$svgToPdfScript = Join-Path $PSScriptRoot 'convert-svg-to-pdf.py'

$diagrams = @(
    'system_architecture.puml',
    'package_diagram.puml',
    'auction_class_diagram.puml',
    'ui-area-map.puml',
    'core-services-class.puml',
    'active_bidding_sequence.puml',
    'auction_closure_sequence.puml',
    'order-fulfillment-sequence.puml',
    'erd-identity-catalog.puml',
    'erd_diagram.puml',
    'erd-order-dispute.puml',
    'production-deployment.puml',
    'ci-cd-activity.puml'
)

if (-not (Test-Path -LiteralPath $plantUmlJar)) {
    throw "PlantUML jar not found: $plantUmlJar"
}
if (-not (Test-Path -LiteralPath $svgToPdfScript)) {
    throw "SVG-to-PDF converter not found: $svgToPdfScript"
}

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

Push-Location $sourceDir
try {
    & java '-Dfile.encoding=UTF-8' -jar $plantUmlJar `
        -charset UTF-8 `
        -tsvg `
        -o '../../figures/chapter-4' `
        $diagrams

    if ($LASTEXITCODE -ne 0) {
        throw "PlantUML SVG render exited with code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

$svgFiles = foreach ($diagram in $diagrams) {
    Join-Path $outputDir ([System.IO.Path]::ChangeExtension($diagram, '.svg'))
}

& python $svgToPdfScript $svgFiles
if ($LASTEXITCODE -ne 0) {
    throw "SVG-to-PDF conversion exited with code $LASTEXITCODE"
}

$missing = foreach ($diagram in $diagrams) {
    foreach ($extension in @('.svg', '.pdf')) {
        $renderedName = [System.IO.Path]::ChangeExtension($diagram, $extension)
        if (-not (Test-Path -LiteralPath (Join-Path $outputDir $renderedName))) {
            $renderedName
        }
    }
}

if ($missing) {
    throw "Missing rendered SVG files: $($missing -join ', ')"
}

Write-Host "Rendered $($diagrams.Count) Chapter 4 diagrams as SVG and PDF to $outputDir"
