

class CjExecElement extends CJHtmlElement {



    constructor() {
        super();
    }



    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout(function () {
                    var codeNode = self.previousElementSibling;
                    if (codeNode.tagName !== "PRE") {
                        self._log("Cannot find sibling <pre> node");
                    }

                    codeNode = codeNode.querySelector("code");


                    self._log("textContent=", codeNode.textContent);


                    self.innerHTML = codeNode.textContent;


                    setTimeout(function() {
                        $("script", self).each(function(idx, node) {
                            eval(node.textContent);
                        })
                    },1);


                }, 1);
    }


}

customElements.define("cj-exec", CjExecElement);