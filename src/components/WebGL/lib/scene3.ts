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

  const { controls, renderer, camera } = createViewport(canvas, width, height);

  const scene = new THREE.Scene();

  const cube = createCube();
  scene.add(cube);

  const landscape = createLandscape();
  scene.add(landscape);

  const sun = createSun();
  scene.add(sun);

  return function render(model: RenderModel, diffTime: number) {
    controls.update();
    cube.rotateX(0.001);
    cube.rotateY(0.003);
    cube.rotateZ(0.007);
    renderer.render(scene, camera);
  };
}

function createViewport(canvas: Canvas, width: number, height: number) {
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.translateY(4);
  camera.translateZ(2);

  const controls = new OrbitControls(camera, renderer.domElement);
  return { controls, renderer, camera };
}

function createCube() {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ color: "white" });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.x = 0;
  mesh.position.y = 1;

  return mesh;
}

function createLandscape() {
  const geometry = new THREE.PlaneGeometry(10, 10, 10, 10);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({ color: "lime" });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.x = 0;
  mesh.position.y = 0;

  return mesh;
}

function createSun() {
  const light = new THREE.DirectionalLight("white", 4);
  light.castShadow = true;
  //   light.shadow.mapSize.width = 512;
  //   light.shadow.mapSize.height = 512;
  //   light.shadow.camera.near = 0.05;
  //   light.shadow.camera.far = 200;

  light.position.set(5, 5, 0);
  return light;
}
