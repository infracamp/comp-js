

class CJTplElement extends HTMLElement {

    constructor() {
        super();
        this.ajaxSrc = null;
        this.templateNode = null;
        this.targetNode = null;
        this._data = null;
    }


    reload() {
        var renderer = new CJRenderer();
        this.targetNode.innerHTML = "";
        renderer.renderInto(this.targetNode, {}, this.templateNode);
    }


    static get observedAttributes() { return ["ajax-src"]; }


    attributeChangedCallback(name, oldValue, newValue) {
        console.log(this);
        switch (name) {
            case "ajax-src":
                this.ajaxSrc = newValue;
                break;
        }
    }





    setData(data) {
        this._data = data;
        var renderer = new CJRenderer();
        this.targetNode.innerHTML = "";
        renderer.renderInto(this.targetNode, this._data, this.templateNode);
    }



    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout( function () {
            console.log("ready");

            self.templateNode = self.firstElementChild;
            self.targetNode = document.createElement("div");
            self.appendChild(self.targetNode);

            //self.setData({});

            console.log("connect", self.templateNode);
            //this.templateNode = this.content.childNodes[0].cloneNode(true);



        }, 1);

    }

}


customElements.define("cj-tpl", CJTplElement);
