export function clearTextureToBlack(device: GPUDevice, texture: GPUTexture) {
  const commandEncoder = device.createCommandEncoder();
  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: texture.createView(),
        clearValue: [0, 0, 0, 0],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };
  const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);
}
