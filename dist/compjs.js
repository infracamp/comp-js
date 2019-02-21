

class c {


    /**
     * HTTP Client for Ajax Requests
     *
     * @static
     * @param url
     * @return {CJ_Req}
     */
    static req (url) {
        return new CJ_Req(url);
    }

}

class ce {


    static _getElementById(id, type) {
        var elem = $("#" + id)[0];
        if (elem === null)
            throw "Element #" + id + " not found";
        if (type !== undefined)
            if ( ! elem instanceof type)
                throw "Element #" + id + " not of type " + type;
        return elem;
    }


    /**
     *
     * @static
     * @param id
     * @returns {CJFormElement}
     */
    static form(id) {
        return ce._getElementById(id, CJFormElement);
    }

    /**
     *
     * @static
     * @param id
     * @return {CJPaneElement}
     */
    static pane(id) {
        return ce._getElementById(id, CJPaneElement);
    }

    /**
     *
     * @param id
     * @return {HTMLElement}
     */
    static any(id) {
        return ce._getElementById(id);
    }
}


class CJ_Req {

    constructor(url) {
        this.request = {
            url: url,
            method: "GET",
            body: null,
            success: false,
            dataType: "text"
        }
    }


    /**
     *
     * @param body
     * @return {CJ_Req}
     */
    withBody(body) {
        if (this.request.method === "GET")
            this.request.method = "POST";
        if (Array.isArray(body) || typeof body === "object")
            body = JSON.stringify(body);
        this.request.body = body;
        return this;
    }

    set json(fn) {
        this._make_request(fn, "json")
    }

    set plain(fn) {
        this._make_request(fn, null)
    }

    set stream(fn) {
        this._make_request(fn, "stream");
    }

    /**
     *
     * @param fn
     * @param filter
     * @private
     */
    _make_request(fn, filter) {
        this.request.success = function (data) {
            console.log(data);
            if (filter === "json")
                data = JSON.parse(data);
            fn(data);
        };
        $.ajax(this.request);
    }

}

class CJHtmlElement extends HTMLElement {

}
class CompCore {
    constructor() {
        this.ajaxOptions = {
            dataType: "json",
            error: function (err) {
                alert ("Error executing form request.");
                throw "Error"
            }
        };
        this.ajaxOptionsHtml = {
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

    evalAttr(attrValue, event, ownerObj) {
        console.log("eval", attrValue);
        if (attrValue === null)
            return null;
        if (typeof attrValue === "string") {
            var context = function(e) {
                console.log(this);
                return eval(attrValue)
            };
            console.log("owner", ownerObj);
            var ret = context.bind(ownerObj)(event);
            if (typeof ret !== "function")
                return ret;
            return ret.bind(ownerObj)(event)
        }
        if (typeof attrValue === "function")
            return attrValue(event, ownerObj);

        console.error("eval error:", attrValue)
        throw "Cannot evaluate expression - see output"
    }
}





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

class CJFormElement extends CJHtmlElement {
    constructor() {
        super();
        this._submittableElement = null;
        this._formElements = null;
        this.cf_onsubmit = null;
        self = this;
    }



    static get observedAttributes() { return ["onsubmit"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log ("attr", newValue);
        switch (name) {
            case "onsubmit":
                this.cf_onsubmit = newValue;
                break;
            default:
                throw "undefined attribute for comp-form: name";
        }
    }


    /**
     * Read the currently values from the form and return
     * object based on the forms names
     *
     * @return object
     */
    getData() {
        return this._gather_form_data()
    }

    /**
     * Set the form data from external and rerender the input values
     *
     * @public
     * @param data
     */
    setData(data) {
        this._fill_data(data);
    }


    /**
     * Private
     *
     * @param form
     * @param dataObj
     * @private
     */
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


    /**
     *
     * @param elem
     * @param dataObj
     * @private
     */
    _fill_form_single(elem, dataObj) {
        $(elem).val(dataObj[elem.name]);
    }

    /**
     *
     * @param dataObj
     * @private
     */
    _fill_data (dataObj) {
        this._formElements.each((i, e) => this._fill_form_single(e, dataObj));
    }


    _submit(e) {
        console.log("_submit", this.cf_onsubmit);
        CompCore.instance.evalAttr(this.cf_onsubmit, e, this);

    }


    connectedCallback() {
        var self = this;
        setTimeout(function() {
            // Register event handler
            self._submittableElement = self.querySelector("form");
            if (self._submittableElement === null) {
                self._submittableElement = self.querySelector("button[type='submit']");
                self._submittableElement.onclick = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    self._submit(e);
                }
            } else {
                self._submittableElement.onsubmit = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    self._submit(e)
                }
            }

        }, 1);
    }

}


customElements.define("cj-form", CJFormElement);

class CJPaneElement extends CJHtmlElement {



