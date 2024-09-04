const glsl = (x: TemplateStringsArray) => x[0];

export interface ProgramInfo {
  instance: WebGLProgram;
  vertexPosition: GLint;
  vertexColor: GLint;
  vertexNormal: GLint;
  projectionMatrix: WebGLUniformLocation;
  modelViewMatrix: WebGLUniformLocation;
  normalMatrix: WebGLUniformLocation;
}

export function setupProgram(gl: WebGLRenderingContext): ProgramInfo {
  const program = createProgram(gl);

  return {
    instance: program,
    vertexPosition: gl.getAttribLocation(program, "vertexPosition"),
    vertexColor: gl.getAttribLocation(program, "vertexColor"),
    vertexNormal: gl.getAttribLocation(program, "vertexNormal"),
    projectionMatrix: gl.getUniformLocation(program, "projectionMatrix")!,
    modelViewMatrix: gl.getUniformLocation(program, "modelViewMatrix")!,
    normalMatrix: gl.getUniformLocation(program, "normalMatrix")!,
  };
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertexShader = glsl`
    attribute vec4 vertexPosition;
    attribute vec4 vertexColor;
    attribute vec4 vertexNormal;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat4 normalMatrix;

    varying lowp vec4 color;
    varying highp vec3 lighting;

    void main(void) {
      gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
      
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
      highp vec4 transformedNormal = normalMatrix * vertexNormal;
      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  
      color = vertexColor; 
      lighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  const fragmentShader = glsl`
    varying lowp vec4 color;
    varying highp vec3 lighting;

    void main(void) {
      gl_FragColor = vec4(color.rgb * lighting, color.a);
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
