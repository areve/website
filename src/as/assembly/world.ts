export type Fn = (x: i32, y: i32, z: i32) => u8;
export const makeWorldGenerator = (seed: i32): Fn => {
  return (x: i32, y: i32, z: i32): u8 => {
    return <u8>(127 + x + y) ;
    // return <u8>(127) ;
  };

  
};
