import { clearTerminal, reactive, effect, computed } from '../src'

clearTerminal()

const state = reactive({
  name: 'lihb',
  age: 18,
  arr: [1, 2, 3],
})

effect(() => {
  // 每当 name 数据变化将会导致 effect 重新执行
  console.log('effect run:', state.name)
})

const info = computed(() => {
  // 创建一个计算属性，依赖name和age
  return `name: ${state.name}, age: ${state.age}`
})

effect(() => {
  // name 和 age 变化会导致计算属性的 value 发生变化，从而导致当前 effect 重新执行
  console.log(`info is <${info.value}>`)
})

console.log()

state.name = 'vue' // 数据发生变化后会触发使用了该数据的 effect 重新执行
