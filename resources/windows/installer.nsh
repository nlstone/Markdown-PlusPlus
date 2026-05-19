; MarkDown++ custom NSIS installer extensions
;
; Adds "Open with MarkDown++" context menus and an option to set
; MarkDown++ as the default editor for .md files.

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

  ; Ask user if they want to set MarkDown++ as default .md editor (default: Yes)
  MessageBox MB_YESNO|MB_DEFBUTTON1|MB_ICONQUESTION \
    "Would you like to set MarkDown++ as the default editor for .md files?$\n$\n\
    This will open .md files with MarkDown++ when you double-click them." \
    /SD IDYES IDYES setDefault IDNO skipDefault

  setDefault:
    ; Register the application as a ProgID for markdown files
    WriteRegStr HKCU "Software\Classes\MarkDownPlusPlus.md" "" "MarkDown++ Markdown Document"
    WriteRegStr HKCU "Software\Classes\MarkDownPlusPlus.md\DefaultIcon" "" "$INSTDIR\MarkDownPlusPlus.exe,0"
    WriteRegStr HKCU "Software\Classes\MarkDownPlusPlus.md\shell\open\command" "" '"$INSTDIR\MarkDownPlusPlus.exe" "%1"'
    WriteRegStr HKCU "Software\Classes\MarkDownPlusPlus.md\shell\open" "FriendlyAppName" "MarkDown++"

    ; Register as OpenWith option for all markdown extensions
    WriteRegStr HKCU "Software\Classes\.md\OpenWithProgids" "MarkDownPlusPlus.md" ""
    WriteRegStr HKCU "Software\Classes\.markdown\OpenWithProgids" "MarkDownPlusPlus.md" ""
    WriteRegStr HKCU "Software\Classes\.mdown\OpenWithProgids" "MarkDownPlusPlus.md" ""
    WriteRegStr HKCU "Software\Classes\.mdtxt\OpenWithProgids" "MarkDownPlusPlus.md" ""
    WriteRegStr HKCU "Software\Classes\.mdtext\OpenWithProgids" "MarkDownPlusPlus.md" ""
    WriteRegStr HKCU "Software\Classes\.mmd\OpenWithProgids" "MarkDownPlusPlus.md" ""

  skipDefault:
!macroend

!macro customUnInstall
  ; Remove all context menu entries
  DeleteRegKey HKCU "Software\Classes\.md\shell\MarkDownPlusPlus"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\MarkDownPlusPlus"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\MarkDownPlusPlus"

  ; Remove default handler registration
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