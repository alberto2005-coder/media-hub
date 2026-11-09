; =====================================================================
; Script de Inno Setup para MediaHub v1.0.0
; Autor: Alberto (alberto2005-coder)
; =====================================================================

#define MyAppName "MediaHub"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Alberto (alberto2005-coder)"
#define MyAppExeName "MediaHub.exe"

[Setup]
AppId={{9F8E7D6C-5B4A-3210-FEDC-BA9876543210}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes

; Ruta de salida del instalador compilado
OutputDir=C:\Users\alors\Downloads\media-hub-completo\release
OutputBaseFilename=MediaHub-1.0.0-Setup

; Icono del archivo instalador ejecutable
SetupIconFile=C:\Users\alors\Downloads\media-hub-completo\build\icon.ico

Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Archivos empaquetados previamente por electron-builder
Source: "C:\Users\alors\Downloads\media-hub-completo\release\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent