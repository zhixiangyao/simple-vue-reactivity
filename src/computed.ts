import { isFunction } from './shared'
import { effect, track, trigger } from './effect'
import type { Effect } from './effect'

type Fn = () => any
type Obj = { set: () => void; get: () => Effect }
type GetterOrOptions = Fn | Obj

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

  // 计算属性本质也是一个effect，其回调函数就是计算属性的getter

  const runner = effect(getter, {
    lazy: true, // 默认是非立即执行，等到取值的时候再执行
    computed: true, // 标识这个effect是计算属性的effect
    scheduler: () => {
      // 数据发生变化的时候不是直接执行当前effect，而是执行这个scheduler弄脏数据
      if (!dirty) {
        // 如果数据是干净的
        dirty = true // 弄脏数据
        trigger(c, 'set', 'value') // 数据变化后，触发value依赖
      }
    },
  })

  let value: Effect
  const c = {
    get value() {
      if (dirty) {
        value = runner() // 等到取值的时候再执行计算属性内部创建的effect
        dirty = false // 取完值后数据就不是脏的了
        track(c, 'get', 'value') // 对计算属性对象收集value属性
      }
      return value
    },
    set value(newVal) {
      setter(newVal)
    },
  }

  return c
}
