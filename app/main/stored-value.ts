import ElectronStore from "electron-store"
import { ZodType } from "zod"

export class StoredValue<T> {
  private key: string
  private schema: ZodType<T>

  constructor(key: string, schema: ZodType<T>) {
    this.key = key
    this.schema = schema
  }

  get(): T | undefined {
    const result = this.schema.safeParse(new ElectronStore().get(this.key))
    return result.success ? result.data : undefined
  }

  set(value: T): void {
    new ElectronStore().set(this.key, value)
  }

  delete(): void {
    new ElectronStore().delete(this.key)
  }
}
