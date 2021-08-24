type Options = { [T in string]: any }
export interface Effect {
  (): Effect
  options: Options
  id: number
  deps: Set<Effect>[]
}

export function effect(fn: Function, options: Options = {}): Effect {
  const effect = createReactiveEffect(fn, options) // 返回一个响应式的 effect 函数

  if (!options.lazy) effect() // 如果不是计算属性的effect, 那么会立即执行该effect

  return effect
}

let uid = 0
// 存放当前执行的 effect
let activeEffect: null | Effect = null
// 如果存在多个 effect , 则依次放入栈中
const effectStack: Effect[] = []

/**
 *
 * 如果只有一个 <响应式对象> , 那么我们直接用一个全局的 Map 对象根据不同的 key 进行保存即可,
 * 但是我们的 <响应式对象> 是可以创建多个的, 并且每个 <响应式对象> 的 key 也可能相同,
 * 所以仅仅通过一个 Map 结构以 key 的方式保存是无法实现的.
 *
 * 既然 <响应式对象> 有多个, 那么就可以以整个 <响应式对象> 作为 key 进行区分,
 * 而能够用一个对象作为 key 的数据结构就是 WeakMap.
 *
 * 用一个全局的 WeakMap 结构以 target 作为 key 保存该 target 对象下的 key 对应的依赖:
 * {
 *   targetObj1: {
 *     someKey: [effect1, effect2,..., effectn]
 *   },
 *   targetObj2: {
 *     someKey: [effect1, effect2,..., effectn]
 *   }
 *   ...
 * }
 */
type TargetKey = Map<any, Set<Effect>>
type GlobalTargetKey = WeakMap<object, TargetKey>
const globalTargetMap: GlobalTargetKey = new WeakMap()

function createReactiveEffect(fn: Function, options: Options) {
  /**
   * 所谓响应式的 effect , 就是该 effect 在执行的时候会将自己放入到 effectStack 收到栈顶,
   * 同时将自己标记为 activeEffect, 以便进行依赖收集与 reactive 进行关联
   */
  const effect: Effect = function () {
    // 防止不停的更改属性导致死循环
    if (!effectStack.includes(effect)) {
      try {
        // 在取值之前将当前 effect 放到栈顶并标记为 activeEffect
        effectStack.push(effect) // 将自己放到 effectStack 的栈顶
        activeEffect = effect // 同时将自己标记为 activeEffect
        return fn() // 执行 effect 的回调就是一个取值的过程
      } finally {
        // 从 effectStack 栈顶将自己移除
        effectStack.pop()
        // 将 effectStack 的栈顶元素标记为 activeEffect
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  effect.options = options
  effect.id = uid++
  // 依赖了哪些属性, 哪些属性变化了需要执行当前 effect
  effect.deps = []
  return effect
}

/**
 * 取值的时候开始收集依赖, 即收集 effect
 */
export function track(target: any, type: string, key: any) {
  // 收集依赖的时候必须要存在 activeEffect
  if (!activeEffect) return

  // 根据 target 对象取出当前 target 对应的 depsMap 结构
  let depsMap = globalTargetMap.get(target)

  // 第一次收集依赖可能不存在
  if (!depsMap) globalTargetMap.set(target, (depsMap = new Map()))

  // 根据 key 取出对应的用于存储依赖的 Set 集合
  let dep: Set<Effect> | undefined = depsMap.get(key)

  // 第一次可能不存在
  if (!dep) depsMap.set(key, (dep = new Set()))

  // 如果依赖集合中不存在 activeEffect
  if (!dep.has(activeEffect)) {
    // 将当前 effect 放到依赖集合中
    dep.add(activeEffect)
    // 一个 effect 可能使用到了多个 key , 所以会有多个 dep 依赖集合
    activeEffect.deps.push(dep) // 让当前 effect 也保存一份 dep 依赖集合
  }
}

/**
 * 数据发生变化的时候, 触发依赖的 effect 执行
 */
export function trigger(target: any, type: string, key: any, value?: any) {
  const depsMap = globalTargetMap.get(target) // 获取当前 target 对应的 Map

  if (!depsMap) {
    // 如果该对象没有收集依赖

    // console.log('该对象还未收集依赖') // 比如修改值的时候, 没有调用过 effect
    return
  }

  const effects: Set<Effect> = new Set() // 存储依赖的 effect
  const add = (effectsToAdd: Set<Effect> | undefined) => {
    if (!effectsToAdd) return

    effectsToAdd.forEach(effect => effects.add(effect))
  }
  const run = (effect: Effect) => {
    if (effect.options?.scheduler) {
      // 如果是计算属性的 effect 则执行其 scheduler() 方法
      effect.options?.scheduler()
    } else {
      // 如果是普通的 effect 则立即执行 effect 方法
      effect()
    }
  }

  /**
   * 对于 effect 中使用到的数据, 那肯定是响应式对象中已经存在的 key , 当数据变化后肯定能通过该 key 拿到对应的依赖,
   * 对于新增的 key , 我们也不需要通知 effect 执行.
   *
   * 但是对于数组而言, 如果给数组新增了一项, 我们是需要通知的, 如果我们仍然以 key 的方式去获取依赖那肯定是无法获取到的,
   * 因为也是属于新增的一个索引, 之前没有对其收集依赖, 但是我们使用数组的时候会使用 JSON.stringify(arr) , 此时会取 length 属性,
   * 索引会收集 length 的依赖, 数组新增元素后, 其 length 会发生变化, 我们可以通过 length 属性去获取依赖
   */

  if (key !== null) add(depsMap.get(key)) // 对象新增一个属性, 由于没有依赖故不会执行

  if (type === 'add') {
    // 处理数组元素的新增
    add(depsMap.get(Array.isArray(target) ? 'length' : ''))
  }

  // 遍历 effects 并执行
  effects.forEach(run)
}
