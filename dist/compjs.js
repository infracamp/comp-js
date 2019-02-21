

class Renderer {

    constructor() {
        Renderer.renderer = this;
    }

    boolEval(scope, code) {
        let ret = ((scope, _code) => {
            let __ret = null;

            let gencode = `__ret = ${_code};`;
            eval(gencode);

            return __ret;
        })(scope, code);
        return ret;
    }

    forEval(scope, code, targetNode, tplNode) {
        let reg = /^([a-zA-Z0-9_.\[\]]+)\s+as\s+([a-zA-Z0-9_.\[\]]+)$/.exec(code);
        console.log(reg);
        let genCode = `
                for(let index = 0; index < ${reg[1]}.length; index++){
                    ${reg[2]} = ${reg[1]}[index];
                    let curClone = tplNode.cloneNode(false);
                    //curClone.textContent = tplNode.textContent;
                    targetNode.appendChild(curClone);
                    for(let i = 0; i < tplNode.childNodes.length; i++) {
                        this.renderInto(curClone, scope, tplNode.childNodes[i]);
                    }
                }`;
        console.log("eval", genCode);
        return eval(genCode);
    }

    evalText(scope, text) {
        //let textWrapper = document.createTextNode("");

        return text.replace(/\{\{(.*?)\}\}/g, function(match, p1) {
            let __ret = null;
            eval(`__ret = ${p1};`);
            return __ret;
        })
    }


    registerCallbacks(targetNode, scope) {
        let eventAttr = targetNode.getAttribute("(click)");
        if (eventAttr !== null) {
            let code = this.evalText(scope, eventAttr);
            targetNode.addEventListener("click", e => {
                eval(code);
            });
        }
    }


    /**
     * @param targetNode {HTMLElement}
     * @param data
     * @param curTemplateNode {HTMLElement}
     */
    renderInto(targetNode, scope, tplNode) {
        if(typeof tplNode === "undefined") {
            tplNode = this.templateDom;
        }

        /*
        for(let i = 0; i < targetNode.children.length; i++) {
            targetNode.removeChild(targetNode.children[i]);
        }
        */

        if (tplNode instanceof HTMLTemplateElement) {
            for(let i = 0; i < tplNode.content.childNodes.length; i++) {
                this.renderInto(targetNode, scope, tplNode.content.childNodes[i]);
            }
            return
        }

        if (tplNode instanceof Text) {
            let textNode = tplNode.cloneNode(true);
            textNode.textContent = this.evalText(scope, textNode.textContent);

            targetNode.appendChild(textNode);
            return;
        }

        console.log(tplNode);




        this.registerCallbacks(targetNode, scope);

        if(tplNode.hasAttribute("if$")) {
            if(this.boolEval(scope, tplNode.getAttribute("if$")) === false) {
                return false;
            }
        }

        if(tplNode.hasAttribute("for$")) {
            // Append foreach elements
            let forCode = tplNode.getAttribute("for$");
            this.forEval(scope, forCode, targetNode, tplNode);
            return false;
        } else {
            // Append child elements
            let curClone = tplNode.cloneNode(false);
            targetNode.appendChild(curClone);

            for(let i = 0; i < tplNode.childNodes.length; i++) {
                this.renderInto(curClone, scope, tplNode.childNodes[i]);
            }
        }
    }

    parseNode(node, scope) {
        let tplNode = node.cloneNode(true);
        for(let i = 0; i < node.childNodes.length; i++) {
            node.removeChild(node.childNodes[i]);
        }
        let target = document.createElement(node.tagName);
        this.renderInto(target, scope, tplNode);
        node.replaceWith(target);
    }
}
class CompCore {
    constructor() {
        this.ajaxOptions = {
            dataType: "json",
            error: function (err) {
                alert ("Error executing form request.");
                throw "Error"
            }
        }
    }

    static get instance () {
        return new CompCore();
    }


    ajax(url) {

    }
}





function fhtml(input) {
    return input;
}



class CompFhtml extends HTMLScriptElement {
    constructor() {
        super();
    }


    connectedCallback() {
        console.log(this.innerText);
    }
}




customElements.define("comp-fhtml", CompFhtml, {extends: 'script'});


