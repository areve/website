export function setupProgramInfo(gl: WebGLRenderingContext) {
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const program = setupProgram(gl);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexColor and also
  // look up uniform locations.
  const programInfo = {
    program,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(program, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(program, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(program, "uProjectionMatrix"),
      modelViewMatrix: gl.getUniformLocation(program, "uModelViewMatrix"),
    },
  };

  return programInfo;
}

export type ProgramInfo = ReturnType<typeof setupProgramInfo>;

function setupProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertexShaderSource = `
      attribute vec4 aVertexPosition;
      attribute vec4 aVertexColor;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;

      varying lowp vec4 vColor;

      void main(void) {
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
          vColor = aVertexColor;
      }
    `;
  const vertexShader = setupShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

  const fragmentShaderSource = `
      varying lowp vec4 vColor;

      void main(void) {
          gl_FragColor = vColor;
      }
    `;
  const fragmentShader = setupShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    throw new Error(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        program
      )}`
    );
  }

  return program;
}

function setupShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
  }

  return shader;
}
