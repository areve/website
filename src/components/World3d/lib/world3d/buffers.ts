export function initBuffers(gl: WebGLRenderingContext) {
  const position = initPositionBuffer(gl);

  const colorBuffer = initColorBuffer(gl);

  const indexBuffer = initIndexBuffer(gl);

  return {
    position,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

function initPositionBuffer(gl: WebGLRenderingContext) {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
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
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  return buffer;
}

function initColorBuffer(gl: WebGLRenderingContext) {
  const frontFace = [1, 1, 1, 1];
  const backFace = [1, 0, 0, 1];
  const topFace = [0, 1, 0, 1];
  const bottomFace = [0, 0, 1, 1];
  const rightFace = [1, 1, 0, 1];
  const leftFace = [1, 0, 1, 1];
  const faceColors = [
    frontFace,
    backFace,
    topFace,
    bottomFace,
    rightFace,
    leftFace,
  ];

  const colors = faceColors.map((c) => [c, c, c, c]).flat().flat();


  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
}

function initIndexBuffer(gl: WebGLRenderingContext) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ];

  // Now send the element array to GL

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return indexBuffer;
}
