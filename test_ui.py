from selenium import webdriver
from selenium.webdriver.common.by import By
import time, subprocess

options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--log-level=3')
driver = webdriver.Chrome(options=options)

server = subprocess.Popen(['python', '-m', 'http.server', '8080'], cwd='frontend')
time.sleep(1)

try:
    driver.get('http://127.0.0.1:8080/index.html')
    time.sleep(1)
    btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Laporan Penjualan')]")
    btn.click()
    time.sleep(1)
    
    for log in driver.get_log('browser'):
        print('BROWSER LOG:', log)
    
    print('Total Penjualan:', driver.find_element(By.ID, 'summaryTotalPenjualan').text)
    print('Total Transaksi:', driver.find_element(By.ID, 'summaryTotalTransaksi').text)
finally:
    driver.quit()
    server.terminate()
