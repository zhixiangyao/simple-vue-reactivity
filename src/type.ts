export type TargetKey = Map<any, Set<Effect>>

export type GlobalTargetKey = WeakMap<object, TargetKey>

export type Options = { [T in string]: any }

export interface Effect {
  (): Effect
  options: Options
  id: number
  deps: Set<Effect>[]
}

type Fn = () => any
type Obj = { set: () => void; get: () => Effect }
export type GetterOrOptions = Fn | Obj
