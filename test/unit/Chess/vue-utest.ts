import { flushPromises, shallowMount } from '@vue/test-utils'

let wrapper: any = null;

class App {
    shallow(component: any) {
        wrapper = shallowMount(component)
    }

    random(max: number) {
        return ~~(Math.random()* (max + 1));
    }
}

class User {
    seeTitle(title: string)  {
        console.log(title)
        const element = wrapper
            .findAll("h1,h2,h3,h4,h5,h6")
            .filter((node: any) => node.text().match(title))
            [0]
        expect(element).toBeTruthy();
    }

    see(text: string)  {
        expect(wrapper.text()).toContain(text)
    }

    notSee(text: string)  {
        expect(wrapper.text()).not.toContain(text)
    }

    async enter(label: string, value: string) {
        const labelElement = wrapper
            .findAll("label")
            .filter((node: any) => node.text().match(label))
            [0]
        const id = labelElement.attributes('for')
        const inputElement = wrapper.find('#' + id)
        await inputElement.setValue(value)
    }
    
    async press(text: string)  {
        const buttonElement = wrapper
        .findAll("button,a")
        .filter((node: any) => node.text().match(text))
        [0]
        await buttonElement.trigger('click')
    }
}

export const app = new App();

export const user = new User();