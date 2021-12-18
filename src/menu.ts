import { QAction, QMenu } from "@nodegui/nodegui"

export type MenuItem = {
  label: string
  onClick?: () => void
  submenu?: MenuItem[]
}

export function createMenu(items: MenuItem[]) {
  const menu = new QMenu()
  for (const item of items) {
    const action = new QAction(menu)
    action.setText(item.label)
    if (item.onClick) {
      action.addEventListener("triggered", item.onClick)
    }
    if (item.submenu) {
      action.setMenu(createMenu(item.submenu))
    }
    menu.addAction(action)
  }
  return menu
}
