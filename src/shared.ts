import readline from 'readline'
import c from 'chalk'

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val => hasOwnProperty.call(val, key)
export const isArray = Array.isArray
export const isMap = (val: unknown): val is Map<any, any> => toTypeString(val) === '[object Map]'
export const isSet = (val: unknown): val is Set<any> => toTypeString(val) === '[object Set]'
export const isDate = (val: unknown): val is Date => val instanceof Date
export const isFunction = (val: unknown): val is Function => typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'
export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}
export const hasChanged = (newValue: any, oldValue: any): boolean => newValue !== oldValue
export const objectToString = Object.prototype.toString
export const toTypeString = (value: unknown): string => objectToString.call(value)

export const clearTerminal = () => {
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearLine(process.stdout, 0)
  readline.clearScreenDown(process.stdout)
}
export const chalk = (name: string, method: string, key: any, value?: any) => {
  if (value) {
    console.log(
      c.black(`${name} ${method} 操作: ${c.yellow(`[Key-${c.greenBright(key)}, Value-${c.greenBright(value)}]`)}`)
    )
  } else {
    console.log(c.red(`${name} ${method} 操作: ${c.yellow(`[Key-${c.greenBright(key)}]`)}`))
  }
}
