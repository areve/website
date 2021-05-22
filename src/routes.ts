const Home = () => import("./components/Home.vue");
const Seaside = () => import("./components/Seaside/Seaside.vue");
const Colours = () => import("./components/Colours/Colours.vue");
const AzureAD = () => import("./components/AzureAD/AzureAD.vue");

export const routes = [
  { path: "/code=:code(.*)", component: AzureAD },
  { path: "/", component: Home },
  { path: "/seaside", component: Seaside },
  { path: "/azure-ad", component: AzureAD },
  { path: "/colours", component: Colours },
];
