# Быстрый тест импорта
$testURL = "https://public-operation-hkrpg-sg.hoyoverse.com/common/gacha_record/api/getGachaLog?win_direction=landscape&authkey_ver=1&sign_type=2&auth_appid=webview_gacha&win_mode=fullscreen&gacha_id=f5e125645daec2be884aee13b6ed97f7ba6d9aa5&timestamp=1755042930&region=prod_official_eur&default_gacha_type=11&decide_item_id_list=1003%252C1004%252C1101%252C1208%252C1205%252C1209%252C1102&lang=ru&plat_type=pc&authkey=MJYDtergN34xh1x1i9IyyoHMCfY%2BDe%2B7wgLm7%2BnHkn3uSueijPjMaoIISBjOoXez0wL1FgpEjmQre3T7aRtLD57E2PF%2FwnIFf88DDX%2FiWShA9ivRcbRUNNbTGY5m0u1QQx56sM6EWrmXQuIBxT5ZJ38O3MiUiuR1QZhZ3ABEZRksIbNRXJJC3QjrGVzaOpWO%2FkzXUh9ZieCX0dyfylZcEo5yDmUhgPIUP1FzEbx30t4Q7F6t5T71rNAb5mmOccU1tvyTEz%2FJeY6P68HNr7i5eyJ%2B4YOBAzqO4tvzEGggm8jtLQex0z90sxkRPDP8Quar3hSCHgJjZOSS4eB27A%2Bt1nZFDpRUeK6ykZe5KEbxWDAd2hQLOIHWw46dgt0UmWgbrBz2nd49yn7oNM384gtSTyYndyBoKCXyQi%2B1BM8Zf4psTh0BpjLm%2FlzHPituS9udYzeoKjL9wnlVFQnuaNFSkkA0IaZ3Ze%2BqW9cnyQL2xhzYDMYvW1Ow4wjE3FTXAxXdAMw9F%2Fp6VEpJhlON%2B3iYxSlP1XJ4AjBRW3xp3p351Ork3tX9bUfDvu607efic0nOXWuRwoA%2FLoXED8gqbgJ3wVpJnjOjQwNX36bl8W0JzJqEzudptXFxQEmWgQEP5Hh5636egIS5ZLwfLbfUhlBg%2B3oIrpqLbAPpDFDE0zIMMaU%3D&game_biz=hkrpg_global&os_system=Windows%2011%20%20%2810.0.26100%29%2064bit&device_model=MS-7D24%20%28Micro-Star%20International%20Co.%2C%20Ltd.%29&page=1&size=5&gacha_type=11&version_switch=3.4.0&end_id="

Write-Host "Testing import with URL..." -ForegroundColor Cyan

try {
    $result = Invoke-RestMethod -Uri "http://localhost:3001/api/upload/url/123456789" -Method POST -ContentType "application/json" -Body "{`"url`": `"$testURL`"}" -TimeoutSec 60
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Imported: $($result.imported)" -ForegroundColor Green
    Write-Host "Skipped: $($result.skipped)" -ForegroundColor Yellow
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
