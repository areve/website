import {
  RenderModel,
  CanvasRenderService,
  makeRenderSetup,
  Canvas,
} from "./render";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import diffMap from "../assets/aerial_rocks_02_diff_4k.jpg";
import dispMap from "../assets/aerial_rocks_02_disp_1k.jpg";
import normMap from "../assets/aerial_rocks_02_nor_dx_1k.jpg";

export const scene3 = makeRenderSetup(
  "Experimental scene, using three.js",
  500,
  200,
  new CanvasRenderService(setup)
);
// scene3.model.paused = true;
// scene3.model.selected = false;

function setup(canvas: Canvas, model: RenderModel) {
  const { width, height } = model.dimensions;

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 3;
  camera.rotation.x = 20;
  camera.rotation.y = 0.7;
  camera.rotation.z = 1;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;

  const scene = new THREE.Scene();

  const cube = createCube();
  scene.add(cube);

  return function render(model: RenderModel, diffTime: number) {
    controls.update();
    cube.rotateX(0.001);
    cube.rotateY(0.003);
    cube.rotateZ(0.007);
    renderer.render(scene, camera);
  };
}
function createCube() {
  const geometry = new THREE.BoxGeometry();
  //   const material = new THREE.MeshStandardMaterial({ color: "salmon" });
  const material = new THREE.MeshNormalMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.x = 0;
  mesh.position.y = 0;

  return mesh;
}
