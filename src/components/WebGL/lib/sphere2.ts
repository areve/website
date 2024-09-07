import {
  RenderModel,
  CanvasRenderService,
  makeRenderSetup,
  Canvas,
  glsl,
} from "./render";

export const sphere2RenderSetup = makeRenderSetup(
  "Cube without three.js",
  500,
  200,
  new CanvasRenderService(setup)
);

function setup(canvas: Canvas, model: RenderModel) {
  const gl = canvas.getContext("webgl2")!;
  const program = gl.createProgram()!;
  gl.linkProgram(program);

  const { vertices, colors, indices } = cubeModel();
  const camera = createCamera(canvas.width, canvas.height);

  const { vertex_buffer, color_buffer, index_buffer } = storeModel(
    gl,
    vertices,
    colors,
    indices
  );

  const shaderProgram = createShaderProgram(gl);
  const { Pmatrix, Vmatrix, Mmatrix } = getProgramLocations(gl, shaderProgram);

  // Position
  bindProgram(gl, vertex_buffer, shaderProgram, color_buffer);

  return function render(model: RenderModel, diffTime: number) {
    rotateZ(camera.mov_matrix, diffTime * 0.0005);
    rotateY(camera.mov_matrix, diffTime * 0.0002);
    rotateX(camera.mov_matrix, diffTime * 0.0003);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);

    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(Pmatrix, false, camera.proj_matrix);
    gl.uniformMatrix4fv(Vmatrix, false, camera.view_matrix);
    gl.uniformMatrix4fv(Mmatrix, false, camera.mov_matrix);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  };
}

function createCamera(width: number, height: number) {
  // Projection
  const proj_matrix = get_projection(40, width / height, 1, 100);

  // View Translation
  const mov_matrix = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ].flat();
  const view_matrix = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ].flat();
  view_matrix[14] = view_matrix[14] - 6;
  return { mov_matrix, proj_matrix, view_matrix };
}

function bindProgram(
  gl: WebGL2RenderingContext,
  vertex_buffer: WebGLBuffer,
  shaderProgram: WebGLProgram,
  color_buffer: WebGLBuffer
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  const position = gl.getAttribLocation(shaderProgram, "position");
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(position);

  // Color
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  const color = gl.getAttribLocation(shaderProgram, "color");
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(color);

  gl.useProgram(shaderProgram);
}

function getProgramLocations(
  gl: WebGL2RenderingContext,
  shaderProgram: WebGLProgram
) {
  const Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix")!;
  const Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix")!;
  const Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix")!;
  return { Pmatrix, Vmatrix, Mmatrix };
}

function createShaderProgram(gl: WebGL2RenderingContext) {
  const vertCode = glsl`
    attribute vec3 position;
    uniform mat4 Pmatrix;
    uniform mat4 Vmatrix;
    uniform mat4 Mmatrix;
    attribute vec3 color;
    varying vec3 vColor;
    void main(void) { 
      gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
      vColor = color;
    }`;

  const fragCode = glsl`
    precision mediump float;
    varying vec3 vColor;
    void main(void) {
      gl_FragColor = vec4(vColor, 1.0);
    }`;

  const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);

  const shaderProgram = gl.createProgram()!;
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  return shaderProgram;
}

function storeModel(
  gl: WebGL2RenderingContext,
  vertices: number[],
  colors: number[],
  indices: number[]
) {
  const vertex_buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Create and store data into color buffer
  const color_buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Create and store data into index buffer
  const index_buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
  return { vertex_buffer, color_buffer, index_buffer };
}

function cubeModel() {
  const vertices = [
    [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
    ],
    [
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ],
    [
      [-1, -1, -1],
      [-1, 1, -1],
      [-1, 1, 1],
      [-1, -1, 1],
    ],
    [
      [1, -1, -1],
      [1, 1, -1],
      [1, 1, 1],
      [1, -1, 1],
    ],
    [
      [-1, -1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, -1, -1],
    ],
    [
      [-1, 1, -1],
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
    ],
  ]
    .flat()
    .flat();

  const colors = [
    [
      [5, 3, 7],
      [5, 3, 7],
      [5, 3, 7],
      [5, 3, 7],
    ],
    [
      [1, 1, 3],
      [1, 1, 3],
      [1, 1, 3],
      [1, 1, 3],
    ],
    [
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
    ],
    [
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [1, 1, 0],
      [1, 1, 0],
      [1, 1, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ]
    .flat()
    .flat();

  const indices = [
    [0, 1, 2],
    [0, 2, 3],
    [4, 5, 6],
    [4, 6, 7],
    [8, 9, 10],
    [8, 10, 11],
    [12, 13, 14],
    [12, 14, 15],
    [16, 17, 18],
    [16, 18, 19],
    [20, 21, 22],
    [20, 22, 23],
  ].flat();
  return { vertices, colors, indices };
}

function rotateZ(m: number[], angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const mv0 = m[0],
    mv4 = m[4],
    mv8 = m[8];

  m[0] = c * m[0] - s * m[1];
  m[4] = c * m[4] - s * m[5];
  m[8] = c * m[8] - s * m[9];

  m[1] = c * m[1] + s * mv0;
  m[5] = c * m[5] + s * mv4;
  m[9] = c * m[9] + s * mv8;
}

function rotateX(m: number[], angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const mv1 = m[1],
    mv5 = m[5],
    mv9 = m[9];

  m[1] = m[1] * c - m[2] * s;
  m[5] = m[5] * c - m[6] * s;
  m[9] = m[9] * c - m[10] * s;

  m[2] = m[2] * c + mv1 * s;
  m[6] = m[6] * c + mv5 * s;
  m[10] = m[10] * c + mv9 * s;
}

function rotateY(m: number[], angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const mv0 = m[0],
    mv4 = m[4],
    mv8 = m[8];

  m[0] = c * m[0] + s * m[2];
  m[4] = c * m[4] + s * m[6];
  m[8] = c * m[8] + s * m[10];

  m[2] = c * m[2] - s * mv0;
  m[6] = c * m[6] - s * mv4;
  m[10] = c * m[10] - s * mv8;
}

function get_projection(angle: number, a: number, zMin: number, zMax: number) {
  const ang = Math.tan((angle * 0.5 * Math.PI) / 180); //angle*.5
  return [
    [0.5 / ang, 0, 0, 0],
    [0, (0.5 * a) / ang, 0, 0],
    [0, 0, -(zMax + zMin) / (zMax - zMin), -1],
    [0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0],
  ].flat();
}
