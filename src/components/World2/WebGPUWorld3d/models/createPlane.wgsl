struct WorldMapUniforms {
  width: f32,
  height: f32,
  seed: f32,
  scale: f32,
  x: f32,
  y: f32,
  z: f32,
  zoom: f32
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) color: vec4f,
  @location(2) normal: vec3f,
}

struct CameraUniforms {
  transform: mat4x4f
};

struct WorldPoint {
  height: f32,
  temperature: f32,
  moisture: f32,
  iciness: f32,
  desert: f32,
  seaLevel: f32,
  _pad1: f32,
  _pad2: f32,
  color: vec4f
};

@group(0) @binding(0)
var<uniform> worldMapUniforms: WorldMapUniforms;

@group(1) @binding(0) 
var<uniform> cameraUniforms: CameraUniforms;

@group(2) @binding(0) 
var<uniform> textureDimension: vec2<u32>; 

@group(3) @binding(0) 
var<storage> textureData: array<WorldPoint>; 

@vertex
fn vertexMain(
  @location(0) position: vec4f,
  @location(1) uv: vec2f
) -> VertexOutput {
  var texWidth: u32 = u32(textureDimension.x);
  var texHeight: u32 = u32(textureDimension.y);

  let index = u32(uv.y * f32(texHeight) - 1) * texWidth + u32(uv.x * f32(texWidth) - 1);
  let worldPoint = textureData[index];
  let worldPointA = textureData[index + 1]; 
  let worldPointB = textureData[index + texWidth]; 

  var diffDist = worldMapUniforms.zoom / 20.0;
  var toA = normalize(vec3(diffDist, 0.0, (worldPointA.height - worldPoint.height)));
  var toB = normalize(vec3(0.0, diffDist, (worldPointB.height - worldPoint.height)));
  
  var output: VertexOutput;
  output.normal = normalize(cross(toA, toB));

  var height = worldPoint.height; 
  let isSea = height < worldPoint.seaLevel;
  if (isSea) {
    height = worldPoint.seaLevel;
    output.normal = normalize(vec3(output.normal.x, output.normal.y, output.normal.z * 4));
  }

  output.position = cameraUniforms.transform * (position + vec4f(0.0, 0.0, (height - worldPoint.seaLevel) / worldMapUniforms.zoom * 5, 0.0));
  output.uv = uv;
  output.color = worldPoint.color;
  return output;
}

@fragment
fn fragMain(
  @location(0) uv: vec2f,
  @location(1) color: vec4f,
  @location(2) normal: vec3f,
) -> @location(0) vec4f {
  var texWidth: u32 = u32(textureDimension.x);
  var texHeight: u32 = u32(textureDimension.y);

  let index = u32(uv.y * f32(texHeight)) * texWidth + u32(uv.x * f32(texWidth));
  let worldPoint = textureData[index];

  let lightDir: vec3f = normalize(vec3f(1.0, 0.0, 1.0)); 
  let lightIntensity: f32 = dot(normal, lightDir);
  let intensity: f32 = min(max(lightIntensity, 0.0), 1.0);

  return vec4<f32>(worldPoint.color.rgb * intensity, 1.0);            
}