@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
if not defined VSCMD_VER (
  for /f "usebackq tokens=*" %%i in (`"%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VSINSTALL=%%i"
  if not defined VSINSTALL (
    echo MSVC_NOT_FOUND: Install Visual Studio C++ build tools, or set CXX to g++.
    exit /b 1
  )
  call "!VSINSTALL!\VC\Auxiliary\Build\vcvars64.bat" >nul
  if errorlevel 1 exit /b 1
)
if not exist bin mkdir bin
for %%f in (*_ref.cpp) do (
  cl /nologo /std:c++17 /EHsc /O2 /utf-8 /I. /Fo:bin\%%~nf.obj /Fe:bin\%%~nf.exe %%f
  if errorlevel 1 exit /b 1
)
echo BUILD_OK
endlocal
