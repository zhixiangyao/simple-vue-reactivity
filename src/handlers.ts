import { isObject, hasOwn, hasChanged } from './shared'
import { reactive } from './reactive'
import { track, trigger, TrackOpTypes, TriggerOpTypes } from './effect'

const get = createGetter()
const set = createSetter()

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver)

    track(target, TrackOpTypes.GET, key)

    if (isObject(res)) return reactive(res)

    return res
  }
}

function createSetter(shallow = false) {
  return function set(target: object, key: string | symbol, value: unknown, receiver: object) {
    const hadKey = hasOwn(target, key)
    const oldValue = (target as any)?.[key]

    const res = Reflect.set(target, key, value, receiver)

    if (!hadKey) {
      // 没有 Key 是新增
      trigger(target, TriggerOpTypes.ADD, key, value)
    } else if (hasChanged(value, oldValue)) {
      // 有 Changed 是修改
      trigger(target, TriggerOpTypes.SET, key, value)
    } else {
      // 不变
    }

    return res
  }
}

export const mutableHandlers = {
  get,
  set,
  // deleteProperty,
  // has,
  // ownKeys
}

export const mutableCollectionHandlers = {
  get,
  set,
  // deleteProperty,
  // has,
  // ownKeys
}
