!macro customInstall
  ; Add "Open with NextReader" to .md file context menu
  WriteRegStr HKCU "Software\Classes\.md\shell\NextReader" "" "Open with NextReader"
  WriteRegStr HKCU "Software\Classes\.md\shell\NextReader\command" "" '"$INSTDIR\NextReader.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\.md\shell\NextReader" "Icon" "$INSTDIR\NextReader.exe,0"

  ; Add "Open with NextReader" to folder context menu (right-click on folder)
  WriteRegStr HKCU "Software\Classes\Directory\shell\NextReader" "" "Open with NextReader"
  WriteRegStr HKCU "Software\Classes\Directory\shell\NextReader\command" "" '"$INSTDIR\NextReader.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\Directory\shell\NextReader" "Icon" "$INSTDIR\NextReader.exe,0"

  ; Add "Open with NextReader" to directory background context menu (right-click in empty space)
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\NextReader" "" "Open with NextReader"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\NextReader\command" "" '"$INSTDIR\NextReader.exe" "%V"'
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\NextReader" "Icon" "$INSTDIR\NextReader.exe,0"
!macroend

!macro customUnInstall
  ; Remove all context menu entries
  DeleteRegKey HKCU "Software\Classes\.md\shell\NextReader"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\NextReader"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\NextReader"

  MessageBox MB_YESNO "Do you want to delete user settings?" /SD IDNO IDNO SkipRemoval
    SetShellVarContext current
    RMDir /r "$APPDATA\nextreader"
  SkipRemoval:
!macroend