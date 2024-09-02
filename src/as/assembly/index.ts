// import { Buffer } from 'buffer';
import { lerp } from "./lerp";
import { makeWorldGenerator } from "./world";

export { lerp, bar };

export let ary: Uint8Array = new Uint8Array(0);

function bar(): void {
  const width: i32 = 100;
  const height: i32 = 100;
  const channels: i8 = 4;
  const size: i32 = width * height * channels;
  ary = new Uint8Array(size);
  //   if (memory.size() < width * height * 4)
  memory.grow(2);
  const foo = makeWorldGenerator(<i32>123);
  store<u8>(0, 21);
  store<u8>(1, 99);
  store<u8>(122, 99);
  store<u8>(123, 99);
  store<u8>(124, 99);

  for (let x: i32 = 0; x < width; ++x) {
    for (let y: i32 = 0; y < height; ++y) {
      const i: i32 = y * width + x;
      ary[i] = foo(x, y, 0); //
    }
  }
}

// function foo(x: i32, y: i32, z: i32): u8 {
//     // return <u8>(127 + x + y) ;
//     return <u8>(127) ;
//   }
// //
// console.log('hello');
// function wasmWaveAlgorithm(wasm) {
// // module: wasm,

// const instance = wasm.instance;
//       const memory = wasm.importsObject ? wasm.importsObject.env.memory : instance.exports.memory;
//       this.byteOffset = wasm.importsObject ? instance.exports._getByteOffset() : 9192;

// const heap = memory.buffer;
// const width = 100;
// const height = 100;
// const byteOffset = 0;

// export function getImageArray() {
//   return new Uint8ClampedArray(heap, byteOffset, 4 * width * height);
// }
