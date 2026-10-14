; Custom installer page: a checkbox for the desktop shortcut (checked by default).
; electron-builder's own desktop shortcut is turned off in package.json so this box decides.
!include nsDialogs.nsh
!include LogicLib.nsh

; Only the installer pass uses these; declaring them in the uninstaller pass is a build error.
!ifndef BUILD_UNINSTALLER
  Var DesktopShortcutCheckbox
  Var DesktopShortcutState
!endif

!macro customPageAfterChangeDir
  Page custom DesktopShortcutPageCreate DesktopShortcutPageLeave

  Function DesktopShortcutPageCreate
    !insertmacro MUI_HEADER_TEXT "Additional Tasks" "Choose what else the installer should do."
    nsDialogs::Create 1018
    Pop $0
    ${NSD_CreateCheckbox} 0 12u 100% 12u "Add Desktop Shortcut"
    Pop $DesktopShortcutCheckbox
    ${NSD_Check} $DesktopShortcutCheckbox
    nsDialogs::Show
  FunctionEnd

  Function DesktopShortcutPageLeave
    ${NSD_GetState} $DesktopShortcutCheckbox $DesktopShortcutState
  FunctionEnd
!macroend

!macro customInstall
  ${If} $DesktopShortcutState == ${BST_CHECKED}
    CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0
  ${EndIf}
!macroend

!macro customUnInstall
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
!macroend
