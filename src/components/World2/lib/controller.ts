type KeysState = {
  [key: string]: {
    pressed: boolean;
  };
};

const keysState: KeysState = {};

export function bindController() {
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
}

export function unbindController() {
  document.removeEventListener("keydown", onKeyDown);
  document.removeEventListener("keyup", onKeyUp);
}

export function keyPressed(key: string) {
  if (keysState[key]) return keysState[key].pressed;
  return false;
}

function onKeyDown(event: KeyboardEvent) {
  keysState[event.key.toLowerCase()] = {
    pressed: true,
  };
}

function onKeyUp(event: KeyboardEvent) {
  delete keysState[event.key];
}
