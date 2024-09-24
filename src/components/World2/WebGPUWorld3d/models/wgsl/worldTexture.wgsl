#include WorldMapUniforms;
#include WorldPoint;
#include clamp;
#include hsv2rgb;

@group(0) @binding(0) 
var<storage, read_write> textureData: array<WorldPoint>; 

@group(1) @binding(0)
var<uniform> worldMapUniforms: WorldMapUniforms;

fn c(v: f32) -> f32 {
  return clamp(v, 0, 1);
}

fn getWorldPointColor(worldPoint: WorldPoint) -> vec4f {
  let m = worldPoint.moisture;
  let t = worldPoint.temperature;
  let i = worldPoint.iciness;
  let d = worldPoint.desert;
  let height = worldPoint.height;
  let seaLevel = worldPoint.seaLevel;

  let isSea = height < worldPoint.seaLevel;
  
  if(isSea) {
    let seaDepth = c(1 - height / seaLevel);
    let sd = seaDepth;
    let seaHsv = vec3f(
      229.0 / 360.0,
      0.47 + sd * 0.242 - 0.1 + t * 0.2,
      0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1
    );
    return vec4f(hsv2rgb(vec3f(
      seaHsv[0],
      c(seaHsv[1] - 0.2 * i),
      c(seaHsv[2] + 0.2 * i)
    )), 1.0);
  } else {
    let heightAboveSeaLevel = pow((height - seaLevel) / (1 - seaLevel), 0.5);
    let sh = heightAboveSeaLevel;

    let landHsv = vec3f(
      77.0 / 360.0 - sh * (32.0 / 360.0) - 16.0 / 360.0 + m * (50.0 / 360.0),
      0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
      0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
    );

    return vec4f(hsv2rgb(vec3f(
      landHsv[0] - d * 0.1,
      c(landHsv[1] - 0.3 * i + d * 0.1),
      c(landHsv[2] + 0.6 * i + d * 0.45),
    )), 1.0);            
  }
}

@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let x = global_id.x;
  let y = global_id.y;
  let index = y * dataWidth + x ;
  if (x < dataWidth && y < dataHeight) {
    let index = y * dataHeight + x;
    textureData[index].color = getWorldPointColor(textureData[index]);
  }
}