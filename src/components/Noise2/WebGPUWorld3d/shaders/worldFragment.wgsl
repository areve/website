struct Uniforms {
    width: f32,
    height: f32,
    seed: f32,
    scale: f32,
    x: f32,
    y: f32,
    z: f32,
    zoom: f32
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

fn noise(seed: f32, coord: vec4<f32>) -> f32 {
    let n: u32 = bitcast<u32>(seed) + bitcast<u32>(coord.x * 374761393.0) + bitcast<u32>(coord.y * 668265263.0) + bitcast<u32>(coord.z * 1440662683.0) + bitcast<u32>(coord.w * 3865785317.0);
    let m: u32 = (n ^ (n >> 13)) * 1274126177;
    return f32(m) / f32(0xffffffff);
}
          
const skew3d: f32 = 1.0 / 3.0;
const unskew3d: f32 = 1.0 / 6.0;
const rSquared3d: f32 = 3.0 / 4.0;

fn openSimplex3d(seed: f32, x: f32, y: f32, z: f32) -> f32 {
    let sx: f32 = x;
    let sy: f32 = y;
    let sz: f32 = z;
    let skew: f32 = (sx + sy + sz) * skew3d;
    let ix: i32 = i32(floor(sx + skew));
    let iy: i32 = i32(floor(sy + skew));
    let iz: i32 = i32(floor(sz + skew));
    let fx: f32 = sx + skew - f32(ix);
    let fy: f32 = sy + skew - f32(iy);
    let fz: f32 = sz + skew - f32(iz);

    return 0.5 + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 0) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 0, 1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 0, 1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 0, 1, 1) + vertexContribution(seed, ix, iy, iz, fx, fy, fz, 1, 1, 1) ;
}

fn vertexContribution(
    seed: f32,
    ix: i32, iy: i32, iz: i32,
    fx: f32, fy: f32, fz: f32,
    cx: i32, cy: i32, cz: i32
) -> f32 {
    let dx: f32 = fx - f32(cx);
    let dy: f32 = fy - f32(cy);
    let dz: f32 = fz - f32(cz);
    let skewedOffset: f32 = (dx + dy + dz) * unskew3d;
    let dxs: f32 = dx - skewedOffset;
    let dys: f32 = dy - skewedOffset;
    let dzs: f32 = dz - skewedOffset;

    let a: f32 = rSquared3d - dxs * dxs - dys * dys - dzs * dzs;
    if a < 0.0 {
        return 0.0;
    }

    let h: i32 = bitcast<i32>(noise(seed, vec4f(f32(ix + cx), f32(iy + cy), f32(iz + cz), 0.0))) & 0xfff;
    let u: i32 = (h & 0xf) - 8;
    let v: i32 = ((h >> 4) & 0xf) - 8;
    let w: i32 = ((h >> 8) & 0xf) - 8;
    return (a * a * a * a * (f32(u) * dxs + f32(v) * dys + f32(w) * dzs)) / 2.0;
}

fn clamp(value: f32, low: f32, high: f32) -> f32 {
    return min(max(value, low), high);
}

fn c(v: f32) -> f32 {
    return clamp(v, 0, 1);
}

fn hsv2rgb(hsv: vec3f) -> vec3f {
    let h = hsv.x;
    let s = hsv.y;
    let v = hsv.z;
    let hue = (((h * 360) % 360) + 360) % 360;
    let sector = floor(hue / 60);
    let sectorFloat = hue / 60 - sector;
    let x = v * (1 - s);
    let y = v * (1 - s * sectorFloat);
    let z = v * (1 - s * (1 - sectorFloat));
    let rgb = array<f32, 10>(x, x, z, v, v, y, x, x, z, v);

    return vec3f(rgb[u32(sector) + 4], rgb[u32(sector) + 2], rgb[u32(sector)]);
}

