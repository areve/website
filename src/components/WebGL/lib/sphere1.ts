import { RenderModel, RenderSetup, CanvasRenderService } from "./render";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import diffMap from "../assets/aerial_rocks_02_diff_4k.jpg";
import dispMap from "../assets/aerial_rocks_02_disp_1k.jpg";
import normMap from "../assets/aerial_rocks_02_nor_dx_1k.jpg";

let singleton: CanvasRenderService;

export const makeSphere1RenderSetup = (): RenderSetup => {
  return {
    model: {
      title: "Torus with shadow",
      seed: 0,
      frame: 0,
      dimensions: { width: 500, height: 200 },
      camera: { x: 0, y: 0, zoom: 1 },
      selected: true,
      paused: false,
    },
    renderService: () => (singleton ??= new CanvasRenderService(setup)),
  };
};

function setup(
  canvas: HTMLCanvasElement,
  model: RenderModel
): CanvasProgramInfo {
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

  const light = createLight();
  scene.add(light);

  const plane = createPlane();
  scene.add(plane);

  const torus = createTorus();
  scene.add(torus);

  return function render(model: RenderModel) {
    torus.rotation.x += 0.02;
    controls.update();
    renderer.render(scene, camera);
  };
}

function createLight() {
  const light = new THREE.PointLight();
  light.castShadow = true;
  light.color = new THREE.Color(1, 1, 1);
  light.shadow.mapSize.width = 512;
  light.shadow.mapSize.height = 512;
  light.shadow.camera.near = 0.05;
  light.shadow.camera.far = 200;
  light.position.set(0, 5, 0);
  light.intensity = 50;
  return light;
}

function createPlane() {
  const planeGeometry = new THREE.PlaneGeometry(20, 20);
  const planeMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load(diffMap),
  });
  planeMaterial.displacementMap = new THREE.TextureLoader().load(dispMap);
  planeMaterial.normalMap = new THREE.TextureLoader().load(normMap);

  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotateX(-Math.PI / 2);
  plane.position.y = -1.75;
  plane.position.z = -2;
  plane.receiveShadow = true;
  return plane;
}

function createTorus() {
  const torusGeometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
  const material = new THREE.MeshStandardMaterial();
  material.color = new THREE.Color(1, 1, 1);
  const torus = new THREE.Mesh(torusGeometry, material);
  torus.position.x = 0;
  torus.position.y = 0;
  torus.castShadow = true;
  torus.receiveShadow = true;
  return torus;
}
