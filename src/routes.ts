const Home = () => import("./components/Home/Home.vue");
const Seaside = () => import("./components/Seaside/Seaside.vue");
const Colours = () => import("./components/Colours/Colours.vue");
const AzureAD = () => import("./components/AzureAD/AzureAD.vue");
const AzureB2C = () => import("./components/AzureB2C/AzureB2C.vue");
const OldskoolFire = () => import("./components/OldskoolFire/OldskoolFire.vue");
const Fft = () => import("./components/Fft/Fft.vue");
const TicTacToe = () => import("./components/TicTacToe/TicTacToe.vue");
const Sierpinski = () => import("./components/Sierpinski/Sierpinski.vue");
const Mandelbrot = () => import("./components/Mandelbrot/Mandelbrot.vue");
const Stocks = () => import("./components/Stocks/Stocks.vue");

export const routes = [
  { path: "/code=:code(.*)", component: AzureAD },
  { path: "/state=:state(.*)", component: AzureB2C },
  { path: "/error=:error(.*)", component: AzureB2C },
  { path: "/", component: Home },
  { path: "/seaside", component: Seaside },
  { path: "/azure-ad", component: AzureAD },
  { path: "/azure-b2c", component: AzureB2C },
  { path: "/colours", component: Colours },
  { path: "/oldskool-fire", component: OldskoolFire },
  { path: "/fft", component: Fft },
  { path: "/tic-tac-toe", component: TicTacToe },
  { path: "/sierpinski", component: Sierpinski },
  { path: "/mandelbrot", component: Mandelbrot },
  { path: "/stocks", component: Stocks },
];
