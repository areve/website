// declare module '*.vue' {
//   import { DefineComponent } from 'vue'
//   const component: DefineComponent<{}, {}, any>
//   export default component
// }



 import { ComponentCustomProperties } from 'vue'
 import { Store } from 'vuex'
import { RootState } from './store'

declare module '@vue/runtime-core' {

  interface ComponentCustomProperties {
    $store: Store<RootState>
  }
}