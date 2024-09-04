export function setupPositions(
  gl: WebGLRenderingContext,
  vertexPosition: GLint
) {
  const frontFace = [-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1];
  const backFace = [-1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1];
  const topFace = [-1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1];
  const bottomFace = [-1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1];
  const rightFace = [1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1];
  const leftFace = [-1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1];
  const positions = [
    frontFace,
    backFace,
    topFace,
    bottomFace,
    rightFace,
    leftFace,
  ].flat();

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  bindPositions(gl, buffer, vertexPosition);
}

function bindPositions(
  gl: WebGLRenderingContext,
  position: WebGLBuffer,
  vertexPosition: GLint
) {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.vertexAttribPointer(
    vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(vertexPosition);
}

export function createColors(gl: WebGLRenderingContext, vertexColor: GLint) {
  const frontFace = [1, 1, 1, 1];
  const backFace = [1, 0, 0, 1];
  const topFace = [0, 1, 0, 1];
  const bottomFace = [0, 0, 1, 1];
  const rightFace = [1, 1, 0, 1];
  const leftFace = [1, 0, 1, 1];
  const colors = [frontFace, backFace, topFace, bottomFace, rightFace, leftFace]
    .map((c) => [c, c, c, c])
    .flat()
    .flat();

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  bindColors(gl, buffer, vertexColor);
}

function bindColors(
  gl: WebGLRenderingContext,
  color: WebGLBuffer,
  vertexColor: GLint
) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, color);
  gl.vertexAttribPointer(
    vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(vertexColor);
}
export function createIndices(gl: WebGLRenderingContext) {
  const front = [0, 1, 2, 0, 2, 3];
  const back = [4, 5, 6, 4, 6, 7];
  const top = [8, 9, 10, 8, 10, 11];
  const bottom = [12, 13, 14, 12, 14, 15];
  const right = [16, 17, 18, 16, 18, 19];
  const left = [20, 21, 22, 20, 22, 23];
  const indices = [front, back, top, bottom, right, left].flat();

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  bindIndices(gl, buffer);
  return { vertexCount: indices.length };
}

function bindIndices(gl: WebGLRenderingContext, indices: WebGLBuffer) {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
}
