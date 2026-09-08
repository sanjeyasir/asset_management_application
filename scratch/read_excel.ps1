$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$filePath = (Get-Item "public\AssetSample.xlsx").FullName
$wb = $excel.Workbooks.Open($filePath)
Write-Output "Worksheets count: $($wb.Worksheets.Count)"
foreach ($ws in $wb.Worksheets) {
    Write-Output "`n================ Sheet: $($ws.Name) ================"
    $usedRange = $ws.UsedRange
    $rows = $usedRange.Rows.Count
    $cols = $usedRange.Columns.Count
    Write-Output "Rows: $rows, Cols: $cols"
    
    for ($r = 1; $r -le [Math]::Min(15, $rows); $r++) {
        $rowVals = @()
        for ($c = 1; $c -le [Math]::Min(25, $cols); $c++) {
            $val = $ws.Cells.Item($r, $c).Text
            $rowVals += $val
        }
        $joined = $rowVals -join ' | '
        Write-Output "Row ${r}: $joined"
    }
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
