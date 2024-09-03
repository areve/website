import { toRaw } from "vue";
import { Rgb } from "./color";
import { Camera, Dimensions } from "./render";
import { mat4 } from "gl-matrix";

const channels = 4;

export interface RenderSetup {
  model: RenderModel;
  renderService: () => RenderService;
}
export interface RenderModel {
  title: string;
  seed: number;
  frame: number;
  dimensions: Dimensions;
  camera: Camera;
  selected: boolean;
  canvas?: OffscreenCanvas;
}

export interface FrameUpdated {
  frame: number;
  timeTaken: number;
}

export class MultiThreadedRender {
  canvas?: OffscreenCanvas;
  gl?: WebGLRenderingContext;
  private dirty: boolean = false;
  private busy: boolean = false;
  private model?: RenderModel;
  private workers: Worker[] = [];
  private arrays: Uint8ClampedArray[] = [];
  private h: number = 0;
  private w: number = 0;

  constructor(renderThreadWorkers: Worker[]) {
    this.workers = renderThreadWorkers;
    this.init();
  }

  private init() {
    self.onmessage = async (
      event: MessageEvent<{
        model: RenderModel;
        canvas?: OffscreenCanvas;
      }>
    ) => {
      const { canvas, model } = event.data;
      if (canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl") ?? undefined;
      }

      if (
        !this.model ||
        this.model.dimensions.height != model.dimensions.height ||
        this.model.dimensions.width != model.dimensions.width
      ) {
        this.h = Math.ceil(model.dimensions.height / this.workers.length);
        this.w = model.dimensions.width;
        this.arrays = Array.from({ length: this.workers.length }).map(
          (_) => new Uint8ClampedArray(this.w * this.h * channels)
        );
      }
      this.model = model;
      this.dirty = true;
      this.update();
    };
  }

