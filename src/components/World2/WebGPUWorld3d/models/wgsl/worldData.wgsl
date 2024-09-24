#include WorldMapUniforms;
#include WorldPoint;
#include fractalNoise;
#include clamp;
#include piecewiseCurve;

@group(0) @binding(0) 
var<storage, read_write> textureData: array<WorldPoint>; 

@group(1) @binding(0)
var<uniform> worldMapUniforms: WorldMapUniforms;
  
fn c(v: f32) -> f32 {
  return clamp(v, 0, 1);
}
  
fn heightIcinessCurve(t: f32) -> f32 {
  return piecewiseCurve(t, 0.8, 15.0);
}
        
fn temperatureIcinessCurve(t: f32) -> f32 {
  return 1 - piecewiseCurve(t, 0.3, 6.0);
}
  
fn moistureDesertCurve(t: f32) -> f32 {
  return 1 - piecewiseCurve(t, 0.3, 10.0);
}
        
fn temperatureDesertCurve(t: f32) -> f32 {
  return piecewiseCurve(t, 0.7, 8.0);
}
  
@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let x = global_id.x;
  let y = global_id.y;
  let index = y * width + x ;
  if x < width && y < height {
    let index = y * height + x;

    let wx = f32(x) * worldMapUniforms.zoom + worldMapUniforms.x;
    let wy = worldMapUniforms.height - f32(y) * worldMapUniforms.zoom + worldMapUniforms.y;

    var worldPoint: WorldPoint;
    worldPoint.height = fractalNoise(worldMapUniforms.seed, f32(wx) / 129, f32(wy) / 129, 0.0, 4);
    worldPoint.temperature = fractalNoise(worldMapUniforms.seed * 712345, f32(wx) / 312, f32(wy) / 125, 0.0, 2);
    worldPoint.moisture = fractalNoise(worldMapUniforms.seed * 812345, f32(wx) / 234, f32(wy) / 123, 0.0, 2);
    worldPoint.iciness = c(heightIcinessCurve(worldPoint.height) + temperatureIcinessCurve(worldPoint.temperature));
    worldPoint.desert = c(moistureDesertCurve(worldPoint.moisture) + temperatureDesertCurve(worldPoint.temperature));
    worldPoint.seaLevel = 0.55;
  
      // use other computation to come up with better color, this is just for debugging 
    worldPoint.color = vec4f(
      worldPoint.height, worldPoint.temperature, worldPoint.moisture, 1.0
    );

    textureData[index] = worldPoint;
  }
}