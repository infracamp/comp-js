
class CJOptionsElement extends CJHtmlElement {
    constructor() {
        super();
        this._options = [];
        this._selectElementId = [];

    }



    static get observedAttributes() { return ["for", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "for":
                this._selectElementId = newValue;
                break;

        }
    }


    refresh() {
        this.innerHTML = "";
        this._options.forEach(i, elem => {
            this._log("add", i, elem);
            if (typeof elem === "object") {
                var val = elem.value;
                var text = elem.text;
            } else if (typeof elem === "string") {
                var val, text = elem;
            }

            var option = document.createElement("option");
            option.setAttribute("value", val);
            option.textContent = text;
            this.appendChild(option);
        })
    }

    connectedCallback() {
        this._log("cj-objection connected()");
        var self = this;
        setTimeout(function() {
            console.log("muh");
            if (self.textContent.trim() !== "") {

                self._options = JSON.parse(self.textContent);
                self._log("Loading options preset from json:", self._options)
            }
            self.textContent = "";
            self.refresh();
        }, 1);
    }
}


customElements.define("cj-options", CJOptionsElement);