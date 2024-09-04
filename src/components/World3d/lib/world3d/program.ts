export function setupProgramInfo(gl: WebGLRenderingContext) {
  const program = setupProgram(gl);

  const programInfo = {
    program,
    pointers: {
      vertexPosition: gl.getAttribLocation(program, "vertexPosition"),
      vertexColor: gl.getAttribLocation(program, "vertexColor"),
      projectionMatrix: gl.getUniformLocation(program, "projectionMatrix")!,
      modelViewMatrix: gl.getUniformLocation(program, "modelViewMatrix")!,
    },
  };

  return programInfo;
}

export type ProgramInfo = ReturnType<typeof setupProgramInfo>;

function setupProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertexShader = `
      attribute vec4 vertexPosition;
      attribute vec4 vertexColor;

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;

      varying lowp vec4 color;

      void main(void) {
          gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
          color = vertexColor;
      }
    `;

  const fragmentShader = `
      varying lowp vec4 color;

      void main(void) {
          gl_FragColor = color;
      }
    `;

  const program = gl.createProgram()!;
  gl.attachShader(program, setupShader(gl, gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(program, setupShader(gl, gl.FRAGMENT_SHADER, fragmentShader));
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
