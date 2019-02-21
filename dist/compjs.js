

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
                    code.innerText = content;

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


    get data() {
        return this.getData();
    }

    set data(value) {
        this.setData(value);
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
        var ret = {};
        var elements = $("input, textarea, checkbox", this);
        elements.each((i, e) => this._gather_form_data(e, ret));

        return ret;
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
        var elements = $("input, textarea, checkbox", this);
        elements.each((i, e) => this._fill_form_single(e, dataObj));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakhpZ2hsaWdodEVsZW1lbnQuanMiLCJmb3JtL0NKRm9ybUVsZW1lbnQuanMiLCJwYW5lL0NKUGFuZUVsZW1lbnQuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ4ZWxlbS9DSkFqYXhGb3JtRWxlbWVudC5qcyIsInhlbGVtL0NKU2NyaXB0RWxlbWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb21wanMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuY2xhc3MgYyB7XG5cblxuICAgIC8qKlxuICAgICAqIEhUVFAgQ2xpZW50IGZvciBBamF4IFJlcXVlc3RzXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHVybFxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxICh1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDSl9SZXEodXJsKTtcbiAgICB9XG5cblxuXG5cblxufSIsIlxuY2xhc3MgY2Uge1xuXG5cbiAgICBzdGF0aWMgX2dldEVsZW1lbnRCeUlkKGlkLCB0eXBlKSB7XG4gICAgICAgIHZhciBlbGVtID0gJChcIiNcIiArIGlkKVswXTtcbiAgICAgICAgaWYgKGVsZW0gPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBcIkVsZW1lbnQgI1wiICsgaWQgKyBcIiBub3QgZm91bmRcIjtcbiAgICAgICAgaWYgKHR5cGUgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGlmICggISBlbGVtIGluc3RhbmNlb2YgdHlwZSlcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVsZW1lbnQgI1wiICsgaWQgKyBcIiBub3Qgb2YgdHlwZSBcIiArIHR5cGU7XG4gICAgICAgIHJldHVybiBlbGVtO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybnMge0NKRm9ybUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGZvcm0oaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pGb3JtRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybiB7Q0pQYW5lRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFuZShpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDSlBhbmVFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBhbnkoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSl9SZXEge1xuXG4gICAgY29uc3RydWN0b3IodXJsKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgYm9keTogbnVsbCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwidGV4dFwiXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGJvZHlcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgd2l0aEJvZHkoYm9keSkge1xuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0Lm1ldGhvZCA9PT0gXCJHRVRcIilcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5tZXRob2QgPSBcIlBPU1RcIjtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYm9keSkgfHwgdHlwZW9mIGJvZHkgPT09IFwib2JqZWN0XCIpXG4gICAgICAgICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keSk7XG4gICAgICAgIHRoaXMucmVxdWVzdC5ib2R5ID0gYm9keTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0IGpzb24oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBcImpzb25cIilcbiAgICB9XG5cbiAgICBzZXQgcGxhaW4oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBudWxsKVxuICAgIH1cblxuICAgIHNldCBzdHJlYW0oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBcInN0cmVhbVwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmblxuICAgICAqIEBwYXJhbSBmaWx0ZXJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlX3JlcXVlc3QoZm4sIGZpbHRlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3Quc3VjY2VzcyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVyID09PSBcImpzb25cIilcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGZuKGRhdGEpO1xuICAgICAgICB9O1xuICAgICAgICAkLmFqYXgodGhpcy5yZXF1ZXN0KTtcbiAgICB9XG5cbn0iLCJcbmNsYXNzIENKSHRtbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbn0iLCJjbGFzcyBDb21wQ29yZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYWpheE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zSHRtbCA9IHtcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgaW5zdGFuY2UgKCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBDb3JlKCk7XG4gICAgfVxuXG5cbiAgICBldmFsQXR0cihhdHRyVmFsdWUsIGV2ZW50LCBvd25lck9iaikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgYXR0clZhbHVlKTtcbiAgICAgICAgaWYgKGF0dHJWYWx1ZSA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBpZiAodHlwZW9mIGF0dHJWYWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWwoYXR0clZhbHVlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwib3duZXJcIiwgb3duZXJPYmopO1xuICAgICAgICAgICAgdmFyIHJldCA9IGNvbnRleHQuYmluZChvd25lck9iaikoZXZlbnQpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXQgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgcmV0dXJuIHJldC5iaW5kKG93bmVyT2JqKShldmVudClcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGF0dHJWYWx1ZSA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgcmV0dXJuIGF0dHJWYWx1ZShldmVudCwgb3duZXJPYmopO1xuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJldmFsIGVycm9yOlwiLCBhdHRyVmFsdWUpXG4gICAgICAgIHRocm93IFwiQ2Fubm90IGV2YWx1YXRlIGV4cHJlc3Npb24gLSBzZWUgb3V0cHV0XCJcbiAgICB9XG59XG5cblxuIiwiXG5cbmNsYXNzIENqSGlnaGxpZ2h0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gc2VsZi5pbm5lckhUTUw7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoZGl2KTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKHByZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY29kZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlLmFwcGVuZENoaWxkKGNvZGUpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLmNsYXNzTGlzdC5hZGQoXCJodG1sXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLnN0eWxlLndoaXRlU3BhY2UgPSBcInByZVwiO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLmlubmVyVGV4dCA9IGNvbnRlbnQ7XG5cbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1oaWdobGlnaHRcIiwgQ2pIaWdobGlnaHRFbGVtZW50KTsiLCJcbmNsYXNzIENKRm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fc3VibWl0dGFibGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG51bGw7XG4gICAgICAgIHNlbGYgPSB0aGlzO1xuICAgIH1cblxuXG4gICAgZ2V0IGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERhdGEoKTtcbiAgICB9XG5cbiAgICBzZXQgZGF0YSh2YWx1ZSkge1xuICAgICAgICB0aGlzLnNldERhdGEodmFsdWUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJvbnN1Ym1pdFwiXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBjb25zb2xlLmxvZyAoXCJhdHRyXCIsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwib25zdWJtaXRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmNmX29uc3VibWl0ID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IFwidW5kZWZpbmVkIGF0dHJpYnV0ZSBmb3IgY29tcC1mb3JtOiBuYW1lXCI7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGN1cnJlbnRseSB2YWx1ZXMgZnJvbSB0aGUgZm9ybSBhbmQgcmV0dXJuXG4gICAgICogb2JqZWN0IGJhc2VkIG9uIHRoZSBmb3JtcyBuYW1lc1xuICAgICAqXG4gICAgICogQHJldHVybiBvYmplY3RcbiAgICAgKi9cbiAgICBnZXREYXRhKCkge1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuICAgICAgICBlbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9nYXRoZXJfZm9ybV9kYXRhKGUsIHJldCkpO1xuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBmb3JtIGRhdGEgZnJvbSBleHRlcm5hbCBhbmQgcmVyZW5kZXIgdGhlIGlucHV0IHZhbHVlc1xuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgc2V0RGF0YShkYXRhKSB7XG4gICAgICAgIHRoaXMuX2ZpbGxfZGF0YShkYXRhKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nYXRoZXJfZm9ybV9kYXRhIChmb3JtLCBkYXRhT2JqKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGZvcm0pO1xuICAgICAgICBzd2l0Y2ggKGZvcm0udGFnTmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIklOUFVUXCI6XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmb3JtLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyYWRpb1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjaGVja2JveFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3JtLmNoZWNrZWQgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSBmb3JtLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJTRUxFQ1RcIjpcbiAgICAgICAgICAgIGNhc2UgXCJURVhUQVJFQVwiOlxuICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9ICQoZm9ybSkudmFsKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsZW1cbiAgICAgKiBAcGFyYW0gZGF0YU9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2ZpbGxfZm9ybV9zaW5nbGUoZWxlbSwgZGF0YU9iaikge1xuICAgICAgICAkKGVsZW0pLnZhbChkYXRhT2JqW2VsZW0ubmFtZV0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWxsX2RhdGEgKGRhdGFPYmopIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2ZpbGxfZm9ybV9zaW5nbGUoZSwgZGF0YU9iaikpO1xuICAgIH1cblxuXG4gICAgX3N1Ym1pdChlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiX3N1Ym1pdFwiLCB0aGlzLmNmX29uc3VibWl0KTtcbiAgICAgICAgQ29tcENvcmUuaW5zdGFuY2UuZXZhbEF0dHIodGhpcy5jZl9vbnN1Ym1pdCwgZSwgdGhpcyk7XG5cbiAgICB9XG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBSZWdpc3RlciBldmVudCBoYW5kbGVyXG4gICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJmb3JtXCIpO1xuICAgICAgICAgICAgaWYgKHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9IHNlbGYucXVlcnlTZWxlY3RvcihcImJ1dHRvblt0eXBlPSdzdWJtaXQnXVwiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQub25jbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0KGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uc3VibWl0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1mb3JtXCIsIENKRm9ybUVsZW1lbnQpOyIsIlxyXG5jbGFzcyBDSlBhbmVFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuX3NyYyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy50YXJnZXROb2RlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJzcmNcIiwgXCJzaGFkb3ctZG9tXCJdOyB9XHJcblxyXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xyXG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwic3JjXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zcmMgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zcmMgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkVXJsKHRoaXMuX3NyYyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInNoYWRvdy1kb21cIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NoYWRvd0RvbSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2xvYWRVcmwodXJsKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2FkXCIsIHVybCk7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHVybCwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnNIdG1sKVxyXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBkYXRhXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9LCAxKTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cclxuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICggISBzZWxmLl9zaGFkb3dEb20pIHtcclxuICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBzZWxmLmF0dGFjaFNoYWRvdyh7bW9kZTogJ29wZW4nfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuXHJcblxyXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1wYW5lXCIsIENKUGFuZUVsZW1lbnQpO1xyXG4iLCJcblxuY2xhc3MgQ0pSZW5kZXJlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgQ0pSZW5kZXJlci5yZW5kZXJlciA9IHRoaXM7XG4gICAgfVxuXG4gICAgYm9vbEV2YWwoc2NvcGUsIGNvZGUpIHtcbiAgICAgICAgbGV0IHJldCA9ICgoc2NvcGUsIF9jb2RlKSA9PiB7XG4gICAgICAgICAgICBsZXQgX19yZXQgPSBudWxsO1xuXG4gICAgICAgICAgICBsZXQgZ2VuY29kZSA9IGBfX3JldCA9ICR7X2NvZGV9O2A7XG4gICAgICAgICAgICBldmFsKGdlbmNvZGUpO1xuXG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pKHNjb3BlLCBjb2RlKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBmb3JFdmFsKHNjb3BlLCBjb2RlLCB0YXJnZXROb2RlLCB0cGxOb2RlKSB7XG4gICAgICAgIGxldCByZWcgPSAvXihbYS16QS1aMC05Xy5cXFtcXF1dKylcXHMrYXNcXHMrKFthLXpBLVowLTlfLlxcW1xcXV0rKSQvLmV4ZWMoY29kZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlZyk7XG4gICAgICAgIGxldCBnZW5Db2RlID0gYFxuICAgICAgICAgICAgICAgIGZvcihsZXQgaW5kZXggPSAwOyBpbmRleCA8ICR7cmVnWzFdfS5sZW5ndGg7IGluZGV4Kyspe1xuICAgICAgICAgICAgICAgICAgICAke3JlZ1syXX0gPSAke3JlZ1sxXX1baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3VyQ2xvbmUgPSB0cGxOb2RlLmNsb25lTm9kZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vY3VyQ2xvbmUudGV4dENvbnRlbnQgPSB0cGxOb2RlLnRleHRDb250ZW50O1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXROb2RlLmFwcGVuZENoaWxkKGN1ckNsb25lKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1gO1xuICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgZ2VuQ29kZSk7XG4gICAgICAgIHJldHVybiBldmFsKGdlbkNvZGUpO1xuICAgIH1cblxuICAgIGV2YWxUZXh0KHNjb3BlLCB0ZXh0KSB7XG4gICAgICAgIC8vbGV0IHRleHRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG5cbiAgICAgICAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFx7XFx7KC4qPylcXH1cXH0vZywgZnVuY3Rpb24obWF0Y2gsIHAxKSB7XG4gICAgICAgICAgICBsZXQgX19yZXQgPSBudWxsO1xuICAgICAgICAgICAgZXZhbChgX19yZXQgPSAke3AxfTtgKTtcbiAgICAgICAgICAgIHJldHVybiBfX3JldDtcbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIHJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKSB7XG4gICAgICAgIGxldCBldmVudEF0dHIgPSB0YXJnZXROb2RlLmdldEF0dHJpYnV0ZShcIihjbGljaylcIik7XG4gICAgICAgIGlmIChldmVudEF0dHIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBjb2RlID0gdGhpcy5ldmFsVGV4dChzY29wZSwgZXZlbnRBdHRyKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGUgPT4ge1xuICAgICAgICAgICAgICAgIGV2YWwoY29kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gdGFyZ2V0Tm9kZSB7SFRNTEVsZW1lbnR9XG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKiBAcGFyYW0gY3VyVGVtcGxhdGVOb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICByZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlKSB7XG4gICAgICAgIGlmKHR5cGVvZiB0cGxOb2RlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0cGxOb2RlID0gdGhpcy50ZW1wbGF0ZURvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0YXJnZXROb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YXJnZXROb2RlLnJlbW92ZUNoaWxkKHRhcmdldE5vZGUuY2hpbGRyZW5baV0pO1xuICAgICAgICB9XG4gICAgICAgICovXG5cbiAgICAgICAgaWYgKHRwbE5vZGUgaW5zdGFuY2VvZiBIVE1MVGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jb250ZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRwbE5vZGUgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICBsZXQgdGV4dE5vZGUgPSB0cGxOb2RlLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIHRleHROb2RlLnRleHRDb250ZW50ID0gdGhpcy5ldmFsVGV4dChzY29wZSwgdGV4dE5vZGUudGV4dENvbnRlbnQpO1xuXG4gICAgICAgICAgICB0YXJnZXROb2RlLmFwcGVuZENoaWxkKHRleHROb2RlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKHRwbE5vZGUpO1xuXG5cblxuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFja3ModGFyZ2V0Tm9kZSwgc2NvcGUpO1xuXG4gICAgICAgIGlmKHRwbE5vZGUuaGFzQXR0cmlidXRlKFwiaWYkXCIpKSB7XG4gICAgICAgICAgICBpZih0aGlzLmJvb2xFdmFsKHNjb3BlLCB0cGxOb2RlLmdldEF0dHJpYnV0ZShcImlmJFwiKSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuXG4gICAgICAgIGlmKHRwbE5vZGUuaGFzQXR0cmlidXRlKFwiZm9yJFwiKSkge1xuICAgICAgICAgICAgLy8gQXBwZW5kIGZvcmVhY2ggZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBmb3JDb2RlID0gdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJmb3IkXCIpO1xuICAgICAgICAgICAgdGhpcy5mb3JFdmFsKHNjb3BlLCBmb3JDb2RlLCB0YXJnZXROb2RlLCB0cGxOb2RlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBjaGlsZCBlbGVtZW50c1xuICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG5cbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8oY3VyQ2xvbmUsIHNjb3BlLCB0cGxOb2RlLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGFyc2VOb2RlKG5vZGUsIHNjb3BlKSB7XG4gICAgICAgIGxldCB0cGxOb2RlID0gbm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBub2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGFyZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlLnRhZ05hbWUpO1xuICAgICAgICB0aGlzLnJlbmRlckludG8odGFyZ2V0LCBzY29wZSwgdHBsTm9kZSk7XG4gICAgICAgIG5vZGUucmVwbGFjZVdpdGgodGFyZ2V0KTtcbiAgICB9XG59IiwiXG5cbmNsYXNzIENKVHBsRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmFqYXhTcmMgPSBudWxsO1xuICAgICAgICB0aGlzLnRlbXBsYXRlTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgfVxuXG5cbiAgICByZWxvYWQoKSB7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMudGFyZ2V0Tm9kZSwge30sIHRoaXMudGVtcGxhdGVOb2RlKTtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1zcmNcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtc3JjXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4U3JjID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlYWR5XCIpO1xuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gbmV3IENKUmVuZGVyZXIoKTtcbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcblxuICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb25uZWN0XCIsIHNlbGYudGVtcGxhdGVOb2RlKTtcbiAgICAgICAgICAgIC8vdGhpcy50ZW1wbGF0ZU5vZGUgPSB0aGlzLmNvbnRlbnQuY2hpbGROb2Rlc1swXS5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbmRlckludG8oc2VsZi50YXJnZXROb2RlLCB7YmxhaDogXCJtdWhcIn0sIHNlbGYudGVtcGxhdGVOb2RlKTtcblxuICAgICAgICB9LCAxKTtcblxuICAgIH1cblxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLXRwbFwiLCBDSlRwbEVsZW1lbnQpO1xuIiwiXG5jbGFzcyBDSkFqYXhGb3JtRWxlbWVudCBleHRlbmRzIENKRm9ybUVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnByZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBudWxsO1xuICAgIH1cblxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgdmFyIGF0dHIgPSBDSkZvcm1FbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlcztcbiAgICAgICAgcmV0dXJuIGF0dHI7XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiYWpheC1hY3Rpb25cIjpcbiAgICAgICAgICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJwcmVsb2FkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5wcmVsb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJvbnN1Y2Nlc3NcIjpcbiAgICAgICAgICAgICAgICB0aGlzLm9uc3VjY2VzcyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIF9vbl9zdWJtaXRfY2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcImxvYWRpbmdcIik7XG5cbiAgICAgICAgbGV0IGZvcm1EYXRhID0ge307XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZ2F0aGVyX2Zvcm1fZGF0YShlLCBmb3JtRGF0YSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICBsZXQgYWpheE9wdGlvbnMgPSBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucztcbiAgICAgICAgYWpheE9wdGlvbnNbXCJtZXRob2RcIl0gPSBcInBvc3RcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJ1cmxcIl0gPSB0aGlzLmFqYXhBY3Rpb247XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVwiXSA9IEpTT04uc3RyaW5naWZ5KGZvcm1EYXRhKTtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJjb250ZW50VHlwZVwiXSA9IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFUeXBlXCJdID0gXCJqc29uXCI7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBqUXVlcnkuYWpheChhamF4T3B0aW9ucykuZG9uZShcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24ucmVtb3ZlQ2xhc3MoXCJsb2FkaW5nXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcInNhdmVkXCIpO1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYub25zdWNjZXNzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByID0gZXZhbChzZWxmLm9uc3VjY2Vzcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcih0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24gPSAkKFwiYnV0dG9uW3R5cGU9J3N1Ym1pdCddLCBpbnB1dFt0eXBlPSdzdWJtaXQnXVwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmNsaWNrKGUgPT4gdGhpcy5fb25fc3VibWl0X2NsaWNrKGUpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHRoaXMuYWpheEFjdGlvbiwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9maWxsX2RhdGEoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWFqYXgtZm9ybVwiLCBDSkFqYXhGb3JtRWxlbWVudCk7IiwiXG5cbmNsYXNzIENqU2NyaXB0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJUZXh0O1xuICAgICAgICAgICAgc2VsZi50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgY29udGVudCk7XG4gICAgICAgICAgICBldmFsKGNvbnRlbnQpO1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICAgICAgICAgICAgc2NyaXB0LnRleHRDb250ZW50ID0gY29udGVudDtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgICAgICovXG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG5cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otc2NyaXB0XCIsIENqU2NyaXB0RWxlbWVudCk7Il19
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakhpZ2hsaWdodEVsZW1lbnQuanMiLCJmb3JtL0NKRm9ybUVsZW1lbnQuanMiLCJwYW5lL0NKUGFuZUVsZW1lbnQuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ4ZWxlbS9DSkFqYXhGb3JtRWxlbWVudC5qcyIsInhlbGVtL0NKU2NyaXB0RWxlbWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb21wanMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuY2xhc3MgYyB7XG5cblxuICAgIC8qKlxuICAgICAqIEhUVFAgQ2xpZW50IGZvciBBamF4IFJlcXVlc3RzXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHVybFxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxICh1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDSl9SZXEodXJsKTtcbiAgICB9XG5cblxuXG5cblxufSIsIlxuY2xhc3MgY2Uge1xuXG5cbiAgICBzdGF0aWMgX2dldEVsZW1lbnRCeUlkKGlkLCB0eXBlKSB7XG4gICAgICAgIHZhciBlbGVtID0gJChcIiNcIiArIGlkKVswXTtcbiAgICAgICAgaWYgKGVsZW0gPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBcIkVsZW1lbnQgI1wiICsgaWQgKyBcIiBub3QgZm91bmRcIjtcbiAgICAgICAgaWYgKHR5cGUgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGlmICggISBlbGVtIGluc3RhbmNlb2YgdHlwZSlcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVsZW1lbnQgI1wiICsgaWQgKyBcIiBub3Qgb2YgdHlwZSBcIiArIHR5cGU7XG4gICAgICAgIHJldHVybiBlbGVtO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybnMge0NKRm9ybUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGZvcm0oaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pGb3JtRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybiB7Q0pQYW5lRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFuZShpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDSlBhbmVFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBhbnkoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSl9SZXEge1xuXG4gICAgY29uc3RydWN0b3IodXJsKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgYm9keTogbnVsbCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwidGV4dFwiXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGJvZHlcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgd2l0aEJvZHkoYm9keSkge1xuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0Lm1ldGhvZCA9PT0gXCJHRVRcIilcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5tZXRob2QgPSBcIlBPU1RcIjtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYm9keSkgfHwgdHlwZW9mIGJvZHkgPT09IFwib2JqZWN0XCIpXG4gICAgICAgICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keSk7XG4gICAgICAgIHRoaXMucmVxdWVzdC5ib2R5ID0gYm9keTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0IGpzb24oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBcImpzb25cIilcbiAgICB9XG5cbiAgICBzZXQgcGxhaW4oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBudWxsKVxuICAgIH1cblxuICAgIHNldCBzdHJlYW0oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBcInN0cmVhbVwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmblxuICAgICAqIEBwYXJhbSBmaWx0ZXJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlX3JlcXVlc3QoZm4sIGZpbHRlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3Quc3VjY2VzcyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVyID09PSBcImpzb25cIilcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGZuKGRhdGEpO1xuICAgICAgICB9O1xuICAgICAgICAkLmFqYXgodGhpcy5yZXF1ZXN0KTtcbiAgICB9XG5cbn0iLCJcbmNsYXNzIENKSHRtbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbn0iLCJjbGFzcyBDb21wQ29yZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYWpheE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zSHRtbCA9IHtcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgaW5zdGFuY2UgKCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBDb3JlKCk7XG4gICAgfVxuXG5cbiAgICBldmFsQXR0cihhdHRyVmFsdWUsIGV2ZW50LCBvd25lck9iaikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgYXR0clZhbHVlKTtcbiAgICAgICAgaWYgKGF0dHJWYWx1ZSA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBpZiAodHlwZW9mIGF0dHJWYWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWwoYXR0clZhbHVlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwib3duZXJcIiwgb3duZXJPYmopO1xuICAgICAgICAgICAgdmFyIHJldCA9IGNvbnRleHQuYmluZChvd25lck9iaikoZXZlbnQpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXQgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgcmV0dXJuIHJldC5iaW5kKG93bmVyT2JqKShldmVudClcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGF0dHJWYWx1ZSA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgcmV0dXJuIGF0dHJWYWx1ZShldmVudCwgb3duZXJPYmopO1xuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJldmFsIGVycm9yOlwiLCBhdHRyVmFsdWUpXG4gICAgICAgIHRocm93IFwiQ2Fubm90IGV2YWx1YXRlIGV4cHJlc3Npb24gLSBzZWUgb3V0cHV0XCJcbiAgICB9XG59XG5cblxuIiwiXG5cbmNsYXNzIENqSGlnaGxpZ2h0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gc2VsZi5pbm5lckhUTUw7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoZGl2KTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKHByZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY29kZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlLmFwcGVuZENoaWxkKGNvZGUpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLmNsYXNzTGlzdC5hZGQoXCJodG1sXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLnN0eWxlLndoaXRlU3BhY2UgPSBcInByZVwiO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLmlubmVyVGV4dCA9IGNvbnRlbnQ7XG5cbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1oaWdobGlnaHRcIiwgQ2pIaWdobGlnaHRFbGVtZW50KTsiLCJcbmNsYXNzIENKRm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fc3VibWl0dGFibGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG51bGw7XG4gICAgICAgIHNlbGYgPSB0aGlzO1xuICAgIH1cblxuXG4gICAgZ2V0IGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERhdGEoKTtcbiAgICB9XG5cbiAgICBzZXQgZGF0YSh2YWx1ZSkge1xuICAgICAgICB0aGlzLnNldERhdGEodmFsdWUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJvbnN1Ym1pdFwiXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBjb25zb2xlLmxvZyAoXCJhdHRyXCIsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwib25zdWJtaXRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmNmX29uc3VibWl0ID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IFwidW5kZWZpbmVkIGF0dHJpYnV0ZSBmb3IgY29tcC1mb3JtOiBuYW1lXCI7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGN1cnJlbnRseSB2YWx1ZXMgZnJvbSB0aGUgZm9ybSBhbmQgcmV0dXJuXG4gICAgICogb2JqZWN0IGJhc2VkIG9uIHRoZSBmb3JtcyBuYW1lc1xuICAgICAqXG4gICAgICogQHJldHVybiBvYmplY3RcbiAgICAgKi9cbiAgICBnZXREYXRhKCkge1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuICAgICAgICBlbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9nYXRoZXJfZm9ybV9kYXRhKGUsIHJldCkpO1xuXG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBmb3JtIGRhdGEgZnJvbSBleHRlcm5hbCBhbmQgcmVyZW5kZXIgdGhlIGlucHV0IHZhbHVlc1xuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgc2V0RGF0YShkYXRhKSB7XG4gICAgICAgIHRoaXMuX2ZpbGxfZGF0YShkYXRhKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nYXRoZXJfZm9ybV9kYXRhIChmb3JtLCBkYXRhT2JqKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGZvcm0pO1xuICAgICAgICBzd2l0Y2ggKGZvcm0udGFnTmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIklOUFVUXCI6XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmb3JtLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyYWRpb1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjaGVja2JveFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3JtLmNoZWNrZWQgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSBmb3JtLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJTRUxFQ1RcIjpcbiAgICAgICAgICAgIGNhc2UgXCJURVhUQVJFQVwiOlxuICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9ICQoZm9ybSkudmFsKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsZW1cbiAgICAgKiBAcGFyYW0gZGF0YU9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2ZpbGxfZm9ybV9zaW5nbGUoZWxlbSwgZGF0YU9iaikge1xuICAgICAgICAkKGVsZW0pLnZhbChkYXRhT2JqW2VsZW0ubmFtZV0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWxsX2RhdGEgKGRhdGFPYmopIHtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2ZpbGxfZm9ybV9zaW5nbGUoZSwgZGF0YU9iaikpO1xuICAgIH1cblxuXG4gICAgX3N1Ym1pdChlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiX3N1Ym1pdFwiLCB0aGlzLmNmX29uc3VibWl0KTtcbiAgICAgICAgQ29tcENvcmUuaW5zdGFuY2UuZXZhbEF0dHIodGhpcy5jZl9vbnN1Ym1pdCwgZSwgdGhpcyk7XG5cbiAgICB9XG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBSZWdpc3RlciBldmVudCBoYW5kbGVyXG4gICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJmb3JtXCIpO1xuICAgICAgICAgICAgaWYgKHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9IHNlbGYucXVlcnlTZWxlY3RvcihcImJ1dHRvblt0eXBlPSdzdWJtaXQnXVwiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQub25jbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0KGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uc3VibWl0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1mb3JtXCIsIENKRm9ybUVsZW1lbnQpOyIsIlxyXG5jbGFzcyBDSlBhbmVFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuX3NyYyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy50YXJnZXROb2RlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJzcmNcIiwgXCJzaGFkb3ctZG9tXCJdOyB9XHJcblxyXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xyXG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwic3JjXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zcmMgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zcmMgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkVXJsKHRoaXMuX3NyYyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInNoYWRvdy1kb21cIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NoYWRvd0RvbSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2xvYWRVcmwodXJsKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2FkXCIsIHVybCk7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHVybCwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnNIdG1sKVxyXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBkYXRhXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9LCAxKTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cclxuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICggISBzZWxmLl9zaGFkb3dEb20pIHtcclxuICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBzZWxmLmF0dGFjaFNoYWRvdyh7bW9kZTogJ29wZW4nfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuXHJcblxyXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1wYW5lXCIsIENKUGFuZUVsZW1lbnQpO1xyXG4iLCJcblxuY2xhc3MgQ0pSZW5kZXJlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgQ0pSZW5kZXJlci5yZW5kZXJlciA9IHRoaXM7XG4gICAgfVxuXG4gICAgYm9vbEV2YWwoc2NvcGUsIGNvZGUpIHtcbiAgICAgICAgbGV0IHJldCA9ICgoc2NvcGUsIF9jb2RlKSA9PiB7XG4gICAgICAgICAgICBsZXQgX19yZXQgPSBudWxsO1xuXG4gICAgICAgICAgICBsZXQgZ2VuY29kZSA9IGBfX3JldCA9ICR7X2NvZGV9O2A7XG4gICAgICAgICAgICBldmFsKGdlbmNvZGUpO1xuXG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pKHNjb3BlLCBjb2RlKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBmb3JFdmFsKHNjb3BlLCBjb2RlLCB0YXJnZXROb2RlLCB0cGxOb2RlKSB7XG4gICAgICAgIGxldCByZWcgPSAvXihbYS16QS1aMC05Xy5cXFtcXF1dKylcXHMrYXNcXHMrKFthLXpBLVowLTlfLlxcW1xcXV0rKSQvLmV4ZWMoY29kZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlZyk7XG4gICAgICAgIGxldCBnZW5Db2RlID0gYFxuICAgICAgICAgICAgICAgIGZvcihsZXQgaW5kZXggPSAwOyBpbmRleCA8ICR7cmVnWzFdfS5sZW5ndGg7IGluZGV4Kyspe1xuICAgICAgICAgICAgICAgICAgICAke3JlZ1syXX0gPSAke3JlZ1sxXX1baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3VyQ2xvbmUgPSB0cGxOb2RlLmNsb25lTm9kZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vY3VyQ2xvbmUudGV4dENvbnRlbnQgPSB0cGxOb2RlLnRleHRDb250ZW50O1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXROb2RlLmFwcGVuZENoaWxkKGN1ckNsb25lKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1gO1xuICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgZ2VuQ29kZSk7XG4gICAgICAgIHJldHVybiBldmFsKGdlbkNvZGUpO1xuICAgIH1cblxuICAgIGV2YWxUZXh0KHNjb3BlLCB0ZXh0KSB7XG4gICAgICAgIC8vbGV0IHRleHRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG5cbiAgICAgICAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFx7XFx7KC4qPylcXH1cXH0vZywgZnVuY3Rpb24obWF0Y2gsIHAxKSB7XG4gICAgICAgICAgICBsZXQgX19yZXQgPSBudWxsO1xuICAgICAgICAgICAgZXZhbChgX19yZXQgPSAke3AxfTtgKTtcbiAgICAgICAgICAgIHJldHVybiBfX3JldDtcbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIHJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKSB7XG4gICAgICAgIGxldCBldmVudEF0dHIgPSB0YXJnZXROb2RlLmdldEF0dHJpYnV0ZShcIihjbGljaylcIik7XG4gICAgICAgIGlmIChldmVudEF0dHIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBjb2RlID0gdGhpcy5ldmFsVGV4dChzY29wZSwgZXZlbnRBdHRyKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGUgPT4ge1xuICAgICAgICAgICAgICAgIGV2YWwoY29kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gdGFyZ2V0Tm9kZSB7SFRNTEVsZW1lbnR9XG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKiBAcGFyYW0gY3VyVGVtcGxhdGVOb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICByZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlKSB7XG4gICAgICAgIGlmKHR5cGVvZiB0cGxOb2RlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0cGxOb2RlID0gdGhpcy50ZW1wbGF0ZURvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0YXJnZXROb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YXJnZXROb2RlLnJlbW92ZUNoaWxkKHRhcmdldE5vZGUuY2hpbGRyZW5baV0pO1xuICAgICAgICB9XG4gICAgICAgICovXG5cbiAgICAgICAgaWYgKHRwbE5vZGUgaW5zdGFuY2VvZiBIVE1MVGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jb250ZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRwbE5vZGUgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICBsZXQgdGV4dE5vZGUgPSB0cGxOb2RlLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIHRleHROb2RlLnRleHRDb250ZW50ID0gdGhpcy5ldmFsVGV4dChzY29wZSwgdGV4dE5vZGUudGV4dENvbnRlbnQpO1xuXG4gICAgICAgICAgICB0YXJnZXROb2RlLmFwcGVuZENoaWxkKHRleHROb2RlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKHRwbE5vZGUpO1xuXG5cblxuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFja3ModGFyZ2V0Tm9kZSwgc2NvcGUpO1xuXG4gICAgICAgIGlmKHRwbE5vZGUuaGFzQXR0cmlidXRlKFwiaWYkXCIpKSB7XG4gICAgICAgICAgICBpZih0aGlzLmJvb2xFdmFsKHNjb3BlLCB0cGxOb2RlLmdldEF0dHJpYnV0ZShcImlmJFwiKSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuXG4gICAgICAgIGlmKHRwbE5vZGUuaGFzQXR0cmlidXRlKFwiZm9yJFwiKSkge1xuICAgICAgICAgICAgLy8gQXBwZW5kIGZvcmVhY2ggZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBmb3JDb2RlID0gdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJmb3IkXCIpO1xuICAgICAgICAgICAgdGhpcy5mb3JFdmFsKHNjb3BlLCBmb3JDb2RlLCB0YXJnZXROb2RlLCB0cGxOb2RlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBjaGlsZCBlbGVtZW50c1xuICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG5cbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8oY3VyQ2xvbmUsIHNjb3BlLCB0cGxOb2RlLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGFyc2VOb2RlKG5vZGUsIHNjb3BlKSB7XG4gICAgICAgIGxldCB0cGxOb2RlID0gbm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBub2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGFyZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlLnRhZ05hbWUpO1xuICAgICAgICB0aGlzLnJlbmRlckludG8odGFyZ2V0LCBzY29wZSwgdHBsTm9kZSk7XG4gICAgICAgIG5vZGUucmVwbGFjZVdpdGgodGFyZ2V0KTtcbiAgICB9XG59IiwiXG5cbmNsYXNzIENKVHBsRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmFqYXhTcmMgPSBudWxsO1xuICAgICAgICB0aGlzLnRlbXBsYXRlTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgfVxuXG5cbiAgICByZWxvYWQoKSB7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMudGFyZ2V0Tm9kZSwge30sIHRoaXMudGVtcGxhdGVOb2RlKTtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1zcmNcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtc3JjXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4U3JjID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlYWR5XCIpO1xuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gbmV3IENKUmVuZGVyZXIoKTtcbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcblxuICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb25uZWN0XCIsIHNlbGYudGVtcGxhdGVOb2RlKTtcbiAgICAgICAgICAgIC8vdGhpcy50ZW1wbGF0ZU5vZGUgPSB0aGlzLmNvbnRlbnQuY2hpbGROb2Rlc1swXS5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbmRlckludG8oc2VsZi50YXJnZXROb2RlLCB7YmxhaDogXCJtdWhcIn0sIHNlbGYudGVtcGxhdGVOb2RlKTtcblxuICAgICAgICB9LCAxKTtcblxuICAgIH1cblxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLXRwbFwiLCBDSlRwbEVsZW1lbnQpO1xuIiwiXG5jbGFzcyBDSkFqYXhGb3JtRWxlbWVudCBleHRlbmRzIENKRm9ybUVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnByZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBudWxsO1xuICAgIH1cblxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgdmFyIGF0dHIgPSBDSkZvcm1FbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlcztcbiAgICAgICAgcmV0dXJuIGF0dHI7XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiYWpheC1hY3Rpb25cIjpcbiAgICAgICAgICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJwcmVsb2FkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5wcmVsb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJvbnN1Y2Nlc3NcIjpcbiAgICAgICAgICAgICAgICB0aGlzLm9uc3VjY2VzcyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIF9vbl9zdWJtaXRfY2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcImxvYWRpbmdcIik7XG5cbiAgICAgICAgbGV0IGZvcm1EYXRhID0ge307XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZ2F0aGVyX2Zvcm1fZGF0YShlLCBmb3JtRGF0YSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICBsZXQgYWpheE9wdGlvbnMgPSBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucztcbiAgICAgICAgYWpheE9wdGlvbnNbXCJtZXRob2RcIl0gPSBcInBvc3RcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJ1cmxcIl0gPSB0aGlzLmFqYXhBY3Rpb247XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVwiXSA9IEpTT04uc3RyaW5naWZ5KGZvcm1EYXRhKTtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJjb250ZW50VHlwZVwiXSA9IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFUeXBlXCJdID0gXCJqc29uXCI7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBqUXVlcnkuYWpheChhamF4T3B0aW9ucykuZG9uZShcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24ucmVtb3ZlQ2xhc3MoXCJsb2FkaW5nXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcInNhdmVkXCIpO1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYub25zdWNjZXNzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByID0gZXZhbChzZWxmLm9uc3VjY2Vzcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcih0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24gPSAkKFwiYnV0dG9uW3R5cGU9J3N1Ym1pdCddLCBpbnB1dFt0eXBlPSdzdWJtaXQnXVwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmNsaWNrKGUgPT4gdGhpcy5fb25fc3VibWl0X2NsaWNrKGUpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHRoaXMuYWpheEFjdGlvbiwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9maWxsX2RhdGEoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWFqYXgtZm9ybVwiLCBDSkFqYXhGb3JtRWxlbWVudCk7IiwiXG5cbmNsYXNzIENqU2NyaXB0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJUZXh0O1xuICAgICAgICAgICAgc2VsZi50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgY29udGVudCk7XG4gICAgICAgICAgICBldmFsKGNvbnRlbnQpO1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICAgICAgICAgICAgc2NyaXB0LnRleHRDb250ZW50ID0gY29udGVudDtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgICAgICovXG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG5cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otc2NyaXB0XCIsIENqU2NyaXB0RWxlbWVudCk7Il19