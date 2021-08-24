import { isFunction } from './shared'
import { effect, track, trigger } from './effect'

import type { Effect, GetterOrOptions } from './type'

export function computed(getterOrOptions: GetterOrOptions) {
  let getter: () => Effect
  let setter: (T: any) => void
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = () => {}
  } else {
    getter = getterOrOptions?.get
    setter = getterOrOptions?.set
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
        trigger(c, 'set', 'value') // 数据变化后, 触发 value 依赖
      }
    },
  })

  let value: Effect
  const c = {
    get value() {
      if (dirty) {
        value = runner() // 等到取值的时候再执行计算属性内部创建的 effect
        dirty = false // 取完值后数据就不是脏的了
        track(c, 'get', 'value') // 对计算属性对象收集 value 属性
      }
      return value
    },
    set value(newVal) {
      setter(newVal)
    },
  }

  return c
}
