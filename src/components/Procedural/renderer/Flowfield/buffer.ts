export async function copyBuffer(device: GPUDevice, bufferA: GPUBuffer, bufferB: GPUBuffer) {
  try {
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(bufferA, 0, bufferB, 0, bufferA.size);
    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();
  } catch (e) {
    console.warn("seed copy A->B failed", e);
  }
}
