# Run the MCP smoke tests with the project's .env.local loaded.
# Usage: pwsh lib/__tests__/run.ps1   (from the repo root)
Set-Location (Join-Path $PSScriptRoot "..\..")
npx tsx --env-file=.env.local lib/__tests__/mcp.test.ts
