$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$filePath = (Get-Item "public\AssetSample.xlsx").FullName
$wb = $excel.Workbooks.Open($filePath)
Write-Output "--- SUMMARY OF ALL SHEETS ---"
foreach ($ws in $wb.Worksheets) {
    $usedRange = $ws.UsedRange
    $rows = $usedRange.Rows.Count
    $cols = $usedRange.Columns.Count
    $title = $ws.Cells.Item(1, 1).Text
    $headerRow = @()
    for ($c = 1; $c -le $cols; $c++) {
        $headerRow += $ws.Cells.Item(2, $c).Text
    }
    $hJoined = ($headerRow | Where-Object { $_ -ne "" }) -join " | "
    Write-Output "Sheet: '$($ws.Name)' (Rows: $rows, Cols: $cols)"
    Write-Output "  Title: $title"
    Write-Output "  Headers: $hJoined"
    
    # Count non-empty data rows
    $dataCount = 0
    for ($r = 3; $r -le $rows; $r++) {
        $hasData = $false
        for ($c = 1; $c -le $cols; $c++) {
            if ($ws.Cells.Item($r, $c).Text.Trim() -ne "") {
                $hasData = $true
                break
            }
        }
        if ($hasData) { $dataCount++ }
    }
    Write-Output "  Active Data Rows: $dataCount`n"
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
