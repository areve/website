import {
  RenderModel,
  RenderSetup,
  CanvasProgramInfo,
  CanvasRenderService,
} from "./render";
import * as THREE from "three";

let singletonCanvasRenderService: CanvasRenderService;

export const makeSphere1RenderSetup = (): RenderSetup => {
  return {
    model: {
      title: "Sphere 1",
      seed: 0,
      frame: 0,
      dimensions: { width: 500, height: 200 },
      camera: { x: 0, y: 0, zoom: 1 },
      selected: true,
      paused: false,
    },
    renderService: () =>
      (singletonCanvasRenderService ??= new CanvasRenderService(
        render,
        setupProgram
      )),
  };
};

function render(
  // gl: WebGL2RenderingContext,
  programInfo: CanvasProgramInfo,
  model: RenderModel
) {
  const { scene, cube, camera, renderer } = programInfo as any;
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

function setupProgram(
  canvas: HTMLCanvasElement,
  model: RenderModel
): CanvasProgramInfo {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();


  return { scene, cube, camera, renderer };
}
