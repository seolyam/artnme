# Turns narration.json ({ id: text }) into <id>.wav clips plus durations.json (ms).
# Uses the built-in Windows voices, so it needs no API key.
param(
  [Parameter(Mandatory = $true)][string]$OutDir,
  [string]$Voice = "Microsoft Zira Desktop",
  [int]$Rate = 0
)

Add-Type -AssemblyName System.Speech
$lines = Get-Content -Raw -Path (Join-Path $OutDir "narration.json") | ConvertFrom-Json
$durations = [ordered]@{}

foreach ($prop in $lines.PSObject.Properties) {
  $wav = Join-Path $OutDir "$($prop.Name).wav"
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $synth.SelectVoice($Voice)
  $synth.Rate = $Rate
  $synth.SetOutputToWaveFile($wav)
  $synth.Speak($prop.Value)
  $synth.Dispose()

  # PCM WAV: data bytes / byte rate. Header is 44 bytes for SAPI output.
  $bytes = (Get-Item $wav).Length
  $reader = [System.IO.BinaryReader]::new([System.IO.File]::OpenRead($wav))
  $reader.BaseStream.Seek(28, 'Begin') | Out-Null
  $byteRate = $reader.ReadInt32()
  $reader.Close()
  $durations[$prop.Name] = [math]::Round(($bytes - 44) / $byteRate * 1000)
}

$durations | ConvertTo-Json | Set-Content -Path (Join-Path $OutDir "durations.json")
Write-Output "Wrote $($durations.Count) clips to $OutDir"
