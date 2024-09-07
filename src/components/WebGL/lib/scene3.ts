import {
  RenderModel,
  CanvasRenderService,
  makeRenderSetup,
  Canvas,
} from "./render";
import * as THREE from "three/tsl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  mx_noise_float,
  color,
  cross,
  dot,
  float,
  modelNormalMatrix,
  positionLocal,
  sign,
  step,
  Fn,
  uniform,
  varying,
  vec2,
  vec3,
  Loop,
} from "three/tsl";

export const scene3 = makeRenderSetup(
  "Experimental scene, using three.js",
  500,
  400,
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

  const terrain = createTerrain();
  scene.add(terrain);

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
  const renderer = new THREE.WebGPURenderer({
    antialias: true,
    canvas: canvas as any,
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
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

function createTerrain() {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness: 0.5,
    color: "#85d534",
  });

  const noiseIterations = uniform(3);
  const positionFrequency = uniform(0.175);
  const warpFrequency = uniform(6);
  const warpStrength = uniform(1);
  const strength = uniform(10);
  const offset = uniform(vec2(0, 0));
  const normalLookUpShift = uniform(0.01);
  const colorSand = uniform(color("#ffe894"));
  const colorGrass = uniform(color("#85d534"));
  const colorSnow = uniform(color("#ffffff"));
  const colorRock = uniform(color("#bfbd8d"));

  const vNormal = varying(vec3());
  const vPosition = varying(vec3());

  const terrainElevation = Fn(
    ([position]: [
      THREE.ShaderNodeObject<THREE.Node>
    ]): THREE.ShaderNodeObject<THREE.VarNode> => {
      const warpedPosition = position.add(offset).toVar();
      warpedPosition.addAssign(
        mx_noise_float(
          warpedPosition.mul(positionFrequency).mul(warpFrequency),
          1,
          0
        ).mul(warpStrength)
      );

      const elevation = float(0).toVar();
      Loop(
        {
          type: "float",
          start: float(1),
          end: noiseIterations.toFloat(),
          condition: "<=",
        },
        ({ i }: { i: THREE.ShaderNodeObject<THREE.Node> }) => {
          const noiseInput = warpedPosition
            .mul(positionFrequency)
            .mul(i.mul(2))
            .add(i.mul(987));
          const noise = mx_noise_float(noiseInput, 1, 0).div(i.add(1).mul(2));
          elevation.addAssign(noise);
        }
      );

      const elevationSign = sign(elevation);
      elevation.assign(elevation.abs().pow(2).mul(elevationSign).mul(strength));

      return elevation;
    }
  );

  material.positionNode = Fn(() => {
    // neighbours positions

    const neighbourA = positionLocal.xyz
      .add(vec3(normalLookUpShift, 0.0, 0.0))
      .toVar();
    const neighbourB = positionLocal.xyz
      .add(vec3(0.0, 0.0, normalLookUpShift.negate()))
      .toVar();

    // elevations

    const position = positionLocal.xyz.toVar();
    const elevation = terrainElevation(positionLocal.xz);
    position.y.addAssign(elevation);

    neighbourA.y.addAssign(terrainElevation(neighbourA.xz));
    neighbourB.y.addAssign(terrainElevation(neighbourB.xz));

    // compute normal

    const toA = neighbourA.sub(position).normalize();
    const toB = neighbourB.sub(position).normalize();
    vNormal.assign(cross(toA, toB));

    // varyings

    vPosition.assign(position.add(vec3(offset.x, 0, offset.y)));

    return position;
  })();

  material.normalNode = modelNormalMatrix.mul(vNormal);

  material.colorNode = Fn(() => {
    const finalColor = colorSand.toVar();

    // grass
    const grassMix = step(-0.06, vPosition.y);
    finalColor.assign(grassMix.mix(finalColor, colorGrass));

    // rock
    const rockMix = step(0.5, dot(vNormal, vec3(0, 1, 0)))
      .oneMinus()
      .mul(step(-0.06, vPosition.y));
    finalColor.assign(rockMix.mix(finalColor, colorRock));

    // snow
    const snowThreshold = mx_noise_float(vPosition.xz.mul(25), 1, 0)
      .mul(0.1)
      .add(0.45);
    const snowMix = step(snowThreshold, vPosition.y);
    finalColor.assign(snowMix.mix(finalColor, colorSnow));

    return finalColor;
  })();

  const geometry = new THREE.PlaneGeometry(10, 10, 500, 500);
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
