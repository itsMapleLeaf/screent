import { app } from "electron"
import { makeAutoObservable } from "mobx"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { JsonObject, JsonValue } from "type-fest"
import { logErrorStack } from "../common/errors"
import { isJsonObject } from "../common/json"
import type { TaskConfig } from "../common/task-queue"
import { createTaskQueue } from "../common/task-queue"

const getSettingsPath = () => join(app.getPath("userData"), "settings.json")

const queue = createTaskQueue()

function createSetTask(key: string, value: JsonValue): TaskConfig<void> {
  return {
    async run() {
      const settings = await readSettings()
      await writeFile(
        getSettingsPath(),
        JSON.stringify({ ...settings, [key]: value }, undefined, 2),
      )
    },
  }
}

function createGetTask(key: string): TaskConfig<JsonValue | undefined> {
  return {
    async run() {
      const settings = await readSettings()
      return settings[key]
    },
  }
}

async function readSettings(): Promise<JsonObject> {
  try {
    const settings: JsonValue = JSON.parse(
      await readFile(getSettingsPath(), "utf8"),
    )
    return isJsonObject(settings) ? settings : {}
  } catch {
    return {}
  }
}

export function createSetting(
  key: string,
  defaultValue: JsonValue | undefined,
) {
  const setting = makeAutoObservable({
    value: defaultValue,

    set(value: JsonValue) {
      this.value = value
      void queue.add(createSetTask(key, value))
    },
  })

  queue.add(createGetTask(key)).then((value) => {
    if (value != undefined) setting.value = value
  }, logErrorStack)

  return setting
}