  private async update() {
    if (!this.dirty || !this.model || !this.canvas || !this.gl) return;
    if (this.busy) return;

    this.busy = true;
    this.dirty = false;
    const start = self.performance.now();

    const gl = this.gl;

    // gl.clearColor(0.0, 0.5, 1.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    // Vertex shader program
    const vsSource = `
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

    const fsSource = `
      varying lowp vec4 vColor;

      void main(void) {
        gl_FragColor = vColor;
      }
    `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVertexColor and also
    // look up uniform locations.
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
        vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(
          shaderProgram,
          "uProjectionMatrix"
        ),
        modelViewMatrix: gl.getUniformLocation(
          shaderProgram,
          "uModelViewMatrix"
        ),
      },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);

    // Draw the scene
    drawScene(gl, programInfo, buffers);

    // if (
    //   this.canvas.width !== this.model.dimensions.width ||
    //   this.canvas.height !== this.model.dimensions.height
    // ) {
    //   this.canvas.width = this.model.dimensions.width;
    //   this.canvas.height = this.model.dimensions.height;
    //   this.h = Math.ceil(this.model.dimensions.height / this.workers.length);
    //   this.w = this.model.dimensions.width;
    // }

    // const results = await Promise.all(
    //   this.workers.map((v, i) =>
    //     this.renderPart(v, this.arrays[i], 0, i * this.h, this.w, this.h)
    //   )
    // );

    // this.arrays = results.map((result) => new Uint8ClampedArray(result));

    // this.arrays.forEach((a, i) => {
    //   this.context?.putImageData(
    //     new ImageData(a, this.w, this.h),
    //     0,
    //     i * this.h,
    //     0,
    //     0,
    //     this.w,
    //     this.h
    //   );
    // });

    const end = self.performance.now();
    self.postMessage({
      frame: this.model.frame,
      timeTaken: (end - start) / 1000,
    } as FrameUpdated);

    this.busy = false;
  }

  private renderPart(
    worker: Worker,
    array: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<ArrayBuffer> {
    return new Promise((resolve) => {
      worker.postMessage(
        {
          origin: { x, y },
          dimensions: { width, height },
          model: this.model,
          buffer: array.buffer,
        },
        []
      );
      worker.onmessage = (
        event: MessageEvent<{
          buffer: ArrayBuffer;
        }>
      ) => resolve(event.data.buffer);
    });
  }
}

export abstract class RenderThread {
  constructor() {
    this.init();
  }

  abstract pixel(x: number, y: number): Rgb;
  abstract update(model: RenderModel): void;

  private init() {
    self.onmessage = (
      event: MessageEvent<{
        origin: { x: number; y: number };
        dimensions: Dimensions;
        model: RenderModel;
        buffer: ArrayBuffer;
      }>
    ) => {
      const { model, origin, dimensions, buffer: inBuffer } = event.data;
      this.update(model);

      const buffer = this.render(
        origin.x,
        origin.y,
        dimensions.width,
        dimensions.height,
        model.camera,
        model.dimensions,
        inBuffer
      );

      self.postMessage(
        {
          buffer,
        },
        undefined as any,
        [buffer]
      );
    };
  }

  private render(
    x: number,
    y: number,
    width: number,
    height: number,
    camera: Camera,
    dimensions: Dimensions,
    buffer: ArrayBuffer
  ): ArrayBuffer {
    const cameraX = camera?.x ?? 0;
    const cameraY = camera?.y ?? 0;
    const cameraZoom = camera?.zoom ?? 1;
    const viewportCenterX = dimensions.width / 2 - x;
    const viewportCenterY = dimensions.height / 2 - y;
    const viewportAndCameraX = dimensions.width / 2 + cameraX;
    const viewportAndCameraY = dimensions.height / 2 + cameraY;

    const data = new Uint8ClampedArray(buffer);
    for (let ix = 0; ix < width; ++ix) {
      for (let iy = 0; iy < height; ++iy) {
        const v = this.pixel(
          (ix - viewportCenterX) * cameraZoom + viewportAndCameraX,
          (iy - viewportCenterY) * cameraZoom + viewportAndCameraY
        );
        const i = (ix + iy * width) * channels;
        data[i] = v[0] * 0xff;
        data[i + 1] = v[1] * 0xff;
        data[i + 2] = v[2] * 0xff;
        data[i + 3] = v[3] ? v[3] * 0xff : 0xff;
      }
    }
    return data.buffer;
  }
}

export class RenderService {
  private worker: Worker;

  public frameUpdated?: (frameUpdated: FrameUpdated) => void;

  constructor(renderWorker: Worker) {
    this.worker = renderWorker;
  }

  init(canvas: HTMLCanvasElement, model: RenderModel) {
    this.worker.onmessage = (event: MessageEvent) => {
      if (this.frameUpdated) this.frameUpdated(event.data);
    };

    const offscreenCanvas = canvas.transferControlToOffscreen();
    this.worker.postMessage({ model: toRaw(model), canvas: offscreenCanvas }, [
      offscreenCanvas,
    ]);
  }

  update(model: RenderModel): void {
    this.worker.postMessage({ model: toRaw(model) });
  }
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram() as WebGLProgram;
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new Error(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type) as WebGLShader;

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
  }

  return shader;
}

function initBuffers(gl: WebGLRenderingContext) {
  const positionBuffer = initPositionBuffer(gl);
  const colorBuffer = initColorBuffer(gl);

  return {
    position: positionBuffer,
    color: colorBuffer,
  };
}

function initPositionBuffer(gl: WebGLRenderingContext): WebGLBuffer {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer() as WebGLBuffer;

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function initColorBuffer(gl: WebGLRenderingContext) {
  const colors = [
    1.0,
    1.0,
    1.0,
    1.0, // white
    1.0,
    0.0,
    0.0,
    1.0, // red
    0.0,
    1.0,
    0.0,
    1.0, // green
    0.0,
    0.0,
    1.0,
    1.0, // blue
  ];

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
}

function drawScene(gl: WebGLRenderingContext, programInfo, buffers) {
  gl.clearColor(0.0, 0.5, 1.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.width / gl.canvas.height;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  mat4.translate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [-0.0, 0.0, -6.0]
  ); // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  setPositionAttribute(gl, buffers, programInfo);
  setColorAttribute(gl, buffers, programInfo);


  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl: WebGLRenderingContext, buffers, programInfo) {
  const numComponents = 2; // pull out 2 values per iteration
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

// Tell WebGL how to pull out the colors from the color buffer
// into the vertexColor attribute.
function setColorAttribute(gl: WebGLRenderingContext, buffers, programInfo) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}