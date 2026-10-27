@echo off
rem Starts the portable MySQL 8.4 inside .mysql\ on port 3307 (no Windows service needed).
rem Keep this window open while you use Hamro Prachin Sampada; press Ctrl+C to stop MySQL.
set "BASE=%~dp0.mysql"
"%BASE%\mysql-8.4.3-winx64\bin\mysqld.exe" --defaults-file="%BASE%\my.ini" --console
