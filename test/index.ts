import { clearTerminal, reactive, effect } from '../src'

clearTerminal()

const state = reactive({
  name: 'Vue2',
  age: 18,
  arr: [1, 2, 3],
})

effect(() => console.log('effect:', state.arr), {})

console.log()

state.arr.push(1)
