export function setupProgramInfo(gl: WebGLRenderingContext) {
  const program = setupProgram(gl);

  const programInfo = {
    instance: program,
    vertexPosition: gl.getAttribLocation(program, "vertexPosition"),
    vertexColor: gl.getAttribLocation(program, "vertexColor"),
    vertexNormal: gl.getAttribLocation(program, "vertexNormal"),
    projectionMatrix: gl.getUniformLocation(program, "projectionMatrix")!,
    modelViewMatrix: gl.getUniformLocation(program, "modelViewMatrix")!,
    normalMatrix: gl.getUniformLocation(program, "normalMatrix")!,
  };

  return programInfo;
}

export type ProgramInfo = ReturnType<typeof setupProgramInfo>;

function setupProgram(gl: WebGLRenderingContext): WebGLProgram {
  const glsl = (x: TemplateStringsArray) => x[0];

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
          color = vertexNormal; // TODO not really but if i don't use it other stuff fails
          color = vertexColor; 

           // Apply lighting effect

          highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
          highp vec3 directionalLightColor = vec3(1, 1, 1);
          highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

          highp vec4 transformedNormal = normalMatrix * vertexNormal;//vec4(vertexNormal, 1.0);

          highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
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
