@echo off
rem One-time setup of the portable MySQL used by Hamro Prachin Sampada (port 3307, no Windows service).
rem 1. Download "MySQL Community Server 8.4 LTS - Windows (x86, 64-bit), ZIP Archive" from https://dev.mysql.com/downloads/mysql/
rem 2. Extract it so this path exists: .mysql\mysql-8.4.3-winx64\bin\mysqld.exe  (rename the folder if your version differs)
rem 3. Run this file once, then use start-mysql.cmd.
setlocal
set "BASE=%~dp0.mysql"
set "BIN=%BASE%\mysql-8.4.3-winx64\bin\mysqld.exe"
if not exist "%BIN%" (
  echo MySQL not found at %BIN%
  echo Download the MySQL 8.4 ZIP archive and extract it into .mysql\ first. See the README.
  exit /b 1
)
set "FWD=%BASE:\=/%"
(
  echo [mysqld]
  echo basedir=%FWD%/mysql-8.4.3-winx64
  echo datadir=%FWD%/data
  echo port=3307
  echo bind-address=127.0.0.1
  echo character-set-server=utf8mb4
  echo collation-server=utf8mb4_unicode_ci
  echo mysqlx=OFF
) > "%BASE%\my.ini"
if exist "%BASE%\data" (
  echo Data folder already exists; kept it. my.ini rewritten for this location.
) else (
  "%BIN%" --defaults-file="%BASE%\my.ini" --initialize-insecure --console
)
echo Done. Now run start-mysql.cmd and keep it open.
