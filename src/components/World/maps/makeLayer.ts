import { Ref, ref, watch } from "vue";
import { Layerx } from "../lib/prng";
import { clamp } from "../lib/other";

interface Dimensions {
  width: number;
  height: number;
}

export interface Layer<T1, T2> {
  props: Ref<T2 & Dimensions>;
  engine: T1 & Layerx;
  data: Ref<{
    hover: number;
  }>;
  canvas: {
    element: Ref<HTMLCanvasElement>;
    context: CanvasRenderingContext2D | null;
    click: (event: MouseEvent) => void;
    hover: (event: MouseEvent) => void;
  };
  render: () => void;
  select: (x: number, y: number) => void
  update: (props: T2 & Dimensions) => void;
}

export function makeLayer<T1, T2>(
  title: string,
  description: string,
  update: (props: T2) => T1,
  getData: (
    engine: T1,
    x: number,
    y: number
  ) => {
    hover: number;
  },
  select: (x: number, y: number) => void
) {
  const layer = {
    meta: { title, description },
    props: ref<T2 & Dimensions>({
      width: 0,
      height: 0,
    } as T2 & Dimensions),
    data: ref({
      hover: 0,
    }),
    update: (props: T2 & Dimensions) => {
      layer.props.value = props;
      Object.assign(layer.engine as any, update(props));
    },
    select,
    render: () => {
      const dimensions = {
        width: layer.props.value.width,
        height: layer.props.value.height,
      };
      layer.canvas.context ??= getContext(
        layer.canvas.element.value,
        dimensions
      );
      render(layer.canvas.context, layer.engine);
    },
    canvas: {
      element: ref<HTMLCanvasElement>(),
      context: null as CanvasRenderingContext2D | null,
      click(event: MouseEvent) {
        select(...coordFromEvent(event, layer.props.value));
      },
      hover(event: MouseEvent) {
        layer.data.value = getData(
          layer.engine,
          ...coordFromEvent(event, layer.props.value)
        );
      },
    },
    engine: {} as T1 & Layerx,
  } as Layer<T1, T2>;

  watch(layer.props, layer.render);
  return layer;
}

function getContext(
  canvas: HTMLCanvasElement | undefined,
  dimensions: {
    width: number;
    height: number;
  }
) {
  if (!canvas) return null;
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  return canvas.getContext("2d", {
    willReadFrequently: true,
  });
}

function render(
  context: CanvasRenderingContext2D | null,
  layer: Layerx,
  camera?: { x: number; y: number }
) {
  if (!context) return;
  const width = context.canvas.width;
  const height = context.canvas.height;
  const imageData = new ImageData(width, height);
  const data = imageData.data;
  const xMax = layer.props.width;
  const yMax = layer.props.height;
  const cameraX = camera?.x ?? 0;
  const cameraY = camera?.y ?? 0;
  for (let x = 0; x < xMax; ++x) {
    for (let y = 0; y < yMax; ++y) {
      const v = layer.pixel(x + cameraX, y + cameraY);
      const i = (x + y * width) * 4;
      data[i] = (v[0] * 0xff) >>> 0;
      data[i + 1] = (v[1] * 0xff) >>> 0;
      data[i + 2] = (v[2] * 0xff) >>> 0;
      data[i + 3] = ((v[3] ?? 1) * 0xff) >>> 0;
    }
  }

  context.putImageData(imageData, 0, 0);
}

const coordFromEvent = (
  event: MouseEvent,
  dimensions: {
    width: number;
    height: number;
  }
) => {
  return [
    Math.round(clamp(event.offsetY, 0, dimensions.height - 1)),
    Math.round(clamp(event.offsetX, 0, dimensions.width - 1)),
  ] as [x: number, y: number];
};
