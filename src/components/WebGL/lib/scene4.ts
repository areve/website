import {
  RenderModel,
  CanvasRenderService,
  makeRenderSetup,
  Canvas,
} from "./render";
import * as THREE from "three/tsl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const {
  mx_noise_float,
  color,
  float,
  modelNormalMatrix,
  positionLocal,
  step,
  Fn,
  uniform,
  varying,
  vec3,
} = THREE;

export const scene4 = makeRenderSetup(
  "Experiment",
  500,
  200,
  new CanvasRenderService(setup)
);

async function setup(canvas: Canvas, model: RenderModel) {
  const { width, height } = model.dimensions;
  const { controls, renderer, camera } = createViewport(canvas, width, height);
  const scene = new THREE.Scene();

  const terrain = createTerrain();
  scene.add(terrain);

  const sun = createSun();
  scene.add(sun);

  await renderer.init();
  return function render() {
    controls.update();
    renderer.render(scene, camera);
  };
}

function createViewport(canvas: Canvas, width: number, height: number) {
  const renderer = new THREE.WebGPURenderer({
    antialias: true,
    canvas: canvas as any,
    alpha: false,
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.translateY(4);

  const controls = new OrbitControls(camera, renderer.domElement);
  return { controls, renderer, camera };
}

function createTerrain() {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.5,
    color: "#85d534",
  });

  const vNormal = varying(vec3());
  const vPosition = varying(vec3());

  const terrainElevation = Fn(
    ([position]: [
      THREE.ShaderNodeObject<THREE.Node>
    ]): THREE.ShaderNodeObject<THREE.VarNode> => {
      const noise = mx_noise_float(position, 1, 0);
      return float(noise).toVar();
    }
  );

  material.positionNode = Fn(() => {
    const position = positionLocal.xyz.toVar();
    const elevation = terrainElevation(positionLocal.xz);
    vNormal.assign(vec3(0, 1, 0));
    vPosition.assign(elevation);
    return position;
  })();

  material.normalNode = modelNormalMatrix.mul(vNormal);

  material.colorNode = Fn(() => {
    const colorSand = uniform(color("#000000"));
    const colorGrass = uniform(color("#ffffff"));

    const finalColor = colorSand.toVar();

    const grassMix = step(-0.06, vPosition.y);
    finalColor.assign(grassMix.mix(finalColor, colorGrass));

    return finalColor;
  })();

  const geometry = new THREE.PlaneGeometry(15, 5.8, 500, 200);
  geometry.rotateX(-Math.PI / 2);

  geometry.deleteAttribute("uv");
  geometry.deleteAttribute("normal");

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
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 30;
  light.shadow.camera.top = 8;
  light.shadow.camera.right = 8;
  light.shadow.camera.bottom = -8;
  light.shadow.camera.left = -8;
  light.shadow.normalBias = 0.05;
  light.shadow.bias = 0;
  light.position.set(5, 5, 0);
  return light;
}
