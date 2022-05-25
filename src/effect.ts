export type Options = {
  lazy?: boolean
  computed?: boolean
  scheduler?: () => any
}

export type Dep = Set<ReactiveEffect>

export type TargetKey = Map<any, Dep>

export type GlobalTargetKey = WeakMap<object, TargetKey>

export const enum TrackOpTypes {
  GET = 'get',
  HAS = 'has',
  ITERATE = 'iterate',
}

export const enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear',
}

export function effect<T = any>(fn: () => T, options: Options = {}): ReactiveEffect {
  const effect = new ReactiveEffect(fn, options) // 返回一个响应式的 effect 函数

  if (!options || !options.lazy) effect.run() // 如果不是计算属性的 effect, 那么会立即执行该 effect

  return effect
}

export const globalTargetMap: GlobalTargetKey = new WeakMap()

let uid = 0
let activeEffect: ReactiveEffect | undefined // 存放当前执行的 effect
const effectStack: ReactiveEffect[] = [] // 如果存在多个 effect , 则依次放入栈中

/**
 *
 *  如果只有一个 <响应式对象> , 那么我们直接用一个全局的 Map 对象根据不同的 key 进行保存即可,
 * 但是我们的 <响应式对象> 是可以创建多个的, 并且每个 <响应式对象> 的 key 也可能相同,
 * 所以仅仅通过一个 Map 结构以 key 的方式保存是无法实现的.
 *
 * 既然 <响应式对象> 有多个, 那么就可以以整个 <响应式对象> 作为 key 进行区分,
 * 而能够用一个对象作为 key 的数据结构就是 WeakMap.
 *
 * ! 用一个全局的 WeakMap 结构以 target 作为 key 保存该 target 对象下的 key 对应的依赖:
 * ! {
 * !   targetObj1: {
 * !     someKey: [effect1, effect2,..., effectn]
 * !   },
 * !   targetObj2: {
 * !     someKey: [effect1, effect2,..., effectn]
 * !   }
 * !   // ...
 * ! }
 */

export class ReactiveEffect<T = any> {
  public id: number = uid++
  public deps: Dep[] = []

  constructor(public fn: () => T, public options: Options) {}

  public run() {
    // 防止不停的更改属性导致死循环
    // 如果没有才 push 到 effectStack
    if (!effectStack.includes(this)) {
      try {
        // 在取值之前将 activeEffect 标记一下
        // 并放到栈顶
        effectStack.push(this)
        activeEffect = effectStack[effectStack.length - 1]

        // 执行 effect 的回调就是一个取值 (track) 的过程
        return this.fn()
      } finally {
        // 从 effectStack 栈顶将自己移除
        effectStack.pop()

        const n = effectStack.length
        // 将 effectStack 的栈顶元素标记为 activeEffect
        activeEffect = n > 0 ? effectStack[n - 1] : undefined
      }
    }
  }
}

/**
 * 收集依赖 effect
 * 只收集第一次
 */
export function track(target: object, type: TrackOpTypes, key: unknown) {
  // 收集依赖的时候必须要存在 activeEffect
  // 在 ReactiveEffect 里有个 activeEffect = this 的操作时就有值了
  if (!activeEffect) return

  // 根据 target 对象取出当前 target 对应的 depsMap 结构
  let depsMap = globalTargetMap.get(target)
  // 第一次收集依赖可能不存在
  if (!depsMap) globalTargetMap.set(target, (depsMap = new Map()))

  // 根据 key 取出对应的用于存储依赖的 Set 集合
  let dep: Dep | undefined = depsMap.get(key)
  // 第一次可能不存在, 要创建一下 Set
  if (!dep) depsMap.set(key, (dep = new Set()))

  // 只收集第一次 (也就是如果依赖集合中不存在 activeEffect)
  if (!dep.has(activeEffect)) {
    // 一个 key 可能使用到了多个 effect , 所以将当前 effect 放到依赖集合中
    dep.add(activeEffect)
    // 一个 effect 可能使用到了多个 key , 所以将当前 key 放到依赖集合中
    activeEffect.deps.push(dep)
  }
}

/**
 * 触发依赖 effect 执行
 */
export function trigger(target: object, type: TriggerOpTypes, key: unknown, value?: unknown) {
  const depsMap = globalTargetMap.get(target) // 根据 target 对象取出当前 target 对应的 depsMap 结构

  // 如果该对象没有收集依赖
  if (!depsMap) {
    console.log('该对象还未收集依赖')
    return
  }

  const effects: Dep = new Set() // 存储依赖的 effect

  const add = (effectsToAdd: Dep | undefined) => {
    if (!effectsToAdd) return

    effectsToAdd.forEach(effect => effects.add(effect))
  }

  const run = (effect: ReactiveEffect) => {
    if (effect.options?.scheduler) {
      effect.options?.scheduler() // 如果是计算属性的 effect 则执行其 scheduler() 方法
    } else {
      effect.run() // 如果是普通的 effect 则立即执行 effect 方法
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

  // key !== null 只是避免出现有 null 当 key 的情况
  if (key !== null) {
    // 对象新增一个属性, 由于没有依赖故不会执行
    add(depsMap.get(key))
  }

  if (type === TriggerOpTypes.ADD) {
    // 处理数组元素的新增 < 未完成❎ >
    add(depsMap.get(Array.isArray(target) ? 'length' : ''))
  }

  effects.forEach(run) // 遍历 effects 并执行
}
