const Home = () => import("./components/Home.vue");
const Seaside = () => import("./components/Seaside/Seaside.vue");
const Colours = () => import("./components/Colours/Colours.vue");
const AzureAD = () => import("./components/AzureAD/AzureAD.vue");
const AzureB2C = () => import("./components/AzureB2C/AzureB2C.vue");
const OldskoolFire = () => import("./components/OldskoolFire/OldskoolFire.vue");
const Fft = () => import("./components/Fft/Fft.vue");

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
];
