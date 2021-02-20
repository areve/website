const Home = () => import("./components/Home/Home.vue");
const Seaside = () => import("./components/Seaside/Seaside.vue");

export const routes = [
  { path: "/", component: Home },
  { path: "/seaside", component: Seaside },
];
