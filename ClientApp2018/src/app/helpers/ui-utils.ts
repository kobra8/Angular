export class UiUtils {


    private constructor() { }

    static scrollTo(element: Element) {
        window.scroll({
            behavior: 'smooth',
            left: 0,
            top: element.getBoundingClientRect().top + window.scrollY
        });
    }


    static scrollToLabel(label: string) {

        const element = document.querySelector(`[data-label="${label}"]`);

        UiUtils.scrollTo(element);
    }

    static getWindowHeight() {
        return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    }
}
