import { shallowMount } from '@vue/test-utils'
import FlatCss from '@/components/FlatCss/FlatCss.vue'

describe('FlatCss.vue', () => {
  it('renders "flat.css" somewhere', () => {
    const wrapper = shallowMount(FlatCss)
    expect(wrapper.text()).toMatch('flat.css')
  })
})