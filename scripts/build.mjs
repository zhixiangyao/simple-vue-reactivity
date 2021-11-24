// @ts-nocheck
void (async () => {
  await $`rimraf ./dist`
  await $`tsc --outDir dist/cjs --module commonjs`
  await $`tsc --outDir dist/esm --module esnext`
})()