class CompForm extends HTMLElement {
    constructor() {
        super();
        this.ajaxAction = null;
        this.preload = false;
        this.onsuccess = null;
        this._submitButton = null;
        this._formElements = null;
        self = this;
    }



    static get observedAttributes() { return ["ajax-action", "preload", "onsuccess"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "ajax-action":
                this.ajaxAction = newValue;
                break;
            case "preload":
                this.preload = true;
                break;
            case "onsuccess":
                this.onsuccess = newValue;
                break;
        }


        console.log("attribute change");
    }


    _gather_form_data (form, dataObj) {
        console.log(form);
        switch (form.tagName) {
            case "INPUT":
                switch (form.type) {
                    case "checkbox":
                    case "radio":
                        console.log("checkbox");
                        if (form.checked == true)
                            dataObj[form.name] = form.value;
                        return;
                }
            case "SELECT":
            case "TEXTAREA":
                dataObj[form.name] = $(form).val();
                break;
        }
    }


    _fill_form_single(elem, dataObj) {
        $(elem).val(dataObj[elem.name]);
    }

    _fill_data (dataObj) {
        this._formElements.each((i, e) => this._fill_form_single(e, dataObj));
    }

    _on_submit_click(e) {
        e.preventDefault();
        e.stopPropagation();
        this._submitButton.prop("disabled", true);
        this._submitButton.addClass("loading");

        let formData = {};
        this._formElements = $("input, textarea, checkbox", this);
        this._formElements.each((i, e) => this._gather_form_data(e, formData));
        this._formElements.prop("disabled", true);
        let ajaxOptions = CompCore.instance.ajaxOptions;
        ajaxOptions["method"] = "post";
        ajaxOptions["url"] = this.ajaxAction;
        ajaxOptions["data"] = JSON.stringify(formData);
        ajaxOptions["contentType"] = "application/json; charset=utf-8";
        ajaxOptions["dataType"] = "json";

        var self = this;
        jQuery.ajax(ajaxOptions).done(
            function (data) {
                //self._submitButton.prop("disabled", false);
                self._submitButton.removeClass("loading");
                self._submitButton.addClass("saved");
                //self._formElements.prop("disabled", false);
                if (self.onsuccess !== null) {
                    let r = eval(self.onsuccess);
                    if (typeof r === "function")
                        r(this, data);
                }

            }
        );

    }

    connectedCallback() {
        this._submitButton = $("button[type='submit'], input[type='submit']", this);
        this._submitButton.click(e => this._on_submit_click(e));
        this._formElements = $("input, textarea, checkbox", this);

        if (this.preload) {
            this._formElements.prop("disabled", true);
            let self = this;
            jQuery.ajax(this.ajaxAction, CompCore.instance.ajaxOptions)
                .done(function(data) {
                    self._fill_data(data);
                    self._formElements.prop("disabled", false);
                });
        }
    }

}


customElements.define("comp-form", CompForm);


class CompPane extends HTMLElement {

    constructor() {
        super();
        this.ajaxSrc = null;
        this.templateNode = null;

    }


