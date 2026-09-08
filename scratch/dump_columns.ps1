$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$filePath = (Get-Item "public\AssetSample.xlsx").FullName
$wb = $excel.Workbooks.Open($filePath)

foreach ($ws in $wb.Worksheets) {
    Write-Output "=================================================="
    Write-Output "SHEET: $($ws.Name)"
    Write-Output "=================================================="
    for ($r = 1; $r -le [Math]::Min(5, $ws.UsedRange.Rows.Count); $r++) {
        $rowVals = @()
        for ($c = 1; $c -le $ws.UsedRange.Columns.Count; $c++) {
            $txt = $ws.Cells.Item($r, $c).Text
            $rowVals += $txt
        }
        Write-Output "R${r}: $($rowVals -join ' # ')"
    }
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
