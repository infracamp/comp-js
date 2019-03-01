

class CjHighlightElement extends CJHtmlElement {



    constructor() {
        super();
        this._value = "";
        this._codeElement = null;
        this.lang = "html"
    }

    static get observedAttributes() { return ["lang", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "lang":
                this.lang = newValue;
                break;

        }
    }

    /**
     * Set the text to highlight
     *
     * @public
     * @param {string} code     the code to hightlight
     * @param {string} codeType The highlighter to use (html|text|js)
     */
    setCode(code, codeType) {
        if (codeType === undefined)
            codeType = this.lang;

        this._value = code;
        if (this._codeElement !== null) {
            this._codeElement.innerText = code;
            this._codeElement.classList.add(codeType);
            document.dispatchEvent(new Event("load"));
        }
    }


    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout(function () {
                    var content = self.innerHTML;
                    self._log("content to highlight", content);
                    var div = document.createElement("div");

                    self.appendChild(div);

                    var pre = document.createElement("pre");
                    div.appendChild(pre);

                    var code = document.createElement("code");
                    pre.appendChild(code);

                    self._codeElement = code;

                    code.classList.add(self.lang);
                    code.style.whiteSpace = "pre";

                    if (content.trim() !== "") {
                        code.innerText = content;
                        document.dispatchEvent(new Event("load"));
                    }


                }, 1);
    }


}

customElements.define("cj-highlight", CjHighlightElement);