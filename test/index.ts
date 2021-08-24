import { clearTerminal, reactive, effect, computed } from '../src'

clearTerminal()

const state = reactive({
  name: 'Vue2',
  age: 18,
  arr: [1, 2, 3],
})

const info = computed(() => `name: ${state.name}, age: ${state.age}`)

effect(() => console.log('effect:', state.name))
effect(() => console.log(`info is <${info.value}>`))

console.log()

state.name = 'Vue3' // 数据发生变化后会触发使用了该数据的 effect and computed 重新执行
