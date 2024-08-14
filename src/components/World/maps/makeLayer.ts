import { Ref } from "vue";
import { clamp } from "../lib/other";

export interface Dimension {
  width: number;
  height: number;
}
export interface Coord {
  x: number;
  y: number;
}

export interface RenderLayer<T1, T2, T3> {
  meta: {
    title: string;
    description: string;
  };
  props: Ref<T2>;
  data: T1;
  liveData: Ref<T3>;
  canvas: {
    element: Ref<HTMLCanvasElement>;
    context: CanvasRenderingContext2D | null;
    pixel: (x: number, y: number) => number[];
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
