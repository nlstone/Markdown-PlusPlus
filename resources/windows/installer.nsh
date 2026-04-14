!macro customInstall
  ; Add "Open with NextReader" to .md file context menu
  WriteRegStr SHCTX "SystemFileAssociations\.md\shell\NextReader" "" "Open with NextReader"
  WriteRegStr SHCTX "SystemFileAssociations\.md\shell\NextReader\command" "" '"$INSTDIR\NextReader.exe" "%1"'
  WriteRegStr SHCTX "SystemFileAssociations\.md\shell\NextReader" "Icon" '"$INSTDIR\NextReader.exe",0'

  ; Add "Open with NextReader" to folder context menu
  WriteRegStr SHCTX "Directory\shell\NextReader" "" "Open with NextReader"
  WriteRegStr SHCTX "Directory\shell\NextReader\command" "" '"$INSTDIR\NextReader.exe" "%1"'
  WriteRegStr SHCTX "Directory\shell\NextReader" "Icon" '"$INSTDIR\NextReader.exe",0'
!macroend

!macro customUnInstall
  ; Remove context menu entries
  DeleteRegKey SHCTX "SystemFileAssociations\.md\shell\NextReader"
  DeleteRegKey SHCTX "Directory\shell\NextReader"

  MessageBox MB_YESNO "Do you want to delete user settings?" /SD IDNO IDNO SkipRemoval
    SetShellVarContext current
    RMDir /r "$APPDATA\nextreader"
  SkipRemoval:
!macroend