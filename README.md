# simple-vue-reactivity

## Install

```shell
npm install @zhixiangyao/reactivity
# or
pnpm install @zhixiangyao/reactivity
```

## Example

```js
import { reactive, effect } from '@zhixiangyao/reactivity'

const state = reactive({
  name: 'Vue2',
  age: 18,
  arr: [1, 2, 3],
})

effect(() => console.log('effect:', state.name), {})

state.name = '123'
```
