// @ts-nocheck
void (async () => {
  await $`rimraf ./dist`
  await $`tsc --module esnext`
})()
