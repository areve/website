function rearrangeSamples(samples, offset, w, stride, channels) {
  var target = 0;
  for (var pos = 0; pos < w; ++pos) {
    if (target > pos) {
      for (var k = 0; k < channels; ++k) {
        var a = offset + target * stride + k;
        var b = offset + pos * stride + k;
        var tmp = samples[a];
        samples[a] = samples[b];
        samples[b] = tmp;
      }
    }
    var mask = w;
    while (target & (mask >>= 1)) {
      target &= ~mask;
    }
    target |= mask;
  }
}

function shiftSamples(samples, base, w, stride, channels) {
  var mid = base + (w * stride) / 2;
  for (var i = 0; i < w / 2; ++i) {
    for (var k = 0; k < channels; ++k) {
      var a = base + i * stride + k;
      var b = mid + i * stride + k;
      var tmp = samples[a];
      samples[a] = samples[b];
      samples[b] = tmp;
    }
  }
}

function inverseFft(real, imag, w, h, dx, dy, channels) {
  return performFft(real, imag, w, h, dx, dy, true, channels);
}

function fft(real, imag, w, h, dx, dy, channels) {
  return performFft(real, imag, w, h, dx, dy, false, channels);
}

function performFft(real, imag, w, h, dx, dy, inverse, channels) {
  const pi = Math.PI;
  for (var j = 0; j < h; ++j) {
    if (inverse) {
      shiftSamples(real, j * dy, w, dx, channels);
      shiftSamples(imag, j * dy, w, dx, channels);
    }

    rearrangeSamples(real, j * dy, w, dx, channels);
    rearrangeSamples(imag, j * dy, w, dx, channels);

    var angularScale = inverse ? pi : -pi;
    for (var step = 1; step < w; step += step) {
      var delta = angularScale / step;
      var sine = Math.sin(delta / 2);
      var fac_r = 1;
      var fac_i = 0;
      var mul_r = -2 * sine * sine;
      var mul_i = Math.sin(delta);
      for (var group = 0; group < step; ++group) {
        for (var pair = group; pair < w; pair += step * 2) {
          var match = pair + step;
          for (var k = 0; k < channels; ++k) {
            var p_index = j * dy + pair * dx + k;
            var m_index = j * dy + match * dx + k;
            var r = real[m_index];
            var i = imag[m_index];

            var prod_r = r * fac_r - i * fac_i;
            var prod_i = r * fac_i + i * fac_r;

            real[m_index] = real[p_index] - prod_r;
            imag[m_index] = imag[p_index] - prod_i;
            real[p_index] += prod_r;
            imag[p_index] += prod_i;
          }
        }

        var inc_r = mul_r * fac_r - mul_i * fac_i;
        var inc_i = mul_r * fac_i + mul_i * fac_r;
        fac_r += inc_r;
        fac_i += inc_i;
      }
    }

    if (!inverse) {
      shiftSamples(real, j * dy, w, dx, channels);
      shiftSamples(imag, j * dy, w, dx, channels);
    }
  }
}

export { fft, inverseFft };
