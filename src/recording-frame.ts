import {
  QMainWindow,
  QWidget,
  WidgetAttribute,
  WindowType,
} from "@nodegui/nodegui"
import { Region } from "./select-screen-region.js"

const win = new QMainWindow()
win.setAttribute(WidgetAttribute.WA_TranslucentBackground, true)
win.setAttribute(WidgetAttribute.WA_TransparentForMouseEvents, true)
win.setWindowFlag(WindowType.FramelessWindowHint, true)
win.setWindowFlag(WindowType.WindowStaysOnTopHint, true)
win.setWindowFlag(WindowType.X11BypassWindowManagerHint, true)

win.setInlineStyle(/* CSS */ `
  background: transparent;
`)

const border = new QWidget(win)
border.setStyleSheet(/* CSS */ `
  width: 100%;
  height: 100%;
  border: 1px solid rgba(120, 50, 50, 1);
`)
;(global as any).win = win

export function showRecordingFrame({ left, top, width, height }: Region) {
  border.setFixedSize(width + 2, height + 2)
  win.setFixedSize(width + 2, height + 2)
  win.move(left - 1, top - 1)
  win.show()
}

export function hideRecordingFrame() {
  win.hide()
}
