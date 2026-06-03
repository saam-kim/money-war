$script = [System.IO.File]::ReadAllText("scratch/patch_clean.ps1", [System.Text.Encoding]::UTF8)
Invoke-Expression $script
