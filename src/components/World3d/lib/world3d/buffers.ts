export function setupPositions(
  gl: WebGLRenderingContext,
  vertices: number[],
  vertexPosition: GLint
) {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
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

export function createColors(
  gl: WebGLRenderingContext,
  colors: number[],
  vertexColor: GLint
) {
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
export function createIndices(gl: WebGLRenderingContext, indices: number[]) {

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
