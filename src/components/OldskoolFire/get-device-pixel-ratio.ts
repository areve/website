function getDevicePixelRatio() {
  let ratio = 1;
  const screen = window.screen as any;

  // To account for zoom, change to use deviceXDPI instead of systemXDPI
  if (
    screen.systemXDPI !== undefined &&
    screen.logicalXDPI !== undefined &&
    screen.systemXDPI > screen.logicalXDPI
  ) {
    // Only allow for values > 1
    ratio = screen.systemXDPI / screen.logicalXDPI;
  } else if (window.devicePixelRatio !== undefined) {
    ratio = window.devicePixelRatio;
  }
  return ratio;
}

export { getDevicePixelRatio };
