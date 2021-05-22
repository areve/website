const Home = () => import("./components/Home.vue");
const Seaside = () => import("./components/Seaside/Seaside.vue");
const Colours = () => import("./components/Colours/Colours.vue");
const SignIn = () => import("./components/SignIn/SignIn.vue");

export const routes = [
  { path: "/code=:code(.*)", component: SignIn },
  { path: "/", component: Home },
  { path: "/seaside", component: Seaside },
  { path: "/sign-in", component: SignIn },
  { path: "/colours", component: Colours },
];
