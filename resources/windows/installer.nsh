; MarkDown++ custom NSIS installer extensions
;
; Adds "Open with MarkDown++" context menus and registers
; MarkDown++ as an OpenWith option for .md files.

!macro customInstall
  ; Add "Open with MarkDown++" to .md file context menu
  WriteRegStr HKCU "Software\Classes\.md\shell\MarkDownPlusPlus" "" "Open with MarkDown++"
  WriteRegStr HKCU "Software\Classes\.md\shell\MarkDownPlusPlus\command" "" '"$INSTDIR\MarkDown++.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\.md\shell\MarkDownPlusPlus" "Icon" "$INSTDIR\MarkDown++.exe,0"

  ; Add "Open with MarkDown++" to folder context menu (right-click on folder)
  WriteRegStr HKCU "Software\Classes\Directory\shell\MarkDownPlusPlus" "" "Open with MarkDown++"
  WriteRegStr HKCU "Software\Classes\Directory\shell\MarkDownPlusPlus\command" "" '"$INSTDIR\MarkDown++.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\Directory\shell\MarkDownPlusPlus" "Icon" "$INSTDIR\MarkDown++.exe,0"

  ; Add "Open with MarkDown++" to directory background context menu (right-click in empty space)
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\MarkDownPlusPlus" "" "Open with MarkDown++"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\MarkDownPlusPlus\command" "" '"$INSTDIR\MarkDown++.exe" "%V"'
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\MarkDownPlusPlus" "Icon" "$INSTDIR\MarkDown++.exe,0"

  ; Register MarkDown++ as an OpenWith option for .md and related files.
  ; This makes it appear in the "Open with" menu without forcing it as default.
  ; On Windows 10/11, setting a default program requires the user to choose
  ; through the Windows Settings UI, so we register as OpenWith instead.
  WriteRegStr HKCU "Software\Classes\MarkDownPlusPlus.md" "" "MarkDown++ Markdown Document"
  WriteRegStr HKCU "Software\Classes\MarkDownPlusPlus.md\DefaultIcon" "" "$INSTDIR\MarkDown++.exe,0"
  WriteRegStr HKCU "Software\Classes\MarkDownPlusPlus.md\shell\open\command" "" '"$INSTDIR\MarkDown++.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\MarkDownPlusPlus.md\shell\open" "FriendlyAppName" "MarkDown++"

  WriteRegStr HKCU "Software\Classes\.md\OpenWithProgids" "MarkDownPlusPlus.md" ""
  WriteRegStr HKCU "Software\Classes\.markdown\OpenWithProgids" "MarkDownPlusPlus.md" ""
  WriteRegStr HKCU "Software\Classes\.mdown\OpenWithProgids" "MarkDownPlusPlus.md" ""
  WriteRegStr HKCU "Software\Classes\.mdtxt\OpenWithProgids" "MarkDownPlusPlus.md" ""
  WriteRegStr HKCU "Software\Classes\.mdtext\OpenWithProgids" "MarkDownPlusPlus.md" ""
  WriteRegStr HKCU "Software\Classes\.mmd\OpenWithProgids" "MarkDownPlusPlus.md" ""
!macroend

!macro customUnInstall
  ; Remove all context menu entries
  DeleteRegKey HKCU "Software\Classes\.md\shell\MarkDownPlusPlus"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\MarkDownPlusPlus"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\MarkDownPlusPlus"

  ; Remove OpenWith registration
  DeleteRegKey HKCU "Software\Classes\MarkDownPlusPlus.md"
  DeleteRegValue HKCU "Software\Classes\.md\OpenWithProgids" "MarkDownPlusPlus.md"
  DeleteRegValue HKCU "Software\Classes\.markdown\OpenWithProgids" "MarkDownPlusPlus.md"
  DeleteRegValue HKCU "Software\Classes\.mdown\OpenWithProgids" "MarkDownPlusPlus.md"
  DeleteRegValue HKCU "Software\Classes\.mdtxt\OpenWithProgids" "MarkDownPlusPlus.md"
  DeleteRegValue HKCU "Software\Classes\.mdtext\OpenWithProgids" "MarkDownPlusPlus.md"
  DeleteRegValue HKCU "Software\Classes\.mmd\OpenWithProgids" "MarkDownPlusPlus.md"

  MessageBox MB_YESNO "Do you want to delete user settings?" /SD IDNO IDNO SkipRemoval
    SetShellVarContext current
    RMDir /r "$APPDATA\markdownplusplus"
  SkipRemoval:
!macroend