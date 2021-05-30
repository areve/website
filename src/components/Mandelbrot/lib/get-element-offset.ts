function getElementDocumentOffset(el: HTMLElement) {
  let x = 0;
  let y = 0;
  let currentEl: HTMLElement | null = el;
  while (
    currentEl &&
    !isNaN(currentEl.offsetLeft) &&
    !isNaN(currentEl.offsetTop)
  ) {
    x += currentEl.offsetLeft - currentEl.scrollLeft;
    y += currentEl.offsetTop - currentEl.scrollTop;
    currentEl = currentEl.offsetParent as HTMLElement;
  }
  return { x, y };
}

function getElementScreenOffset(el: HTMLElement) {
  const { x, y } = getElementDocumentOffset(el);
  const scrollLeft =
    window.pageXOffset !== undefined
      ? window.pageXOffset
      : (document.documentElement || document.body.parentNode || document.body)
          .scrollLeft;
  const scrollTop =
    window.pageYOffset !== undefined
      ? window.pageYOffset
      : (document.documentElement || document.body.parentNode || document.body)
          .scrollTop;

  return {
    x: x - scrollLeft,
    y: y - scrollTop,
  };
}

export { getElementDocumentOffset, getElementScreenOffset };
