import { clearTerminal, reactive, effect } from '../src'

clearTerminal()

const state = reactive({
  name: 'Vue2',
  age: 18,
  arr: [1, 2, 3],
})

effect(() => console.log('effect:', state.name), {})

state.name = 'Vue3'

Reflect.deleteProperty(state, 'name')

state.name = 'VueNext'
