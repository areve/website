
struct WorldPoint {
  height: f32,
  temperature: f32,
  moisture: f32,
  iciness: f32,
  desert: f32,
  seaLevel: f32,
  _pad1: f32, // because vec4f wants is aligned to 16byte
  _pad2: f32, // because vec4f wants is aligned to 16byte
  color: vec4f
};