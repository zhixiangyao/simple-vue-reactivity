// @ts-nocheck
void (async () => {
  await $`rimraf ./dist/cjs`
  await $`tsc --outDir dist/cjs --module commonjs`
  await $`rimraf ./dist/esm`
  await $`tsc --declaration --declarationDir dist/types --outDir dist/esm --module esnext`
})()
