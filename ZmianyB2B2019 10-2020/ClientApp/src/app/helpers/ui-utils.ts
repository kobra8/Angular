import { ViewContainerRef, Type, ComponentRef, ComponentFactoryResolver } from '@angular/core';

export class UiUtils {


    private constructor() { }

    static scrollTo(element: HTMLUnknownElement) {
        window.scroll({
            behavior: 'smooth',
            left: 0,
            top: element.getBoundingClientRect().top + window.scrollY
        });
    }

    static scrollToTop() {
        window.scroll({
            behavior: 'smooth',
            left: 0,
            top: 0
        });
    }

    static scrollToLabel(label: string) {

        const element = document.querySelector<HTMLUnknownElement>(`[data-label="${label}"]`);

        UiUtils.scrollTo(element);
    }

    static getWindowHeight() {
        return Math.floor(window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0);
    }

    static getCookie(key: string): string | null {

        const start = document.cookie.indexOf(key);

        if (start === -1) {
            return null;
        }

        let end = document.cookie.indexOf(';', start);

        if (end === -1) {
            end = document.cookie.length;
        }

        return document.cookie.substring(start, end).split('=')[1];
    }


    /**
     * Creating Angular component dynamically from given HTML <template> DOM element.
     * Returns ComponentRef, nessesary eg. for destroying the component.
     * Mulit-content not supported, only single ng-content allowed.
     * Outputs not supported, only inputs allowed.
     */
    static createDynamicComponent<T>(domTemplate: HTMLTemplateElement, container: ViewContainerRef, component: Type<T>, componentFactoryResolver: ComponentFactoryResolver): ComponentRef<T> {

        if (!domTemplate || domTemplate.tagName.toLowerCase() !== 'template') {
            return null;
        }

        const factory = componentFactoryResolver.resolveComponentFactory(component);
        const componentNgContent = domTemplate.content.children;
        const index = Array.from(container.element.nativeElement.children).indexOf(domTemplate);
        const componentRef = container.createComponent(factory, 0, null, [Array.from(componentNgContent)]);

        Array.from(domTemplate.attributes).forEach(attr => {

            if (attr.name.match(/\[\w*]/)) {

                const inputDef = factory.inputs.find(inp => inp.templateName.toLowerCase() === attr.name.replace(/\[|\]/g, '').toLowerCase());
                if (inputDef) {
                    componentRef.instance[inputDef.propName] = attr.value;
                }
            }
        });

        container.element.nativeElement.insertBefore(componentRef.location.nativeElement, container.element.nativeElement.children[index]);

        componentRef.changeDetectorRef.detectChanges();

        domTemplate.remove();

        return componentRef;
    }


    /**
     * Destroys Angular component using it's ComponentRef.
     * Useful for dynamically created components.
     */
    static destroyDynamicComponent<T>(component: ComponentRef<T>) {
        component.destroy();
    }



    /**
     * Handles arrow navigation.
     */
    static keyboardArrowNavigation(event: KeyboardEvent & { target: HTMLUnknownElement }, prevEl?: HTMLUnknownElement, nextEl?: HTMLUnknownElement) {

        event.preventDefault();

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {

            if (prevEl) {
                prevEl.focus();
            } else if (event.target.previousElementSibling) {
                (<HTMLUnknownElement>event.target.previousElementSibling).focus();
            }
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {

            if (nextEl) {
                nextEl.focus();
            } else if (event.target.nextElementSibling) {
                (<HTMLUnknownElement>event.target.nextElementSibling).focus();
            }
        }
    }

}
