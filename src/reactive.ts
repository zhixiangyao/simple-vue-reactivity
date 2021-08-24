import { isObject } from './shared'
import { mutableHandlers, mutableCollectionHandlers } from './handlers'

const collectionTypes: Set<any> = new Set([Set, Map, WeakMap, WeakSet])
const reactiveMap = new WeakMap<any, any>()

export function reactive<T extends object>(target: T): T
export function reactive(target: object) {
  return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap)
}

function createReactiveObject<T>(
  target: any,
  isReadonly = false,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<any, any>
): T {
  if (!isObject(target)) return target

  const existingProxy = proxyMap.get(target)
  if (existingProxy) return existingProxy

  const proxy = new Proxy(target, collectionTypes.has(target.constructor) ? collectionHandlers : baseHandlers)
  proxyMap.set(target, proxy)
  return proxy
}
