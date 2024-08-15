import { Ref } from "vue";
import { clamp } from "../lib/other";

export interface Dimensions {
  width: number;
  height: number;
}

export interface Coord {
  x: number;
  y: number;
}

export interface RenderLayer<T1, T2, T3> {
  props: Ref<T2>;
  methods: T1;
  data: Ref<T3>;
  canvas: {
    element: Ref<HTMLCanvasElement>;
    context: CanvasRenderingContext2D | null;
    click: (event: MouseEvent) => void;
    mousemove: (event: MouseEvent) => void;
  };
}

export const coordFromEvent = (
  event: MouseEvent,
  dimensions: {
    width: number;
    height: number;
  }
) => {
  return {
    x: Math.round(clamp(event.offsetY, 0, dimensions.height - 1)),
    y: Math.round(clamp(event.offsetX, 0, dimensions.width - 1)),
  } as Coord;
};
