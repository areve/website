import { Ref } from "vue";

export interface Dimensions {
  width: number;
  height: number;
}

export interface RenderLayer<T1, T2> {
  meta: {
    title: string;
    description: string;
  };
  props: Ref<T2>;
  data: T1;
  canvas: {
    element: Ref<HTMLCanvasElement>;
    context: CanvasRenderingContext2D | null;
    pixel: (x: number, y: number) => number[];
  };
}
