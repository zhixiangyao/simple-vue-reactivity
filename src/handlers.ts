import { isObject, isArray, hasOwn, hasChanged } from './shared'
import { reactive } from './reactive'
import { track, trigger, TrackOpTypes, TriggerOpTypes } from './effect'

const get = createGetter()
const set = createSetter()

const arrayInstrumentations: string[] = ['push', 'pop', 'shift', 'unshift', 'splice']

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver)

    const targetIsArray = isArray(target)

    if (!isReadonly && targetIsArray && arrayInstrumentations.includes(key as string)) {
      console.log(`<- 未对数组 ${key as string} 方法做处理 ->`)
      // return // 这里要判断数据的情况，还没写
    }

    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key)
    }

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
