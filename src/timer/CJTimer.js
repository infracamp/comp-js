class CJTimerElement extends CJHtmlElement {



    constructor() {
        super();
        this._interval = null;
        this._intervalObj = null;
        this.targetNode = null;
        this._timeout = 1;
    }

    static get observedAttributes() { return ["interval", "timeout", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "interval":
                this._interval = newValue;

                break;
            case "timeout":
                this._timeout = newValue;
                break;
        }
    }


    clearInterval() {
        if (this._intervalObj !== null) {
            window.clearInterval(this._intervalObj)
        }
    }

    connectedCallback() {
        var self = this;

        console.log("Timer connected");
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout( function () {
            self.targetNode = document.createElement("div");
            self.appendChild(self.targetNode);
            var template = $("template", self)[0].content;
            if (self._interval !== null) {
                self._intervalObj = window.setInterval(function() {
                    var myNode = self.targetNode;
                    while (myNode.firstChild) {
                        myNode.removeChild(myNode.firstChild);
                    }
                    console.log("append", template);
                    myNode.appendChild(template.cloneNode(true));
                }, self._interval);
            }
        }, self._timeout);
    }

    disconnectedCallback() {
        this.clearInterval();
    }

}



customElements.define("cj-timer", CJTimerElement);
