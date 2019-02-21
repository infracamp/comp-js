

class CjScriptElement extends CJHtmlElement {



    constructor() {
        super();
    }

    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout(function () {
            var content = self.innerText;
            self.textContent = "";
            console.log("eval", content);
            eval(content);
            /*
            var script = document.createElement("script");
            script.textContent = content;
            self.appendChild(script);
            */

        }, 1);
    }


}

customElements.define("cj-script", CjScriptElement);