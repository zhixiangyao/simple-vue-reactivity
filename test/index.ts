import { reactive, effect } from '../src/index'
import { clearTerminal } from './utils'

clearTerminal()

const state0 = reactive({
  name: 'Vue2',
  age: 18,
  arr: [1, 2, 3],
})
const state1 = reactive({
  name: 'React17',
  age: 18,
  arr: [1, 2, 3],
})

effect(() => {
  console.log('effect:', state0.name)
  console.log('effect:', state1.name)
}, {})

state0.name = 'Vue3'

// Reflect.deleteProperty(state0, 'name')

// state0.name = 'VueNext'
