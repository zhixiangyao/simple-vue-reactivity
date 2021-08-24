import { isFunction } from './shared'
import { effect, track, trigger, TrackOpTypes, TriggerOpTypes } from './effect'
import type { ReactiveEffect } from './effect'

type FunOption = () => any

type ObjOption = { set: () => void; get: () => ReactiveEffect }

export function computed(option: FunOption | ObjOption) {
  let getter: () => ReactiveEffect
  let setter: (T: any) => void

  if (isFunction(option)) {
    getter = option
    setter = () => {}
  } else {
    getter = option?.get
    setter = option?.set
  }

  let dirty = true // 默认是脏的数据

  // 计算属性本质也是一个 effect, 其回调函数就是计算属性的 getter

  const runner = effect(getter, {
    lazy: true, // 默认是非立即执行, 等到取值的时候再执行
    computed: true, // 标识这个 effect 是计算属性的 effect
    scheduler: () => {
      // 数据发生变化的时候不是直接执行当前 effect, 而是执行这个 scheduler 弄脏数据
      if (!dirty) {
        // 如果数据是干净的
        dirty = true // 弄脏数据
        trigger(c, TriggerOpTypes.SET, 'value') // 数据变化后, 触发 value 依赖
      }
    },
  })

  let value: ReactiveEffect

  const c = {
    get value() {
      if (dirty) {
        value = runner.run() // 等到取值的时候再执行计算属性内部创建的 effect
        dirty = false // 取完值后数据就不是脏的了
        track(c, TrackOpTypes.GET, 'value') // 对计算属性对象收集 value 属性
      }
      return value
    },
    set value(newVal) {
      setter(newVal)
    },
  }

  return c
}