fn piecewiseCurve(t: f32, p: f32, s: f32) -> f32 {
    var c: f32;
    if s == 3.0 {
        c = 1e10;
    } else {
        c = (1.0 - s) / (s - 3.0);
    }

    if t < p {
        let n = t * (1.0 + c);
        let d = t + p * c;
        let r = n / d;
        return t * r * r;
    } else {
        let v = 1.0 - t;
        let n = v * (1.0 + c);
        let d = v + (1.0 - p) * c;
        let r = n / d;
        return 1.0 - v * r * r;
    }
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

@fragment
fn main(
    @location(0) fragUV: vec2f,
    @location(1) fragPosition: vec4f,
    @location(2) face: vec2f,
) -> @location(0) vec4f {
    let coord = vec4(fragUV.x * 100 - face.x * 100, fragUV.y * 100 - face.y * 100, 0.0, 0.0);

    let x = coord.x / uniforms.scale * uniforms.zoom + uniforms.x / uniforms.scale;
    let y = coord.y / uniforms.scale * uniforms.zoom + uniforms.y / uniforms.scale;
    let z = uniforms.z;

    let height1 = openSimplex3d(uniforms.seed * 112345, x / 129, y / 129, z / 129);
    let height2 = openSimplex3d(uniforms.seed * 212345, x / 47, y / 47, z / 47);
    let height3 = openSimplex3d(uniforms.seed * 312345, x / 7, y / 7, z / 7);
    let height4 = openSimplex3d(uniforms.seed * 412345, x / 1, y / 1, z / 1);
    let temperature1 = openSimplex3d(uniforms.seed * 512345, x / 71, y / 71, z / 71);
    let temperature2 = openSimplex3d(uniforms.seed * 612345, x / 15, y / 15, z / 15);
    let moisture1 = openSimplex3d(uniforms.seed * 712345, x / 67, y / 67, z / 67);
    let moisture2 = openSimplex3d(uniforms.seed * 812345, x / 13, y / 13, z / 13);
    let height = 0.6 * height1 + 0.3 * height2 + 0.15 * height3 + 0.05 * height4;
    let temperature = 0.7 * temperature1 + 0.3 * temperature2;
    let moisture = 0.7 * moisture1 + 0.3 * moisture2;

    let seaLevel = 0.6;
    let isSea = height < seaLevel;

    let heightAboveSeaLevel = pow((height - seaLevel) / (1 - seaLevel), 0.5);
    let seaDepth = c(1 - height / seaLevel);
    let iciness = c(heightIcinessCurve(height) + temperatureIcinessCurve(temperature));
    let desert = c(moistureDesertCurve(moisture) + temperatureDesertCurve(temperature));

            // convert point to color
    let sh = heightAboveSeaLevel;
    let sd = seaDepth;
    let m = moisture;
    let t = temperature;
    let i = iciness;
    let d = desert;

    if isSea {
        let seaHsv = vec3f(
            229.0 / 360.0,
            0.47 + sd * 0.242 - 0.1 + t * 0.2,
            0.25 + (1 - sd) * 0.33 + 0.05 - m * 0.1
        );

        return vec4<f32>(hsv2rgb(vec3f(
            seaHsv[0],
            c(seaHsv[1] - 0.2 * i),
            c(seaHsv[2] + 0.2 * i)
        )), 1.0);
    } else {
        let landHsv = vec3f(
            77.0 / 360.0 - sh * (32.0 / 360.0) - 16.0 / 360.0 + m * (50.0 / 360.0),
            0.34 - sh * 0.13 + (1 - m) * 0.05 + 0.1 - (1 - t) * 0.2,
            0.4 - sh * 0.24 - 0.25 + (1 - m) * 0.6 - (1 - t) * 0.1,
        );

        return vec4<f32>(hsv2rgb(vec3f(
            landHsv[0] - d * 0.1,
            c(landHsv[1] - 0.3 * i + d * 0.1),
            c(landHsv[2] + 0.6 * i + d * 0.45),
        )), 1.0);
    }
}