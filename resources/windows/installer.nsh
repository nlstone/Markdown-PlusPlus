!macro customInstall
  ; Add "Open with MarkDown++" to .md file context menu
  WriteRegStr HKCU "Software\Classes\.md\shell\MarkDownPlusPlus" "" "Open with MarkDown++"
  WriteRegStr HKCU "Software\Classes\.md\shell\MarkDownPlusPlus\command" "" '"$INSTDIR\MarkDownPlusPlus.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\.md\shell\MarkDownPlusPlus" "Icon" "$INSTDIR\MarkDownPlusPlus.exe,0"

  ; Add "Open with MarkDown++" to folder context menu (right-click on folder)
  WriteRegStr HKCU "Software\Classes\Directory\shell\MarkDownPlusPlus" "" "Open with MarkDown++"
  WriteRegStr HKCU "Software\Classes\Directory\shell\MarkDownPlusPlus\command" "" '"$INSTDIR\MarkDownPlusPlus.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\Directory\shell\MarkDownPlusPlus" "Icon" "$INSTDIR\MarkDownPlusPlus.exe,0"

  ; Add "Open with MarkDown++" to directory background context menu (right-click in empty space)
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\MarkDownPlusPlus" "" "Open with MarkDown++"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\MarkDownPlusPlus\command" "" '"$INSTDIR\MarkDownPlusPlus.exe" "%V"'
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\MarkDownPlusPlus" "Icon" "$INSTDIR\MarkDownPlusPlus.exe,0"
!macroend

!macro customUnInstall
  ; Remove all context menu entries
  DeleteRegKey HKCU "Software\Classes\.md\shell\MarkDownPlusPlus"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\MarkDownPlusPlus"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\MarkDownPlusPlus"

  MessageBox MB_YESNO "Do you want to delete user settings?" /SD IDNO IDNO SkipRemoval
    SetShellVarContext current
    RMDir /r "$APPDATA\markdownplusplus"
  SkipRemoval:
!macroend