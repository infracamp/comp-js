

class CompPane extends HTMLElement {

    constructor() {
        super();
        this.ajaxSrc = null;
    }


    reload() {

    }


    static get observedAttributes() { return ["ajax-src"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "ajax-src":
                this.ajaxSrc = newValue;
                break;
        }
    }

}




