$path = "c:\Users\Nikhil\Downloads\multi-agent-truth-engine\server.ts"
$content = Get-Content $path
# We want to keep 0 to 606 (1-indexed lines 1-607)
# And then from 621 onwards
$newContent = $content[0..606] + $content[621..($content.Length - 1)]
$newContent | Set-Content $path