    constructor() {
        super();
        this._src = null;
        this.targetNode = null;
        this._shadowDom = false;
    }


    static get observedAttributes() { return ["src", "shadow-dom"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(this);
        switch (name) {
            case "src":
                this._src = newValue;
                if (this._src != null)
                    this._loadUrl(this._src);
                break;
            case "shadow-dom":
                this._shadowDom = true;
                break;
        }
    }

    _loadUrl(url) {
        console.log("load", url);
        var self = this;
        setTimeout(function() {
            jQuery.ajax(url, CompCore.instance.ajaxOptionsHtml)
                .done(function(data) {
                    self.targetNode.innerHTML = data
                });
        }, 1);


    }



    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout( function () {
            if ( ! self._shadowDom) {
                self.targetNode = document.createElement("div");
                self.appendChild(self.targetNode);
            } else {
                self.targetNode = self.attachShadow({mode: 'open'});
            }

        }, 1);
    }


}



customElements.define("cj-pane", CJPaneElement);



class CJRenderer {

    constructor() {
        CJRenderer.renderer = this;
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


class CJTplElement extends HTMLElement {

    constructor() {
        super();
        this.ajaxSrc = null;
        this.templateNode = null;
        this.targetNode = null;
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



    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout( function () {
            console.log("ready");
            var renderer = new CJRenderer();
            self.templateNode = self.firstElementChild;

            self.targetNode = document.createElement("div");
            self.appendChild(self.targetNode);

            console.log("connect", self.templateNode);
            //this.templateNode = this.content.childNodes[0].cloneNode(true);

            renderer.renderInto(self.targetNode, {blah: "muh"}, self.templateNode);

        }, 1);

    }

}


customElements.define("cj-tpl", CJTplElement);


class CJAjaxFormElement extends CJFormElement {
    constructor() {
        super();
        this.ajaxAction = null;
        this.preload = false;
        this.onsuccess = null;
    }



    static get observedAttributes() {
        var attr = CJFormElement.observedAttributes;
        return attr;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
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


customElements.define("cj-ajax-form", CJAjaxFormElement);


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakhpZ2hsaWdodEVsZW1lbnQuanMiLCJmb3JtL0NKRm9ybUVsZW1lbnQuanMiLCJwYW5lL0NKUGFuZUVsZW1lbnQuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ4ZWxlbS9DSkFqYXhGb3JtRWxlbWVudC5qcyIsInhlbGVtL0NKU2NyaXB0RWxlbWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb21wanMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuY2xhc3MgYyB7XG5cblxuICAgIC8qKlxuICAgICAqIEhUVFAgQ2xpZW50IGZvciBBamF4IFJlcXVlc3RzXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHVybFxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxICh1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDSl9SZXEodXJsKTtcbiAgICB9XG5cbn0iLCJcbmNsYXNzIGNlIHtcblxuXG4gICAgc3RhdGljIF9nZXRFbGVtZW50QnlJZChpZCwgdHlwZSkge1xuICAgICAgICB2YXIgZWxlbSA9ICQoXCIjXCIgKyBpZClbMF07XG4gICAgICAgIGlmIChlbGVtID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IGZvdW5kXCI7XG4gICAgICAgIGlmICh0eXBlICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBpZiAoICEgZWxlbSBpbnN0YW5jZW9mIHR5cGUpXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IG9mIHR5cGUgXCIgKyB0eXBlO1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm5zIHtDSkZvcm1FbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBmb3JtKGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENKRm9ybUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0NKUGFuZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHBhbmUoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pQYW5lRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgYW55KGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIH1cbn0iLCJcblxuY2xhc3MgQ0pfUmVxIHtcblxuICAgIGNvbnN0cnVjdG9yKHVybCkge1xuICAgICAgICB0aGlzLnJlcXVlc3QgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIGJvZHk6IG51bGwsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIlxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBib2R5XG4gICAgICogQHJldHVybiB7Q0pfUmVxfVxuICAgICAqL1xuICAgIHdpdGhCb2R5KGJvZHkpIHtcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5tZXRob2QgPT09IFwiR0VUXCIpXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QubWV0aG9kID0gXCJQT1NUXCI7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGJvZHkpIHx8IHR5cGVvZiBib2R5ID09PSBcIm9iamVjdFwiKVxuICAgICAgICAgICAgYm9keSA9IEpTT04uc3RyaW5naWZ5KGJvZHkpO1xuICAgICAgICB0aGlzLnJlcXVlc3QuYm9keSA9IGJvZHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldCBqc29uKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgXCJqc29uXCIpXG4gICAgfVxuXG4gICAgc2V0IHBsYWluKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgbnVsbClcbiAgICB9XG5cbiAgICBzZXQgc3RyZWFtKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgXCJzdHJlYW1cIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm5cbiAgICAgKiBAcGFyYW0gZmlsdGVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZV9yZXF1ZXN0KGZuLCBmaWx0ZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICBpZiAoZmlsdGVyID09PSBcImpzb25cIilcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGZuKGRhdGEpO1xuICAgICAgICB9O1xuICAgICAgICAkLmFqYXgodGhpcy5yZXF1ZXN0KTtcbiAgICB9XG5cbn0iLCJcbmNsYXNzIENKSHRtbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbn0iLCJjbGFzcyBDb21wQ29yZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYWpheE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zSHRtbCA9IHtcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgaW5zdGFuY2UgKCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBDb3JlKCk7XG4gICAgfVxuXG5cbiAgICBhamF4KHVybCkge1xuXG4gICAgfVxuXG4gICAgZXZhbEF0dHIoYXR0clZhbHVlLCBldmVudCwgb3duZXJPYmopIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGF0dHJWYWx1ZSk7XG4gICAgICAgIGlmIChhdHRyVmFsdWUgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBldmFsKGF0dHJWYWx1ZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIm93bmVyXCIsIG93bmVyT2JqKTtcbiAgICAgICAgICAgIHZhciByZXQgPSBjb250ZXh0LmJpbmQob3duZXJPYmopKGV2ZW50KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmV0ICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIHJldHVybiByZXQuYmluZChvd25lck9iaikoZXZlbnQpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiBhdHRyVmFsdWUoZXZlbnQsIG93bmVyT2JqKTtcblxuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXZhbCBlcnJvcjpcIiwgYXR0clZhbHVlKVxuICAgICAgICB0aHJvdyBcIkNhbm5vdCBldmFsdWF0ZSBleHByZXNzaW9uIC0gc2VlIG91dHB1dFwiXG4gICAgfVxufVxuXG5cbiIsIlxuXG5jbGFzcyBDakhpZ2hsaWdodEVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKGRpdik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChwcmUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNvZGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHByZS5hcHBlbmRDaGlsZChjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgY29kZS5jbGFzc0xpc3QuYWRkKFwiaHRtbFwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29kZS5zdHlsZS53aGl0ZVNwYWNlID0gXCJwcmVcIjtcbiAgICAgICAgICAgICAgICAgICAgY29kZS5pbm5lclRleHQgPSBjb250ZW50LnRyaW0oKTtcblxuICAgICAgICAgICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWhpZ2hsaWdodFwiLCBDakhpZ2hsaWdodEVsZW1lbnQpOyIsIlxuY2xhc3MgQ0pGb3JtRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSBudWxsO1xuICAgICAgICB0aGlzLmNmX29uc3VibWl0ID0gbnVsbDtcbiAgICAgICAgc2VsZiA9IHRoaXM7XG4gICAgfVxuXG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wib25zdWJtaXRcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgY29uc29sZS5sb2cgKFwiYXR0clwiLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIm9uc3VibWl0XCI6XG4gICAgICAgICAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBcInVuZGVmaW5lZCBhdHRyaWJ1dGUgZm9yIGNvbXAtZm9ybTogbmFtZVwiO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBSZWFkIHRoZSBjdXJyZW50bHkgdmFsdWVzIGZyb20gdGhlIGZvcm0gYW5kIHJldHVyblxuICAgICAqIG9iamVjdCBiYXNlZCBvbiB0aGUgZm9ybXMgbmFtZXNcbiAgICAgKlxuICAgICAqIEByZXR1cm4gb2JqZWN0XG4gICAgICovXG4gICAgZ2V0RGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgZm9ybSBkYXRhIGZyb20gZXh0ZXJuYWwgYW5kIHJlcmVuZGVyIHRoZSBpbnB1dCB2YWx1ZXNcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIHNldERhdGEoZGF0YSkge1xuICAgICAgICB0aGlzLl9maWxsX2RhdGEoZGF0YSk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhT2JqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2F0aGVyX2Zvcm1fZGF0YSAoZm9ybSwgZGF0YU9iaikge1xuICAgICAgICBjb25zb2xlLmxvZyhmb3JtKTtcbiAgICAgICAgc3dpdGNoIChmb3JtLnRhZ05hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJJTlBVVFwiOlxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZm9ybS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjaGVja2JveFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY2hlY2tib3hcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybS5jaGVja2VkID09IHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gZm9ybS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiU0VMRUNUXCI6XG4gICAgICAgICAgICBjYXNlIFwiVEVYVEFSRUFcIjpcbiAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSAkKGZvcm0pLnZhbCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbGVtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWxsX2Zvcm1fc2luZ2xlKGVsZW0sIGRhdGFPYmopIHtcbiAgICAgICAgJChlbGVtKS52YWwoZGF0YU9ialtlbGVtLm5hbWVdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBkYXRhT2JqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZmlsbF9kYXRhIChkYXRhT2JqKSB7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9maWxsX2Zvcm1fc2luZ2xlKGUsIGRhdGFPYmopKTtcbiAgICB9XG5cblxuICAgIF9zdWJtaXQoZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIl9zdWJtaXRcIiwgdGhpcy5jZl9vbnN1Ym1pdCk7XG4gICAgICAgIENvbXBDb3JlLmluc3RhbmNlLmV2YWxBdHRyKHRoaXMuY2Zfb25zdWJtaXQsIGUsIHRoaXMpO1xuXG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gUmVnaXN0ZXIgZXZlbnQgaGFuZGxlclxuICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID0gc2VsZi5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKTtcbiAgICAgICAgICAgIGlmIChzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJidXR0b25bdHlwZT0nc3VibWl0J11cIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudC5vbnN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXQoZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otZm9ybVwiLCBDSkZvcm1FbGVtZW50KTsiLCJcclxuY2xhc3MgQ0pQYW5lRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLl9zcmMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fc2hhZG93RG9tID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wic3JjXCIsIFwic2hhZG93LWRvbVwiXTsgfVxyXG5cclxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcclxuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSBcInNyY1wiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3JjID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3JjICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9hZFVybCh0aGlzLl9zcmMpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzaGFkb3ctZG9tXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9sb2FkVXJsKHVybCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwibG9hZFwiLCB1cmwpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBqUXVlcnkuYWpheCh1cmwsIENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zSHRtbClcclxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUuaW5uZXJIVE1MID0gZGF0YVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgMSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXHJcbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoICEgc2VsZi5fc2hhZG93RG9tKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzZWxmLnRhcmdldE5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gc2VsZi5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5cclxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otcGFuZVwiLCBDSlBhbmVFbGVtZW50KTtcclxuIiwiXG5cbmNsYXNzIENKUmVuZGVyZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIENKUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgJHtyZWdbMl19ID0gJHtyZWdbMV19W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAvL2N1ckNsb25lLnRleHRDb250ZW50ID0gdHBsTm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVySW50byhjdXJDbG9uZSwgc2NvcGUsIHRwbE5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9YDtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGdlbkNvZGUpO1xuICAgICAgICByZXR1cm4gZXZhbChnZW5Db2RlKTtcbiAgICB9XG5cbiAgICBldmFsVGV4dChzY29wZSwgdGV4dCkge1xuICAgICAgICAvL2xldCB0ZXh0V3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xce1xceyguKj8pXFx9XFx9L2csIGZ1bmN0aW9uKG1hdGNoLCBwMSkge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcbiAgICAgICAgICAgIGV2YWwoYF9fcmV0ID0gJHtwMX07YCk7XG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICByZWdpc3RlckNhbGxiYWNrcyh0YXJnZXROb2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgZXZlbnRBdHRyID0gdGFyZ2V0Tm9kZS5nZXRBdHRyaWJ1dGUoXCIoY2xpY2spXCIpO1xuICAgICAgICBpZiAoZXZlbnRBdHRyICE9PSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgY29kZSA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIGV2ZW50QXR0cik7XG4gICAgICAgICAgICB0YXJnZXROb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBlID0+IHtcbiAgICAgICAgICAgICAgICBldmFsKGNvZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHRhcmdldE5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHBhcmFtIGN1clRlbXBsYXRlTm9kZSB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgcmVuZGVySW50byh0YXJnZXROb2RlLCBzY29wZSwgdHBsTm9kZSkge1xuICAgICAgICBpZih0eXBlb2YgdHBsTm9kZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdHBsTm9kZSA9IHRoaXMudGVtcGxhdGVEb207XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Tm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXROb2RlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgfVxuICAgICAgICAqL1xuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgbGV0IHRleHROb2RlID0gdHBsTm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB0ZXh0Tm9kZS50ZXh0Q29udGVudCA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIHRleHROb2RlLnRleHRDb250ZW50KTtcblxuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyh0cGxOb2RlKTtcblxuXG5cblxuICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKTtcblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImlmJFwiKSkge1xuICAgICAgICAgICAgaWYodGhpcy5ib29sRXZhbChzY29wZSwgdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJpZiRcIikpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSlRwbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgIH1cblxuXG4gICAgcmVsb2FkKCkge1xuICAgICAgICB2YXIgcmVuZGVyZXIgPSBuZXcgQ0pSZW5kZXJlcigpO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgcmVuZGVyZXIucmVuZGVySW50byh0aGlzLnRhcmdldE5vZGUsIHt9LCB0aGlzLnRlbXBsYXRlTm9kZSk7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFqYXgtc3JjXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJyZWFkeVwiKTtcbiAgICAgICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgICAgICBzZWxmLnRlbXBsYXRlTm9kZSA9IHNlbGYuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY29ubmVjdFwiLCBzZWxmLnRlbXBsYXRlTm9kZSk7XG4gICAgICAgICAgICAvL3RoaXMudGVtcGxhdGVOb2RlID0gdGhpcy5jb250ZW50LmNoaWxkTm9kZXNbMF0uY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHNlbGYudGFyZ2V0Tm9kZSwge2JsYWg6IFwibXVoXCJ9LCBzZWxmLnRlbXBsYXRlTm9kZSk7XG5cbiAgICAgICAgfSwgMSk7XG5cbiAgICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai10cGxcIiwgQ0pUcGxFbGVtZW50KTtcbiIsIlxuY2xhc3MgQ0pBamF4Rm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkZvcm1FbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25zdWNjZXNzID0gbnVsbDtcbiAgICB9XG5cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHZhciBhdHRyID0gQ0pGb3JtRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXM7XG4gICAgICAgIHJldHVybiBhdHRyO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtYWN0aW9uXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwicHJlbG9hZFwiOlxuICAgICAgICAgICAgICAgIHRoaXMucHJlbG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwib25zdWNjZXNzXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBfb25fc3VibWl0X2NsaWNrKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24uYWRkQ2xhc3MoXCJsb2FkaW5nXCIpO1xuXG4gICAgICAgIGxldCBmb3JtRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveFwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoZSwgZm9ybURhdGEpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgbGV0IGFqYXhPcHRpb25zID0gQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnM7XG4gICAgICAgIGFqYXhPcHRpb25zW1wibWV0aG9kXCJdID0gXCJwb3N0XCI7XG4gICAgICAgIGFqYXhPcHRpb25zW1widXJsXCJdID0gdGhpcy5hamF4QWN0aW9uO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFcIl0gPSBKU09OLnN0cmluZ2lmeShmb3JtRGF0YSk7XG4gICAgICAgIGFqYXhPcHRpb25zW1wiY29udGVudFR5cGVcIl0gPSBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJkYXRhVHlwZVwiXSA9IFwianNvblwiO1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgalF1ZXJ5LmFqYXgoYWpheE9wdGlvbnMpLmRvbmUoXG4gICAgICAgICAgICBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fc3VibWl0QnV0dG9uLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0QnV0dG9uLnJlbW92ZUNsYXNzKFwibG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24uYWRkQ2xhc3MoXCJzYXZlZFwiKTtcbiAgICAgICAgICAgICAgICAvL3NlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uc3VjY2VzcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgciA9IGV2YWwoc2VsZi5vbnN1Y2Nlc3MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHIodGhpcywgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uID0gJChcImJ1dHRvblt0eXBlPSdzdWJtaXQnXSwgaW5wdXRbdHlwZT0nc3VibWl0J11cIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5jbGljayhlID0+IHRoaXMuX29uX3N1Ym1pdF9jbGljayhlKSk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLnByZWxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBqUXVlcnkuYWpheCh0aGlzLmFqYXhBY3Rpb24sIENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zKVxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZmlsbF9kYXRhKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1hamF4LWZvcm1cIiwgQ0pBamF4Rm9ybUVsZW1lbnQpOyIsIlxuXG5jbGFzcyBDalNjcmlwdEVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBzZWxmLmlubmVyVGV4dDtcbiAgICAgICAgICAgIHNlbGYudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGNvbnRlbnQpO1xuICAgICAgICAgICAgZXZhbChjb250ZW50KTtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgICAgIHNjcmlwdC50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICAqL1xuXG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLXNjcmlwdFwiLCBDalNjcmlwdEVsZW1lbnQpOyJdfQ==
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakhpZ2hsaWdodEVsZW1lbnQuanMiLCJmb3JtL0NKRm9ybUVsZW1lbnQuanMiLCJwYW5lL0NKUGFuZUVsZW1lbnQuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ4ZWxlbS9DSkFqYXhGb3JtRWxlbWVudC5qcyIsInhlbGVtL0NKU2NyaXB0RWxlbWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb21wanMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuY2xhc3MgYyB7XG5cblxuICAgIC8qKlxuICAgICAqIEhUVFAgQ2xpZW50IGZvciBBamF4IFJlcXVlc3RzXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHVybFxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxICh1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDSl9SZXEodXJsKTtcbiAgICB9XG5cbn0iLCJcbmNsYXNzIGNlIHtcblxuXG4gICAgc3RhdGljIF9nZXRFbGVtZW50QnlJZChpZCwgdHlwZSkge1xuICAgICAgICB2YXIgZWxlbSA9ICQoXCIjXCIgKyBpZClbMF07XG4gICAgICAgIGlmIChlbGVtID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IGZvdW5kXCI7XG4gICAgICAgIGlmICh0eXBlICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBpZiAoICEgZWxlbSBpbnN0YW5jZW9mIHR5cGUpXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IG9mIHR5cGUgXCIgKyB0eXBlO1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm5zIHtDSkZvcm1FbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBmb3JtKGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENKRm9ybUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0NKUGFuZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHBhbmUoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pQYW5lRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgYW55KGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIH1cbn0iLCJcblxuY2xhc3MgQ0pfUmVxIHtcblxuICAgIGNvbnN0cnVjdG9yKHVybCkge1xuICAgICAgICB0aGlzLnJlcXVlc3QgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIGJvZHk6IG51bGwsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIlxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBib2R5XG4gICAgICogQHJldHVybiB7Q0pfUmVxfVxuICAgICAqL1xuICAgIHdpdGhCb2R5KGJvZHkpIHtcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5tZXRob2QgPT09IFwiR0VUXCIpXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QubWV0aG9kID0gXCJQT1NUXCI7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGJvZHkpIHx8IHR5cGVvZiBib2R5ID09PSBcIm9iamVjdFwiKVxuICAgICAgICAgICAgYm9keSA9IEpTT04uc3RyaW5naWZ5KGJvZHkpO1xuICAgICAgICB0aGlzLnJlcXVlc3QuYm9keSA9IGJvZHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldCBqc29uKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgXCJqc29uXCIpXG4gICAgfVxuXG4gICAgc2V0IHBsYWluKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgbnVsbClcbiAgICB9XG5cbiAgICBzZXQgc3RyZWFtKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgXCJzdHJlYW1cIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm5cbiAgICAgKiBAcGFyYW0gZmlsdGVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZV9yZXF1ZXN0KGZuLCBmaWx0ZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICBpZiAoZmlsdGVyID09PSBcImpzb25cIilcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGZuKGRhdGEpO1xuICAgICAgICB9O1xuICAgICAgICAkLmFqYXgodGhpcy5yZXF1ZXN0KTtcbiAgICB9XG5cbn0iLCJcbmNsYXNzIENKSHRtbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbn0iLCJjbGFzcyBDb21wQ29yZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYWpheE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zSHRtbCA9IHtcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgaW5zdGFuY2UgKCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBDb3JlKCk7XG4gICAgfVxuXG5cbiAgICBhamF4KHVybCkge1xuXG4gICAgfVxuXG4gICAgZXZhbEF0dHIoYXR0clZhbHVlLCBldmVudCwgb3duZXJPYmopIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGF0dHJWYWx1ZSk7XG4gICAgICAgIGlmIChhdHRyVmFsdWUgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBldmFsKGF0dHJWYWx1ZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIm93bmVyXCIsIG93bmVyT2JqKTtcbiAgICAgICAgICAgIHZhciByZXQgPSBjb250ZXh0LmJpbmQob3duZXJPYmopKGV2ZW50KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmV0ICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIHJldHVybiByZXQuYmluZChvd25lck9iaikoZXZlbnQpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiBhdHRyVmFsdWUoZXZlbnQsIG93bmVyT2JqKTtcblxuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXZhbCBlcnJvcjpcIiwgYXR0clZhbHVlKVxuICAgICAgICB0aHJvdyBcIkNhbm5vdCBldmFsdWF0ZSBleHByZXNzaW9uIC0gc2VlIG91dHB1dFwiXG4gICAgfVxufVxuXG5cbiIsIlxuXG5jbGFzcyBDakhpZ2hsaWdodEVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKGRpdik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChwcmUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNvZGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHByZS5hcHBlbmRDaGlsZChjb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgY29kZS5jbGFzc0xpc3QuYWRkKFwiaHRtbFwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29kZS5zdHlsZS53aGl0ZVNwYWNlID0gXCJwcmVcIjtcbiAgICAgICAgICAgICAgICAgICAgY29kZS5pbm5lclRleHQgPSBjb250ZW50LnRyaW0oKTtcblxuICAgICAgICAgICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWhpZ2hsaWdodFwiLCBDakhpZ2hsaWdodEVsZW1lbnQpOyIsIlxuY2xhc3MgQ0pGb3JtRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSBudWxsO1xuICAgICAgICB0aGlzLmNmX29uc3VibWl0ID0gbnVsbDtcbiAgICAgICAgc2VsZiA9IHRoaXM7XG4gICAgfVxuXG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wib25zdWJtaXRcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgY29uc29sZS5sb2cgKFwiYXR0clwiLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIm9uc3VibWl0XCI6XG4gICAgICAgICAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBcInVuZGVmaW5lZCBhdHRyaWJ1dGUgZm9yIGNvbXAtZm9ybTogbmFtZVwiO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBSZWFkIHRoZSBjdXJyZW50bHkgdmFsdWVzIGZyb20gdGhlIGZvcm0gYW5kIHJldHVyblxuICAgICAqIG9iamVjdCBiYXNlZCBvbiB0aGUgZm9ybXMgbmFtZXNcbiAgICAgKlxuICAgICAqIEByZXR1cm4gb2JqZWN0XG4gICAgICovXG4gICAgZ2V0RGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgZm9ybSBkYXRhIGZyb20gZXh0ZXJuYWwgYW5kIHJlcmVuZGVyIHRoZSBpbnB1dCB2YWx1ZXNcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIHNldERhdGEoZGF0YSkge1xuICAgICAgICB0aGlzLl9maWxsX2RhdGEoZGF0YSk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhT2JqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2F0aGVyX2Zvcm1fZGF0YSAoZm9ybSwgZGF0YU9iaikge1xuICAgICAgICBjb25zb2xlLmxvZyhmb3JtKTtcbiAgICAgICAgc3dpdGNoIChmb3JtLnRhZ05hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJJTlBVVFwiOlxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZm9ybS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjaGVja2JveFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY2hlY2tib3hcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybS5jaGVja2VkID09IHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gZm9ybS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiU0VMRUNUXCI6XG4gICAgICAgICAgICBjYXNlIFwiVEVYVEFSRUFcIjpcbiAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSAkKGZvcm0pLnZhbCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbGVtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWxsX2Zvcm1fc2luZ2xlKGVsZW0sIGRhdGFPYmopIHtcbiAgICAgICAgJChlbGVtKS52YWwoZGF0YU9ialtlbGVtLm5hbWVdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBkYXRhT2JqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZmlsbF9kYXRhIChkYXRhT2JqKSB7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9maWxsX2Zvcm1fc2luZ2xlKGUsIGRhdGFPYmopKTtcbiAgICB9XG5cblxuICAgIF9zdWJtaXQoZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIl9zdWJtaXRcIiwgdGhpcy5jZl9vbnN1Ym1pdCk7XG4gICAgICAgIENvbXBDb3JlLmluc3RhbmNlLmV2YWxBdHRyKHRoaXMuY2Zfb25zdWJtaXQsIGUsIHRoaXMpO1xuXG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gUmVnaXN0ZXIgZXZlbnQgaGFuZGxlclxuICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID0gc2VsZi5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKTtcbiAgICAgICAgICAgIGlmIChzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJidXR0b25bdHlwZT0nc3VibWl0J11cIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudC5vbnN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXQoZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otZm9ybVwiLCBDSkZvcm1FbGVtZW50KTsiLCJcclxuY2xhc3MgQ0pQYW5lRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLl9zcmMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fc2hhZG93RG9tID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wic3JjXCIsIFwic2hhZG93LWRvbVwiXTsgfVxyXG5cclxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcclxuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSBcInNyY1wiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3JjID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3JjICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9hZFVybCh0aGlzLl9zcmMpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzaGFkb3ctZG9tXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9sb2FkVXJsKHVybCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwibG9hZFwiLCB1cmwpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBqUXVlcnkuYWpheCh1cmwsIENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zSHRtbClcclxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUuaW5uZXJIVE1MID0gZGF0YVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgMSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXHJcbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoICEgc2VsZi5fc2hhZG93RG9tKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzZWxmLnRhcmdldE5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gc2VsZi5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5cclxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otcGFuZVwiLCBDSlBhbmVFbGVtZW50KTtcclxuIiwiXG5cbmNsYXNzIENKUmVuZGVyZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIENKUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgJHtyZWdbMl19ID0gJHtyZWdbMV19W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAvL2N1ckNsb25lLnRleHRDb250ZW50ID0gdHBsTm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVySW50byhjdXJDbG9uZSwgc2NvcGUsIHRwbE5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9YDtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGdlbkNvZGUpO1xuICAgICAgICByZXR1cm4gZXZhbChnZW5Db2RlKTtcbiAgICB9XG5cbiAgICBldmFsVGV4dChzY29wZSwgdGV4dCkge1xuICAgICAgICAvL2xldCB0ZXh0V3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xce1xceyguKj8pXFx9XFx9L2csIGZ1bmN0aW9uKG1hdGNoLCBwMSkge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcbiAgICAgICAgICAgIGV2YWwoYF9fcmV0ID0gJHtwMX07YCk7XG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICByZWdpc3RlckNhbGxiYWNrcyh0YXJnZXROb2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgZXZlbnRBdHRyID0gdGFyZ2V0Tm9kZS5nZXRBdHRyaWJ1dGUoXCIoY2xpY2spXCIpO1xuICAgICAgICBpZiAoZXZlbnRBdHRyICE9PSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgY29kZSA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIGV2ZW50QXR0cik7XG4gICAgICAgICAgICB0YXJnZXROb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBlID0+IHtcbiAgICAgICAgICAgICAgICBldmFsKGNvZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHRhcmdldE5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHBhcmFtIGN1clRlbXBsYXRlTm9kZSB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgcmVuZGVySW50byh0YXJnZXROb2RlLCBzY29wZSwgdHBsTm9kZSkge1xuICAgICAgICBpZih0eXBlb2YgdHBsTm9kZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdHBsTm9kZSA9IHRoaXMudGVtcGxhdGVEb207XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Tm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXROb2RlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgfVxuICAgICAgICAqL1xuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgbGV0IHRleHROb2RlID0gdHBsTm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB0ZXh0Tm9kZS50ZXh0Q29udGVudCA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIHRleHROb2RlLnRleHRDb250ZW50KTtcblxuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyh0cGxOb2RlKTtcblxuXG5cblxuICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKTtcblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImlmJFwiKSkge1xuICAgICAgICAgICAgaWYodGhpcy5ib29sRXZhbChzY29wZSwgdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJpZiRcIikpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSlRwbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgIH1cblxuXG4gICAgcmVsb2FkKCkge1xuICAgICAgICB2YXIgcmVuZGVyZXIgPSBuZXcgQ0pSZW5kZXJlcigpO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgcmVuZGVyZXIucmVuZGVySW50byh0aGlzLnRhcmdldE5vZGUsIHt9LCB0aGlzLnRlbXBsYXRlTm9kZSk7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFqYXgtc3JjXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJyZWFkeVwiKTtcbiAgICAgICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgICAgICBzZWxmLnRlbXBsYXRlTm9kZSA9IHNlbGYuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY29ubmVjdFwiLCBzZWxmLnRlbXBsYXRlTm9kZSk7XG4gICAgICAgICAgICAvL3RoaXMudGVtcGxhdGVOb2RlID0gdGhpcy5jb250ZW50LmNoaWxkTm9kZXNbMF0uY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHNlbGYudGFyZ2V0Tm9kZSwge2JsYWg6IFwibXVoXCJ9LCBzZWxmLnRlbXBsYXRlTm9kZSk7XG5cbiAgICAgICAgfSwgMSk7XG5cbiAgICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai10cGxcIiwgQ0pUcGxFbGVtZW50KTtcbiIsIlxuY2xhc3MgQ0pBamF4Rm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkZvcm1FbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25zdWNjZXNzID0gbnVsbDtcbiAgICB9XG5cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHZhciBhdHRyID0gQ0pGb3JtRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXM7XG4gICAgICAgIHJldHVybiBhdHRyO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtYWN0aW9uXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwicHJlbG9hZFwiOlxuICAgICAgICAgICAgICAgIHRoaXMucHJlbG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwib25zdWNjZXNzXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBfb25fc3VibWl0X2NsaWNrKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24uYWRkQ2xhc3MoXCJsb2FkaW5nXCIpO1xuXG4gICAgICAgIGxldCBmb3JtRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveFwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoZSwgZm9ybURhdGEpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgbGV0IGFqYXhPcHRpb25zID0gQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnM7XG4gICAgICAgIGFqYXhPcHRpb25zW1wibWV0aG9kXCJdID0gXCJwb3N0XCI7XG4gICAgICAgIGFqYXhPcHRpb25zW1widXJsXCJdID0gdGhpcy5hamF4QWN0aW9uO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFcIl0gPSBKU09OLnN0cmluZ2lmeShmb3JtRGF0YSk7XG4gICAgICAgIGFqYXhPcHRpb25zW1wiY29udGVudFR5cGVcIl0gPSBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJkYXRhVHlwZVwiXSA9IFwianNvblwiO1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgalF1ZXJ5LmFqYXgoYWpheE9wdGlvbnMpLmRvbmUoXG4gICAgICAgICAgICBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fc3VibWl0QnV0dG9uLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0QnV0dG9uLnJlbW92ZUNsYXNzKFwibG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24uYWRkQ2xhc3MoXCJzYXZlZFwiKTtcbiAgICAgICAgICAgICAgICAvL3NlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uc3VjY2VzcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgciA9IGV2YWwoc2VsZi5vbnN1Y2Nlc3MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHIodGhpcywgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uID0gJChcImJ1dHRvblt0eXBlPSdzdWJtaXQnXSwgaW5wdXRbdHlwZT0nc3VibWl0J11cIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5jbGljayhlID0+IHRoaXMuX29uX3N1Ym1pdF9jbGljayhlKSk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLnByZWxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBqUXVlcnkuYWpheCh0aGlzLmFqYXhBY3Rpb24sIENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zKVxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZmlsbF9kYXRhKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1hamF4LWZvcm1cIiwgQ0pBamF4Rm9ybUVsZW1lbnQpOyIsIlxuXG5jbGFzcyBDalNjcmlwdEVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBzZWxmLmlubmVyVGV4dDtcbiAgICAgICAgICAgIHNlbGYudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGNvbnRlbnQpO1xuICAgICAgICAgICAgZXZhbChjb250ZW50KTtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgICAgIHNjcmlwdC50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICAqL1xuXG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLXNjcmlwdFwiLCBDalNjcmlwdEVsZW1lbnQpOyJdfQ==