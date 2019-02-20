

class CompPane extends HTMLElement {

    constructor() {
        super();
        this.ajaxSrc = null;
    }


    reload() {
        var renderer = new Renderer();
        renderer.renderInto(this, {}, $(this).find("template")[0]);
    }


    static get observedAttributes() { return ["ajax-src"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "ajax-src":
                this.ajaxSrc = newValue;
                break;
        }
    }

    connectedCallback() {
        var renderer = new Renderer();
        renderer.renderInto(this, {blah: "muh"}, $(this).find("template")[0]);
    }


}



customElements.define("comp-pane", CompPane);
