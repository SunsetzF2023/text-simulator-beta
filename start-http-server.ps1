# 查找Python并启动HTTP服务器
Write-Host "正在查找Python安装位置..." -ForegroundColor Yellow

# 常见的Python安装路径
$pythonPaths = @(
    "C:\Users\jefffan\AppData\Local\Programs\Python\Python312\python.exe",
    "C:\Users\jefffan\AppData\Local\Programs\Python\Python311\python.exe",
    "C:\Program Files\Python312\python.exe",
    "C:\Program Files\Python311\python.exe",
    "C:\Python312\python.exe",
    "C:\Python311\python.exe"
)

$pythonPath = $null
foreach ($path in $pythonPaths) {
    if (Test-Path $path) {
        $pythonPath = $path
        Write-Host "找到Python: $path" -ForegroundColor Green
        break
    }
}

if (-not $pythonPath) {
    # 尝试在PATH中查找
    try {
        $pythonPath = (Get-Command python -ErrorAction Stop).Source
        Write-Host "在PATH中找到Python: $pythonPath" -ForegroundColor Green
    } catch {
        Write-Host "未找到Python，请确保Python已正确安装" -ForegroundColor Red
        Write-Host "你可以从 https://www.python.org/downloads/ 下载安装" -ForegroundColor Yellow
        Read-Host "按Enter键退出"
        exit 1
    }
}

# 启动HTTP服务器
Write-Host "正在启动HTTP服务器..." -ForegroundColor Yellow
Write-Host "服务器地址: http://localhost:8000" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host ""

try {
    & $pythonPath -m http.server 8000
} catch {
    Write-Host "启动服务器失败: $_" -ForegroundColor Red
    Read-Host "按Enter键退出"
}
