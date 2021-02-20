const Home = () => import("./components/Home.vue");
const Seaside = () => import("./components/Seaside/Seaside.vue");
const Colours = () => import("./components/Colours/Colours.vue");

export const routes = [
  { path: "/", component: Home },
  { path: "/seaside", component: Seaside },
  { path: "/colours", component: Colours },
];
