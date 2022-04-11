import { logErrorStack } from "./errors"

export type TaskConfig<Value> = {
  run: () => Promise<Value> | Value
}

type Task<Value> = TaskConfig<Value> & {
  resolve: (value: Value) => void
}

export function createTaskQueue() {
  const actions: Array<Task<unknown>> = []
  let running = false

  async function run() {
    if (running) return

    try {
      running = true

      let action: Task<unknown> | undefined
      while ((action = actions.shift())) {
        action.resolve(await action.run())
      }
    } finally {
      running = false
    }
  }

  function add<Value>(task: TaskConfig<Value>): Promise<Value> {
    return new Promise((resolve) => {
      actions.push({
        run: task.run,
        resolve: (value) => resolve(value as Value),
      })
      run().catch(logErrorStack)
    })
  }

  return { add }
}