    reload() {
        var renderer = new Renderer();
        renderer.renderInto(this, {}, this.templateNode);
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



    connectedCallback() {
        var self = this;
        setTimeout( function () {
            console.log("ready");
            var renderer = new Renderer();
            self.templateNode = self.firstElementChild;
            console.log("connect", self.templateNode);
            //this.templateNode = this.content.childNodes[0].cloneNode(true);

            renderer.renderInto(self, {blah: "muh"}, self.templateNode);

        }, 1);



    }


}



customElements.define("comp-pane", CompPane);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlbmRlcmVyLmpzIiwiY29tcC1jb3JlLmpzIiwiY29tcC1maHRtbC5qcyIsImNvbXAtZm9ybS5qcyIsImNvbXAtcGFuZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvbXBqcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5jbGFzcyBSZW5kZXJlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgJHtyZWdbMl19ID0gJHtyZWdbMV19W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAvL2N1ckNsb25lLnRleHRDb250ZW50ID0gdHBsTm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVySW50byhjdXJDbG9uZSwgc2NvcGUsIHRwbE5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9YDtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGdlbkNvZGUpO1xuICAgICAgICByZXR1cm4gZXZhbChnZW5Db2RlKTtcbiAgICB9XG5cbiAgICBldmFsVGV4dChzY29wZSwgdGV4dCkge1xuICAgICAgICAvL2xldCB0ZXh0V3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xce1xceyguKj8pXFx9XFx9L2csIGZ1bmN0aW9uKG1hdGNoLCBwMSkge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcbiAgICAgICAgICAgIGV2YWwoYF9fcmV0ID0gJHtwMX07YCk7XG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICByZWdpc3RlckNhbGxiYWNrcyh0YXJnZXROb2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgZXZlbnRBdHRyID0gdGFyZ2V0Tm9kZS5nZXRBdHRyaWJ1dGUoXCIoY2xpY2spXCIpO1xuICAgICAgICBpZiAoZXZlbnRBdHRyICE9PSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgY29kZSA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIGV2ZW50QXR0cik7XG4gICAgICAgICAgICB0YXJnZXROb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBlID0+IHtcbiAgICAgICAgICAgICAgICBldmFsKGNvZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB0YXJnZXROb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwYXJhbSBjdXJUZW1wbGF0ZU5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUpIHtcbiAgICAgICAgaWYodHlwZW9mIHRwbE5vZGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRwbE5vZGUgPSB0aGlzLnRlbXBsYXRlRG9tO1xuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRhcmdldE5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRhcmdldE5vZGUucmVtb3ZlQ2hpbGQodGFyZ2V0Tm9kZS5jaGlsZHJlbltpXSk7XG4gICAgICAgIH1cbiAgICAgICAgKi9cblxuICAgICAgICBpZiAodHBsTm9kZSBpbnN0YW5jZW9mIEhUTUxUZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVySW50byh0YXJnZXROb2RlLCBzY29wZSwgdHBsTm9kZS5jb250ZW50LmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHBsTm9kZSBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIGxldCB0ZXh0Tm9kZSA9IHRwbE5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgdGV4dE5vZGUudGV4dENvbnRlbnQgPSB0aGlzLmV2YWxUZXh0KHNjb3BlLCB0ZXh0Tm9kZS50ZXh0Q29udGVudCk7XG5cbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQodGV4dE5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2codHBsTm9kZSk7XG5cblxuXG5cbiAgICAgICAgdGhpcy5yZWdpc3RlckNhbGxiYWNrcyh0YXJnZXROb2RlLCBzY29wZSk7XG5cbiAgICAgICAgaWYodHBsTm9kZS5oYXNBdHRyaWJ1dGUoXCJpZiRcIikpIHtcbiAgICAgICAgICAgIGlmKHRoaXMuYm9vbEV2YWwoc2NvcGUsIHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiaWYkXCIpKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsImNsYXNzIENvbXBDb3JlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5hamF4T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IGluc3RhbmNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wQ29yZSgpO1xuICAgIH1cblxuXG4gICAgYWpheCh1cmwpIHtcblxuICAgIH1cbn1cblxuIiwiXG5cblxuZnVuY3Rpb24gZmh0bWwoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQ7XG59XG5cblxuXG5jbGFzcyBDb21wRmh0bWwgZXh0ZW5kcyBIVE1MU2NyaXB0RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5pbm5lclRleHQpO1xuICAgIH1cbn1cblxuXG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY29tcC1maHRtbFwiLCBDb21wRmh0bWwsIHtleHRlbmRzOiAnc2NyaXB0J30pO1xuIiwiXG5jbGFzcyBDb21wRm9ybSBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25zdWNjZXNzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gbnVsbDtcbiAgICAgICAgc2VsZiA9IHRoaXM7XG4gICAgfVxuXG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1hY3Rpb25cIiwgXCJwcmVsb2FkXCIsIFwib25zdWNjZXNzXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtYWN0aW9uXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwicHJlbG9hZFwiOlxuICAgICAgICAgICAgICAgIHRoaXMucHJlbG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwib25zdWNjZXNzXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG5cbiAgICAgICAgY29uc29sZS5sb2coXCJhdHRyaWJ1dGUgY2hhbmdlXCIpO1xuICAgIH1cblxuXG4gICAgX2dhdGhlcl9mb3JtX2RhdGEgKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgY29uc29sZS5sb2coZm9ybSk7XG4gICAgICAgIHN3aXRjaCAoZm9ybS50YWdOYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiSU5QVVRcIjpcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZvcm0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY2hlY2tib3hcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJhZGlvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNoZWNrYm94XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvcm0uY2hlY2tlZCA9PSB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9IGZvcm0udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIlNFTEVDVFwiOlxuICAgICAgICAgICAgY2FzZSBcIlRFWFRBUkVBXCI6XG4gICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gJChmb3JtKS52YWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgX2ZpbGxfZm9ybV9zaW5nbGUoZWxlbSwgZGF0YU9iaikge1xuICAgICAgICAkKGVsZW0pLnZhbChkYXRhT2JqW2VsZW0ubmFtZV0pO1xuICAgIH1cblxuICAgIF9maWxsX2RhdGEgKGRhdGFPYmopIHtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2ZpbGxfZm9ybV9zaW5nbGUoZSwgZGF0YU9iaikpO1xuICAgIH1cblxuICAgIF9vbl9zdWJtaXRfY2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcImxvYWRpbmdcIik7XG5cbiAgICAgICAgbGV0IGZvcm1EYXRhID0ge307XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZ2F0aGVyX2Zvcm1fZGF0YShlLCBmb3JtRGF0YSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICBsZXQgYWpheE9wdGlvbnMgPSBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucztcbiAgICAgICAgYWpheE9wdGlvbnNbXCJtZXRob2RcIl0gPSBcInBvc3RcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJ1cmxcIl0gPSB0aGlzLmFqYXhBY3Rpb247XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVwiXSA9IEpTT04uc3RyaW5naWZ5KGZvcm1EYXRhKTtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJjb250ZW50VHlwZVwiXSA9IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFUeXBlXCJdID0gXCJqc29uXCI7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBqUXVlcnkuYWpheChhamF4T3B0aW9ucykuZG9uZShcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24ucmVtb3ZlQ2xhc3MoXCJsb2FkaW5nXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcInNhdmVkXCIpO1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYub25zdWNjZXNzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByID0gZXZhbChzZWxmLm9uc3VjY2Vzcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcih0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24gPSAkKFwiYnV0dG9uW3R5cGU9J3N1Ym1pdCddLCBpbnB1dFt0eXBlPSdzdWJtaXQnXVwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmNsaWNrKGUgPT4gdGhpcy5fb25fc3VibWl0X2NsaWNrKGUpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHRoaXMuYWpheEFjdGlvbiwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9maWxsX2RhdGEoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY29tcC1mb3JtXCIsIENvbXBGb3JtKTsiLCJcblxuY2xhc3MgQ29tcFBhbmUgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuXG4gICAgfVxuXG5cbiAgICByZWxvYWQoKSB7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlcigpO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMsIHt9LCB0aGlzLnRlbXBsYXRlTm9kZSk7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFqYXgtc3JjXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVhZHlcIik7XG4gICAgICAgICAgICB2YXIgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoKTtcbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY29ubmVjdFwiLCBzZWxmLnRlbXBsYXRlTm9kZSk7XG4gICAgICAgICAgICAvL3RoaXMudGVtcGxhdGVOb2RlID0gdGhpcy5jb250ZW50LmNoaWxkTm9kZXNbMF0uY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHNlbGYsIHtibGFoOiBcIm11aFwifSwgc2VsZi50ZW1wbGF0ZU5vZGUpO1xuXG4gICAgICAgIH0sIDEpO1xuXG5cblxuICAgIH1cblxuXG59XG5cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjb21wLXBhbmVcIiwgQ29tcFBhbmUpO1xuIl19
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJlbmRlcmVyLmpzIiwiY29tcC1jb3JlLmpzIiwiY29tcC1maHRtbC5qcyIsImNvbXAtZm9ybS5qcyIsImNvbXAtcGFuZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvbXBqcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5jbGFzcyBSZW5kZXJlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgJHtyZWdbMl19ID0gJHtyZWdbMV19W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAvL2N1ckNsb25lLnRleHRDb250ZW50ID0gdHBsTm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVySW50byhjdXJDbG9uZSwgc2NvcGUsIHRwbE5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9YDtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGdlbkNvZGUpO1xuICAgICAgICByZXR1cm4gZXZhbChnZW5Db2RlKTtcbiAgICB9XG5cbiAgICBldmFsVGV4dChzY29wZSwgdGV4dCkge1xuICAgICAgICAvL2xldCB0ZXh0V3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xce1xceyguKj8pXFx9XFx9L2csIGZ1bmN0aW9uKG1hdGNoLCBwMSkge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcbiAgICAgICAgICAgIGV2YWwoYF9fcmV0ID0gJHtwMX07YCk7XG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICByZWdpc3RlckNhbGxiYWNrcyh0YXJnZXROb2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgZXZlbnRBdHRyID0gdGFyZ2V0Tm9kZS5nZXRBdHRyaWJ1dGUoXCIoY2xpY2spXCIpO1xuICAgICAgICBpZiAoZXZlbnRBdHRyICE9PSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgY29kZSA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIGV2ZW50QXR0cik7XG4gICAgICAgICAgICB0YXJnZXROb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBlID0+IHtcbiAgICAgICAgICAgICAgICBldmFsKGNvZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB0YXJnZXROb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwYXJhbSBjdXJUZW1wbGF0ZU5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUpIHtcbiAgICAgICAgaWYodHlwZW9mIHRwbE5vZGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRwbE5vZGUgPSB0aGlzLnRlbXBsYXRlRG9tO1xuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRhcmdldE5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRhcmdldE5vZGUucmVtb3ZlQ2hpbGQodGFyZ2V0Tm9kZS5jaGlsZHJlbltpXSk7XG4gICAgICAgIH1cbiAgICAgICAgKi9cblxuICAgICAgICBpZiAodHBsTm9kZSBpbnN0YW5jZW9mIEhUTUxUZW1wbGF0ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVySW50byh0YXJnZXROb2RlLCBzY29wZSwgdHBsTm9kZS5jb250ZW50LmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHBsTm9kZSBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIGxldCB0ZXh0Tm9kZSA9IHRwbE5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgdGV4dE5vZGUudGV4dENvbnRlbnQgPSB0aGlzLmV2YWxUZXh0KHNjb3BlLCB0ZXh0Tm9kZS50ZXh0Q29udGVudCk7XG5cbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQodGV4dE5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2codHBsTm9kZSk7XG5cblxuXG5cbiAgICAgICAgdGhpcy5yZWdpc3RlckNhbGxiYWNrcyh0YXJnZXROb2RlLCBzY29wZSk7XG5cbiAgICAgICAgaWYodHBsTm9kZS5oYXNBdHRyaWJ1dGUoXCJpZiRcIikpIHtcbiAgICAgICAgICAgIGlmKHRoaXMuYm9vbEV2YWwoc2NvcGUsIHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiaWYkXCIpKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsImNsYXNzIENvbXBDb3JlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5hamF4T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IGluc3RhbmNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wQ29yZSgpO1xuICAgIH1cblxuXG4gICAgYWpheCh1cmwpIHtcblxuICAgIH1cbn1cblxuIiwiXG5cblxuZnVuY3Rpb24gZmh0bWwoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQ7XG59XG5cblxuXG5jbGFzcyBDb21wRmh0bWwgZXh0ZW5kcyBIVE1MU2NyaXB0RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5pbm5lclRleHQpO1xuICAgIH1cbn1cblxuXG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY29tcC1maHRtbFwiLCBDb21wRmh0bWwsIHtleHRlbmRzOiAnc2NyaXB0J30pO1xuIiwiXG5jbGFzcyBDb21wRm9ybSBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25zdWNjZXNzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gbnVsbDtcbiAgICAgICAgc2VsZiA9IHRoaXM7XG4gICAgfVxuXG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1hY3Rpb25cIiwgXCJwcmVsb2FkXCIsIFwib25zdWNjZXNzXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtYWN0aW9uXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwicHJlbG9hZFwiOlxuICAgICAgICAgICAgICAgIHRoaXMucHJlbG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwib25zdWNjZXNzXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG5cbiAgICAgICAgY29uc29sZS5sb2coXCJhdHRyaWJ1dGUgY2hhbmdlXCIpO1xuICAgIH1cblxuXG4gICAgX2dhdGhlcl9mb3JtX2RhdGEgKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgY29uc29sZS5sb2coZm9ybSk7XG4gICAgICAgIHN3aXRjaCAoZm9ybS50YWdOYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiSU5QVVRcIjpcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZvcm0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY2hlY2tib3hcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJhZGlvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNoZWNrYm94XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvcm0uY2hlY2tlZCA9PSB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9IGZvcm0udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIlNFTEVDVFwiOlxuICAgICAgICAgICAgY2FzZSBcIlRFWFRBUkVBXCI6XG4gICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gJChmb3JtKS52YWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgX2ZpbGxfZm9ybV9zaW5nbGUoZWxlbSwgZGF0YU9iaikge1xuICAgICAgICAkKGVsZW0pLnZhbChkYXRhT2JqW2VsZW0ubmFtZV0pO1xuICAgIH1cblxuICAgIF9maWxsX2RhdGEgKGRhdGFPYmopIHtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2ZpbGxfZm9ybV9zaW5nbGUoZSwgZGF0YU9iaikpO1xuICAgIH1cblxuICAgIF9vbl9zdWJtaXRfY2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcImxvYWRpbmdcIik7XG5cbiAgICAgICAgbGV0IGZvcm1EYXRhID0ge307XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZ2F0aGVyX2Zvcm1fZGF0YShlLCBmb3JtRGF0YSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICBsZXQgYWpheE9wdGlvbnMgPSBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucztcbiAgICAgICAgYWpheE9wdGlvbnNbXCJtZXRob2RcIl0gPSBcInBvc3RcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJ1cmxcIl0gPSB0aGlzLmFqYXhBY3Rpb247XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVwiXSA9IEpTT04uc3RyaW5naWZ5KGZvcm1EYXRhKTtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJjb250ZW50VHlwZVwiXSA9IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFUeXBlXCJdID0gXCJqc29uXCI7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBqUXVlcnkuYWpheChhamF4T3B0aW9ucykuZG9uZShcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24ucmVtb3ZlQ2xhc3MoXCJsb2FkaW5nXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcInNhdmVkXCIpO1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYub25zdWNjZXNzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByID0gZXZhbChzZWxmLm9uc3VjY2Vzcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcih0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24gPSAkKFwiYnV0dG9uW3R5cGU9J3N1Ym1pdCddLCBpbnB1dFt0eXBlPSdzdWJtaXQnXVwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmNsaWNrKGUgPT4gdGhpcy5fb25fc3VibWl0X2NsaWNrKGUpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHRoaXMuYWpheEFjdGlvbiwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9maWxsX2RhdGEoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY29tcC1mb3JtXCIsIENvbXBGb3JtKTsiLCJcblxuY2xhc3MgQ29tcFBhbmUgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuXG4gICAgfVxuXG5cbiAgICByZWxvYWQoKSB7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBSZW5kZXJlcigpO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMsIHt9LCB0aGlzLnRlbXBsYXRlTm9kZSk7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFqYXgtc3JjXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVhZHlcIik7XG4gICAgICAgICAgICB2YXIgcmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoKTtcbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY29ubmVjdFwiLCBzZWxmLnRlbXBsYXRlTm9kZSk7XG4gICAgICAgICAgICAvL3RoaXMudGVtcGxhdGVOb2RlID0gdGhpcy5jb250ZW50LmNoaWxkTm9kZXNbMF0uY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHNlbGYsIHtibGFoOiBcIm11aFwifSwgc2VsZi50ZW1wbGF0ZU5vZGUpO1xuXG4gICAgICAgIH0sIDEpO1xuXG5cblxuICAgIH1cblxuXG59XG5cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjb21wLXBhbmVcIiwgQ29tcFBhbmUpO1xuIl19
