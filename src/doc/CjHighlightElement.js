

class CjHighlightElement extends CJHtmlElement {



    constructor() {
        super();
    }

    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout(function () {
                    var content = self.innerHTML;
                    var div = document.createElement("div");

                    self.appendChild(div);

                    var pre = document.createElement("pre");
                    div.appendChild(pre);

                    var code = document.createElement("code");
                    pre.appendChild(code);
                    code.classList.add("html");
                    code.style.whiteSpace = "pre";
                    code.innerText = content.trim();

                }, 1);
    }


}

customElements.define("cj-highlight", CjHighlightElement);