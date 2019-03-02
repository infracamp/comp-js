/**
 * ComponentJS
 *
 * @author Matthias Leuffen <m@tth.es>
 */


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
     * @static
     * @param id
     * @return {CjHighlightElement}
     */
    static highlight(id) {
        return ce._getElementById(id, CjHighlightElement);
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

    constructor() {
        super();
        this.debug = false;
    }

    static get observedAttributes() { return ["debug"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "debug":
                this.debug = true;
                break;

        }
    }


    /**
     * Log output (if debug is on)
     *
     * @protected
     * @param param1
     * @param param2
     */
    _log(param1, param2) {
        if (this.debug)
            console.log(this, ...arguments);
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

                }, 1);
    }


}

customElements.define("cj-exec", CjExecElement);


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


    static get observedAttributes() { return ["onsubmit", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "onsubmit":
                this.cf_onsubmit = newValue;
                break;

        }
    }


    /**
     * Private
     *
     * @param form
     * @param dataObj
     * @private
     */
    _gather_form_data (form, dataObj) {
        switch (form.tagName) {
            case "INPUT":
                switch (form.type) {
                    case "checkbox":
                    case "radio":
                        if (form.checked == true)
                            dataObj[form.name] = form.value;
                        return;
                }
            case "SELECT":
                dataObj[form.name] = $(form).val();
                break;
            case "TEXTAREA":
                dataObj[form.name] = $(form).val();
                break;
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
        var elements = $("input, textarea, checkbox, select", this);
        elements.each((i, e) => this._gather_form_data(e, ret));
        this._log("getData():", ret);
        return ret;
    }




    /**
     *
     * @param form
     * @param dataObj
     * @private
     */
    _fill_form_single(form, dataObj) {
        var formName = form.name;
        if (formName === undefined)
            formName = form.id;

        switch (form.tagName) {
            case "INPUT":
                switch (form.type) {
                    case "checkbox":
                    case "radio":
                        if (dataObj[formName] == form.value) {
                            form.checked = true;
                        } else {
                            form.checked = false;
                        }
                        return;
                }
                form.value = dataObj[formName];
                break;
            case "SELECT":
                form.value = dataObj[formName];
                break;
            case "TEXTAREA":
                form.value = dataObj[formName];
                break;
        }
    }

    /**
     * Set the form data from external and rerender the input values
     *
     * @public
     * @param data
     */
    setData(data) {
        this._log("setData()", data);
        var elements = $("input, textarea, checkbox, select", this);
        elements.each((i, e) => this._fill_form_single(e, data));
    }

    _submit(e) {
        this._log("_submit(", e, "); calling: onsubmit=", this.cf_onsubmit);
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

class CJPaneElement extends CJHtmlElement {



    constructor() {
        super();
        this._src = null;
        this.targetNode = null;
        this._shadowDom = false;
    }

    static get observedAttributes() { return ["src", "shadow-dom", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
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


    static get observedAttributes() { return ["ajax-action", "preload", "onsuccess", ...CJFormElement.observedAttributes]; }


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakV4ZWNFbGVtZW50LmpzIiwiZG9jL0NqSGlnaGxpZ2h0RWxlbWVudC5qcyIsImZvcm0vQ0pGb3JtRWxlbWVudC5qcyIsImZvcm0vQ0pPcHRpb25zRWxlbWVudC5qcyIsInBhbmUvQ0pQYW5lRWxlbWVudC5qcyIsInRwbC9DSlJlbmRlcmVyLmpzIiwidHBsL0NKVHBsRWxlbWVudC5qcyIsInhlbGVtL0NKQWpheEZvcm1FbGVtZW50LmpzIiwieGVsZW0vQ0pTY3JpcHRFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29tcGpzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbmNsYXNzIGMge1xuXG5cbiAgICAvKipcbiAgICAgKiBIVFRQIENsaWVudCBmb3IgQWpheCBSZXF1ZXN0c1xuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB1cmxcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgc3RhdGljIHJlcSAodXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ0pfUmVxKHVybCk7XG4gICAgfVxuXG5cblxuXG5cbn0iLCJcbmNsYXNzIGNlIHtcblxuXG4gICAgc3RhdGljIF9nZXRFbGVtZW50QnlJZChpZCwgdHlwZSkge1xuICAgICAgICB2YXIgZWxlbSA9ICQoXCIjXCIgKyBpZClbMF07XG4gICAgICAgIGlmIChlbGVtID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IGZvdW5kXCI7XG4gICAgICAgIGlmICh0eXBlICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBpZiAoICEgZWxlbSBpbnN0YW5jZW9mIHR5cGUpXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IG9mIHR5cGUgXCIgKyB0eXBlO1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm5zIHtDSkZvcm1FbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBmb3JtKGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENKRm9ybUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtDakhpZ2hsaWdodEVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGhpZ2hsaWdodChpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDakhpZ2hsaWdodEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0NKUGFuZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHBhbmUoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pQYW5lRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgYW55KGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIH1cbn0iLCJcblxuY2xhc3MgQ0pfUmVxIHtcblxuICAgIGNvbnN0cnVjdG9yKHVybCkge1xuICAgICAgICB0aGlzLnJlcXVlc3QgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIGJvZHk6IG51bGwsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYm9keVxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICB3aXRoQm9keShib2R5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3QubWV0aG9kID09PSBcIkdFVFwiKVxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm1ldGhvZCA9IFwiUE9TVFwiO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShib2R5KSB8fCB0eXBlb2YgYm9keSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeShib2R5KTtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LmJvZHkgPSBib2R5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXQganNvbihmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIFwianNvblwiKVxuICAgIH1cblxuICAgIHNldCBwbGFpbihmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIG51bGwpXG4gICAgfVxuXG4gICAgc2V0IHN0cmVhbShmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIFwic3RyZWFtXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGZuXG4gICAgICogQHBhcmFtIGZpbHRlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VfcmVxdWVzdChmbiwgZmlsdGVyKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdC5zdWNjZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXIgPT09IFwianNvblwiKVxuICAgICAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgZm4oZGF0YSk7XG4gICAgICAgIH07XG4gICAgICAgICQuYWpheCh0aGlzLnJlcXVlc3QpO1xuICAgIH1cblxufSIsIlxuY2xhc3MgQ0pIdG1sRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmRlYnVnID0gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJkZWJ1Z1wiXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuZGVidWcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIExvZyBvdXRwdXQgKGlmIGRlYnVnIGlzIG9uKVxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqIEBwYXJhbSBwYXJhbTFcbiAgICAgKiBAcGFyYW0gcGFyYW0yXG4gICAgICovXG4gICAgX2xvZyhwYXJhbTEsIHBhcmFtMikge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZylcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMsIC4uLmFyZ3VtZW50cyk7XG4gICAgfVxuXG59IiwiY2xhc3MgQ29tcENvcmUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zID0ge1xuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhbGVydCAoXCJFcnJvciBleGVjdXRpbmcgZm9ybSByZXF1ZXN0LlwiKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVycm9yXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5hamF4T3B0aW9uc0h0bWwgPSB7XG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IGluc3RhbmNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wQ29yZSgpO1xuICAgIH1cblxuXG4gICAgZXZhbEF0dHIoYXR0clZhbHVlLCBldmVudCwgb3duZXJPYmopIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGF0dHJWYWx1ZSk7XG4gICAgICAgIGlmIChhdHRyVmFsdWUgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBldmFsKGF0dHJWYWx1ZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIm93bmVyXCIsIG93bmVyT2JqKTtcbiAgICAgICAgICAgIHZhciByZXQgPSBjb250ZXh0LmJpbmQob3duZXJPYmopKGV2ZW50KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmV0ICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIHJldHVybiByZXQuYmluZChvd25lck9iaikoZXZlbnQpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiBhdHRyVmFsdWUoZXZlbnQsIG93bmVyT2JqKTtcblxuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXZhbCBlcnJvcjpcIiwgYXR0clZhbHVlKVxuICAgICAgICB0aHJvdyBcIkNhbm5vdCBldmFsdWF0ZSBleHByZXNzaW9uIC0gc2VlIG91dHB1dFwiXG4gICAgfVxufVxuXG5cbiIsIlxuXG5jbGFzcyBDakV4ZWNFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlTm9kZSA9IHNlbGYucHJldmlvdXNFbGVtZW50U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGVOb2RlLnRhZ05hbWUgIT09IFwiUFJFXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcIkNhbm5vdCBmaW5kIHNpYmxpbmcgPHByZT4gbm9kZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvZGVOb2RlID0gY29kZU5vZGUucXVlcnlTZWxlY3RvcihcImNvZGVcIik7XG5cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJ0ZXh0Q29udGVudD1cIiwgY29kZU5vZGUudGV4dENvbnRlbnQpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbm5lckhUTUwgPSBjb2RlTm9kZS50ZXh0Q29udGVudDtcblxuICAgICAgICAgICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWV4ZWNcIiwgQ2pFeGVjRWxlbWVudCk7IiwiXG5cbmNsYXNzIENqSGlnaGxpZ2h0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuX2NvZGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5sYW5nID0gXCJodG1sXCJcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImxhbmdcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJsYW5nXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5sYW5nID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdGV4dCB0byBoaWdobGlnaHRcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSAgICAgdGhlIGNvZGUgdG8gaGlnaHRsaWdodFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlVHlwZSBUaGUgaGlnaGxpZ2h0ZXIgdG8gdXNlIChodG1sfHRleHR8anMpXG4gICAgICovXG4gICAgc2V0Q29kZShjb2RlLCBjb2RlVHlwZSkge1xuICAgICAgICBpZiAoY29kZVR5cGUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGNvZGVUeXBlID0gdGhpcy5sYW5nO1xuXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gY29kZTtcbiAgICAgICAgaWYgKHRoaXMuX2NvZGVFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9jb2RlRWxlbWVudC5pbm5lclRleHQgPSBjb2RlO1xuICAgICAgICAgICAgdGhpcy5fY29kZUVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb2RlVHlwZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImxvYWRcIikpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJjb250ZW50IHRvIGhpZ2hsaWdodFwiLCBjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQocHJlKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjb2RlXCIpO1xuICAgICAgICAgICAgICAgICAgICBwcmUuYXBwZW5kQ2hpbGQoY29kZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fY29kZUVsZW1lbnQgPSBjb2RlO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvZGUuY2xhc3NMaXN0LmFkZChzZWxmLmxhbmcpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLnN0eWxlLndoaXRlU3BhY2UgPSBcInByZVwiO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50LnRyaW0oKSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZS5pbm5lclRleHQgPSBjb250ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJsb2FkXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1oaWdobGlnaHRcIiwgQ2pIaWdobGlnaHRFbGVtZW50KTsiLCJcbmNsYXNzIENKRm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fc3VibWl0dGFibGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG51bGw7XG4gICAgICAgIHNlbGYgPSB0aGlzO1xuICAgIH1cblxuXG4gICAgZ2V0IGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERhdGEoKTtcbiAgICB9XG5cbiAgICBzZXQgZGF0YSh2YWx1ZSkge1xuICAgICAgICB0aGlzLnNldERhdGEodmFsdWUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJvbnN1Ym1pdFwiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIm9uc3VibWl0XCI6XG4gICAgICAgICAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nYXRoZXJfZm9ybV9kYXRhIChmb3JtLCBkYXRhT2JqKSB7XG4gICAgICAgIHN3aXRjaCAoZm9ybS50YWdOYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiSU5QVVRcIjpcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZvcm0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY2hlY2tib3hcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJhZGlvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybS5jaGVja2VkID09IHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gZm9ybS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiU0VMRUNUXCI6XG4gICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gJChmb3JtKS52YWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJURVhUQVJFQVwiOlxuICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9ICQoZm9ybSkudmFsKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWFkIHRoZSBjdXJyZW50bHkgdmFsdWVzIGZyb20gdGhlIGZvcm0gYW5kIHJldHVyblxuICAgICAqIG9iamVjdCBiYXNlZCBvbiB0aGUgZm9ybXMgbmFtZXNcbiAgICAgKlxuICAgICAqIEByZXR1cm4gb2JqZWN0XG4gICAgICovXG4gICAgZ2V0RGF0YSgpIHtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICB2YXIgZWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveCwgc2VsZWN0XCIsIHRoaXMpO1xuICAgICAgICBlbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9nYXRoZXJfZm9ybV9kYXRhKGUsIHJldCkpO1xuICAgICAgICB0aGlzLl9sb2coXCJnZXREYXRhKCk6XCIsIHJldCk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG5cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhT2JqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZmlsbF9mb3JtX3NpbmdsZShmb3JtLCBkYXRhT2JqKSB7XG4gICAgICAgIHZhciBmb3JtTmFtZSA9IGZvcm0ubmFtZTtcbiAgICAgICAgaWYgKGZvcm1OYW1lID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBmb3JtTmFtZSA9IGZvcm0uaWQ7XG5cbiAgICAgICAgc3dpdGNoIChmb3JtLnRhZ05hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJJTlBVVFwiOlxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZm9ybS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjaGVja2JveFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhT2JqW2Zvcm1OYW1lXSA9PSBmb3JtLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJTRUxFQ1RcIjpcbiAgICAgICAgICAgICAgICBmb3JtLnZhbHVlID0gZGF0YU9ialtmb3JtTmFtZV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiVEVYVEFSRUFcIjpcbiAgICAgICAgICAgICAgICBmb3JtLnZhbHVlID0gZGF0YU9ialtmb3JtTmFtZV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGZvcm0gZGF0YSBmcm9tIGV4dGVybmFsIGFuZCByZXJlbmRlciB0aGUgaW5wdXQgdmFsdWVzXG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKi9cbiAgICBzZXREYXRhKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fbG9nKFwic2V0RGF0YSgpXCIsIGRhdGEpO1xuICAgICAgICB2YXIgZWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveCwgc2VsZWN0XCIsIHRoaXMpO1xuICAgICAgICBlbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9maWxsX2Zvcm1fc2luZ2xlKGUsIGRhdGEpKTtcbiAgICB9XG5cbiAgICBfc3VibWl0KGUpIHtcbiAgICAgICAgdGhpcy5fbG9nKFwiX3N1Ym1pdChcIiwgZSwgXCIpOyBjYWxsaW5nOiBvbnN1Ym1pdD1cIiwgdGhpcy5jZl9vbnN1Ym1pdCk7XG4gICAgICAgIENvbXBDb3JlLmluc3RhbmNlLmV2YWxBdHRyKHRoaXMuY2Zfb25zdWJtaXQsIGUsIHRoaXMpO1xuICAgIH1cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFJlZ2lzdGVyIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9IHNlbGYucXVlcnlTZWxlY3RvcihcImZvcm1cIik7XG4gICAgICAgICAgICBpZiAoc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID0gc2VsZi5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uW3R5cGU9J3N1Ym1pdCddXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXQoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQub25zdWJtaXQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0KGUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWZvcm1cIiwgQ0pGb3JtRWxlbWVudCk7IiwiXG5jbGFzcyBDSk9wdGlvbnNFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fc2VsZWN0RWxlbWVudElkID0gW107XG5cbiAgICB9XG5cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJmb3JcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJmb3JcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RFbGVtZW50SWQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICByZWZyZXNoKCkge1xuICAgICAgICB0aGlzLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHRoaXMuX29wdGlvbnMuZm9yRWFjaChpLCBlbGVtID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2xvZyhcImFkZFwiLCBpLCBlbGVtKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLnZhbHVlO1xuICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gZWxlbS50ZXh0O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHZhciB2YWwsIHRleHQgPSBlbGVtO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKTtcbiAgICAgICAgICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCB2YWwpO1xuICAgICAgICAgICAgb3B0aW9uLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbG9nKFwiY2otb2JqZWN0aW9uIGNvbm5lY3RlZCgpXCIpO1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIm11aFwiKTtcbiAgICAgICAgICAgIGlmIChzZWxmLnRleHRDb250ZW50LnRyaW0oKSAhPT0gXCJcIikge1xuXG4gICAgICAgICAgICAgICAgc2VsZi5fb3B0aW9ucyA9IEpTT04ucGFyc2Uoc2VsZi50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fbG9nKFwiTG9hZGluZyBvcHRpb25zIHByZXNldCBmcm9tIGpzb246XCIsIHNlbGYuX29wdGlvbnMpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgIHNlbGYucmVmcmVzaCgpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otb3B0aW9uc1wiLCBDSk9wdGlvbnNFbGVtZW50KTsiLCJcclxuY2xhc3MgQ0pQYW5lRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLl9zcmMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fc2hhZG93RG9tID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJzcmNcIiwgXCJzaGFkb3ctZG9tXCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxyXG5cclxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcclxuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcclxuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSBcInNyY1wiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3JjID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3JjICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9hZFVybCh0aGlzLl9zcmMpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzaGFkb3ctZG9tXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9sb2FkVXJsKHVybCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwibG9hZFwiLCB1cmwpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBqUXVlcnkuYWpheCh1cmwsIENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zSHRtbClcclxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUuaW5uZXJIVE1MID0gZGF0YVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgMSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXHJcbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoICEgc2VsZi5fc2hhZG93RG9tKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzZWxmLnRhcmdldE5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gc2VsZi5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5cclxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otcGFuZVwiLCBDSlBhbmVFbGVtZW50KTtcclxuIiwiXG5cbmNsYXNzIENKUmVuZGVyZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIENKUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgJHtyZWdbMl19ID0gJHtyZWdbMV19W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAvL2N1ckNsb25lLnRleHRDb250ZW50ID0gdHBsTm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVySW50byhjdXJDbG9uZSwgc2NvcGUsIHRwbE5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9YDtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGdlbkNvZGUpO1xuICAgICAgICByZXR1cm4gZXZhbChnZW5Db2RlKTtcbiAgICB9XG5cbiAgICBldmFsVGV4dChzY29wZSwgdGV4dCkge1xuICAgICAgICAvL2xldCB0ZXh0V3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xce1xceyguKj8pXFx9XFx9L2csIGZ1bmN0aW9uKG1hdGNoLCBwMSkge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcbiAgICAgICAgICAgIGV2YWwoYF9fcmV0ID0gJHtwMX07YCk7XG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICByZWdpc3RlckNhbGxiYWNrcyh0YXJnZXROb2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgZXZlbnRBdHRyID0gdGFyZ2V0Tm9kZS5nZXRBdHRyaWJ1dGUoXCIoY2xpY2spXCIpO1xuICAgICAgICBpZiAoZXZlbnRBdHRyICE9PSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgY29kZSA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIGV2ZW50QXR0cik7XG4gICAgICAgICAgICB0YXJnZXROb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBlID0+IHtcbiAgICAgICAgICAgICAgICBldmFsKGNvZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHRhcmdldE5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHBhcmFtIGN1clRlbXBsYXRlTm9kZSB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgcmVuZGVySW50byh0YXJnZXROb2RlLCBzY29wZSwgdHBsTm9kZSkge1xuICAgICAgICBpZih0eXBlb2YgdHBsTm9kZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdHBsTm9kZSA9IHRoaXMudGVtcGxhdGVEb207XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Tm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXROb2RlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgfVxuICAgICAgICAqL1xuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgbGV0IHRleHROb2RlID0gdHBsTm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB0ZXh0Tm9kZS50ZXh0Q29udGVudCA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIHRleHROb2RlLnRleHRDb250ZW50KTtcblxuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyh0cGxOb2RlKTtcblxuXG5cblxuICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKTtcblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImlmJFwiKSkge1xuICAgICAgICAgICAgaWYodGhpcy5ib29sRXZhbChzY29wZSwgdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJpZiRcIikpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSlRwbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgIH1cblxuXG4gICAgcmVsb2FkKCkge1xuICAgICAgICB2YXIgcmVuZGVyZXIgPSBuZXcgQ0pSZW5kZXJlcigpO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgcmVuZGVyZXIucmVuZGVySW50byh0aGlzLnRhcmdldE5vZGUsIHt9LCB0aGlzLnRlbXBsYXRlTm9kZSk7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFqYXgtc3JjXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJyZWFkeVwiKTtcbiAgICAgICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgICAgICBzZWxmLnRlbXBsYXRlTm9kZSA9IHNlbGYuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY29ubmVjdFwiLCBzZWxmLnRlbXBsYXRlTm9kZSk7XG4gICAgICAgICAgICAvL3RoaXMudGVtcGxhdGVOb2RlID0gdGhpcy5jb250ZW50LmNoaWxkTm9kZXNbMF0uY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHNlbGYudGFyZ2V0Tm9kZSwge2JsYWg6IFwibXVoXCJ9LCBzZWxmLnRlbXBsYXRlTm9kZSk7XG5cbiAgICAgICAgfSwgMSk7XG5cbiAgICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai10cGxcIiwgQ0pUcGxFbGVtZW50KTtcbiIsIlxuY2xhc3MgQ0pBamF4Rm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkZvcm1FbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25zdWNjZXNzID0gbnVsbDtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1hY3Rpb25cIiwgXCJwcmVsb2FkXCIsIFwib25zdWNjZXNzXCIsIC4uLkNKRm9ybUVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LWFjdGlvblwiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheEFjdGlvbiA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInByZWxvYWRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLnByZWxvYWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm9uc3VjY2Vzc1wiOlxuICAgICAgICAgICAgICAgIHRoaXMub25zdWNjZXNzID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgX29uX3N1Ym1pdF9jbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmFkZENsYXNzKFwibG9hZGluZ1wiKTtcblxuICAgICAgICBsZXQgZm9ybURhdGEgPSB7fTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9nYXRoZXJfZm9ybV9kYXRhKGUsIGZvcm1EYXRhKSk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIGxldCBhamF4T3B0aW9ucyA9IENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zO1xuICAgICAgICBhamF4T3B0aW9uc1tcIm1ldGhvZFwiXSA9IFwicG9zdFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcInVybFwiXSA9IHRoaXMuYWpheEFjdGlvbjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJkYXRhXCJdID0gSlNPTi5zdHJpbmdpZnkoZm9ybURhdGEpO1xuICAgICAgICBhamF4T3B0aW9uc1tcImNvbnRlbnRUeXBlXCJdID0gXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCI7XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVR5cGVcIl0gPSBcImpzb25cIjtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGpRdWVyeS5hamF4KGFqYXhPcHRpb25zKS5kb25lKFxuICAgICAgICAgICAgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAvL3NlbGYuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5yZW1vdmVDbGFzcyhcImxvYWRpbmdcIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0QnV0dG9uLmFkZENsYXNzKFwic2F2ZWRcIik7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbnN1Y2Nlc3MgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHIgPSBldmFsKHNlbGYub25zdWNjZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByKHRoaXMsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbiA9ICQoXCJidXR0b25bdHlwZT0nc3VibWl0J10sIGlucHV0W3R5cGU9J3N1Ym1pdCddXCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24uY2xpY2soZSA9PiB0aGlzLl9vbl9zdWJtaXRfY2xpY2soZSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveFwiLCB0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy5wcmVsb2FkKSB7XG4gICAgICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgalF1ZXJ5LmFqYXgodGhpcy5hamF4QWN0aW9uLCBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucylcbiAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2ZpbGxfZGF0YShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otYWpheC1mb3JtXCIsIENKQWpheEZvcm1FbGVtZW50KTsiLCJcblxuY2xhc3MgQ2pTY3JpcHRFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0gc2VsZi5pbm5lclRleHQ7XG4gICAgICAgICAgICBzZWxmLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBjb250ZW50KTtcbiAgICAgICAgICAgIGV2YWwoY29udGVudCk7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgICAgICAgICBzY3JpcHQudGV4dENvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgKi9cblxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1zY3JpcHRcIiwgQ2pTY3JpcHRFbGVtZW50KTsiXX0=
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakV4ZWNFbGVtZW50LmpzIiwiZG9jL0NqSGlnaGxpZ2h0RWxlbWVudC5qcyIsImZvcm0vQ0pGb3JtRWxlbWVudC5qcyIsImZvcm0vQ0pPcHRpb25zRWxlbWVudC5qcyIsInBhbmUvQ0pQYW5lRWxlbWVudC5qcyIsInRwbC9DSlJlbmRlcmVyLmpzIiwidHBsL0NKVHBsRWxlbWVudC5qcyIsInhlbGVtL0NKQWpheEZvcm1FbGVtZW50LmpzIiwieGVsZW0vQ0pTY3JpcHRFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29tcGpzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbmNsYXNzIGMge1xuXG5cbiAgICAvKipcbiAgICAgKiBIVFRQIENsaWVudCBmb3IgQWpheCBSZXF1ZXN0c1xuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB1cmxcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgc3RhdGljIHJlcSAodXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ0pfUmVxKHVybCk7XG4gICAgfVxuXG5cblxuXG5cbn0iLCJcbmNsYXNzIGNlIHtcblxuXG4gICAgc3RhdGljIF9nZXRFbGVtZW50QnlJZChpZCwgdHlwZSkge1xuICAgICAgICB2YXIgZWxlbSA9ICQoXCIjXCIgKyBpZClbMF07XG4gICAgICAgIGlmIChlbGVtID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IGZvdW5kXCI7XG4gICAgICAgIGlmICh0eXBlICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBpZiAoICEgZWxlbSBpbnN0YW5jZW9mIHR5cGUpXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IG9mIHR5cGUgXCIgKyB0eXBlO1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm5zIHtDSkZvcm1FbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBmb3JtKGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENKRm9ybUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtDakhpZ2hsaWdodEVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGhpZ2hsaWdodChpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDakhpZ2hsaWdodEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0NKUGFuZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHBhbmUoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pQYW5lRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgYW55KGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIH1cbn0iLCJcblxuY2xhc3MgQ0pfUmVxIHtcblxuICAgIGNvbnN0cnVjdG9yKHVybCkge1xuICAgICAgICB0aGlzLnJlcXVlc3QgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIGJvZHk6IG51bGwsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYm9keVxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICB3aXRoQm9keShib2R5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3QubWV0aG9kID09PSBcIkdFVFwiKVxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm1ldGhvZCA9IFwiUE9TVFwiO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShib2R5KSB8fCB0eXBlb2YgYm9keSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeShib2R5KTtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LmJvZHkgPSBib2R5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXQganNvbihmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIFwianNvblwiKVxuICAgIH1cblxuICAgIHNldCBwbGFpbihmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIG51bGwpXG4gICAgfVxuXG4gICAgc2V0IHN0cmVhbShmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIFwic3RyZWFtXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGZuXG4gICAgICogQHBhcmFtIGZpbHRlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VfcmVxdWVzdChmbiwgZmlsdGVyKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdC5zdWNjZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXIgPT09IFwianNvblwiKVxuICAgICAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgZm4oZGF0YSk7XG4gICAgICAgIH07XG4gICAgICAgICQuYWpheCh0aGlzLnJlcXVlc3QpO1xuICAgIH1cblxufSIsIlxuY2xhc3MgQ0pIdG1sRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmRlYnVnID0gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJkZWJ1Z1wiXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuZGVidWcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIExvZyBvdXRwdXQgKGlmIGRlYnVnIGlzIG9uKVxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqIEBwYXJhbSBwYXJhbTFcbiAgICAgKiBAcGFyYW0gcGFyYW0yXG4gICAgICovXG4gICAgX2xvZyhwYXJhbTEsIHBhcmFtMikge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZylcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMsIC4uLmFyZ3VtZW50cyk7XG4gICAgfVxuXG59IiwiY2xhc3MgQ29tcENvcmUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zID0ge1xuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhbGVydCAoXCJFcnJvciBleGVjdXRpbmcgZm9ybSByZXF1ZXN0LlwiKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVycm9yXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5hamF4T3B0aW9uc0h0bWwgPSB7XG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IGluc3RhbmNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wQ29yZSgpO1xuICAgIH1cblxuXG4gICAgZXZhbEF0dHIoYXR0clZhbHVlLCBldmVudCwgb3duZXJPYmopIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGF0dHJWYWx1ZSk7XG4gICAgICAgIGlmIChhdHRyVmFsdWUgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBldmFsKGF0dHJWYWx1ZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIm93bmVyXCIsIG93bmVyT2JqKTtcbiAgICAgICAgICAgIHZhciByZXQgPSBjb250ZXh0LmJpbmQob3duZXJPYmopKGV2ZW50KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmV0ICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIHJldHVybiByZXQuYmluZChvd25lck9iaikoZXZlbnQpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiBhdHRyVmFsdWUoZXZlbnQsIG93bmVyT2JqKTtcblxuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXZhbCBlcnJvcjpcIiwgYXR0clZhbHVlKVxuICAgICAgICB0aHJvdyBcIkNhbm5vdCBldmFsdWF0ZSBleHByZXNzaW9uIC0gc2VlIG91dHB1dFwiXG4gICAgfVxufVxuXG5cbiIsIlxuXG5jbGFzcyBDakV4ZWNFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlTm9kZSA9IHNlbGYucHJldmlvdXNFbGVtZW50U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGVOb2RlLnRhZ05hbWUgIT09IFwiUFJFXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcIkNhbm5vdCBmaW5kIHNpYmxpbmcgPHByZT4gbm9kZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvZGVOb2RlID0gY29kZU5vZGUucXVlcnlTZWxlY3RvcihcImNvZGVcIik7XG5cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJ0ZXh0Q29udGVudD1cIiwgY29kZU5vZGUudGV4dENvbnRlbnQpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbm5lckhUTUwgPSBjb2RlTm9kZS50ZXh0Q29udGVudDtcblxuICAgICAgICAgICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWV4ZWNcIiwgQ2pFeGVjRWxlbWVudCk7IiwiXG5cbmNsYXNzIENqSGlnaGxpZ2h0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuX2NvZGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5sYW5nID0gXCJodG1sXCJcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImxhbmdcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJsYW5nXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5sYW5nID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdGV4dCB0byBoaWdobGlnaHRcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSAgICAgdGhlIGNvZGUgdG8gaGlnaHRsaWdodFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlVHlwZSBUaGUgaGlnaGxpZ2h0ZXIgdG8gdXNlIChodG1sfHRleHR8anMpXG4gICAgICovXG4gICAgc2V0Q29kZShjb2RlLCBjb2RlVHlwZSkge1xuICAgICAgICBpZiAoY29kZVR5cGUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGNvZGVUeXBlID0gdGhpcy5sYW5nO1xuXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gY29kZTtcbiAgICAgICAgaWYgKHRoaXMuX2NvZGVFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9jb2RlRWxlbWVudC5pbm5lclRleHQgPSBjb2RlO1xuICAgICAgICAgICAgdGhpcy5fY29kZUVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb2RlVHlwZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImxvYWRcIikpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJjb250ZW50IHRvIGhpZ2hsaWdodFwiLCBjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQocHJlKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjb2RlXCIpO1xuICAgICAgICAgICAgICAgICAgICBwcmUuYXBwZW5kQ2hpbGQoY29kZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fY29kZUVsZW1lbnQgPSBjb2RlO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvZGUuY2xhc3NMaXN0LmFkZChzZWxmLmxhbmcpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLnN0eWxlLndoaXRlU3BhY2UgPSBcInByZVwiO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50LnRyaW0oKSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZS5pbm5lclRleHQgPSBjb250ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJsb2FkXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1oaWdobGlnaHRcIiwgQ2pIaWdobGlnaHRFbGVtZW50KTsiLCJcbmNsYXNzIENKRm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fc3VibWl0dGFibGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG51bGw7XG4gICAgICAgIHNlbGYgPSB0aGlzO1xuICAgIH1cblxuXG4gICAgZ2V0IGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERhdGEoKTtcbiAgICB9XG5cbiAgICBzZXQgZGF0YSh2YWx1ZSkge1xuICAgICAgICB0aGlzLnNldERhdGEodmFsdWUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJvbnN1Ym1pdFwiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIm9uc3VibWl0XCI6XG4gICAgICAgICAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nYXRoZXJfZm9ybV9kYXRhIChmb3JtLCBkYXRhT2JqKSB7XG4gICAgICAgIHN3aXRjaCAoZm9ybS50YWdOYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiSU5QVVRcIjpcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZvcm0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY2hlY2tib3hcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJhZGlvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybS5jaGVja2VkID09IHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gZm9ybS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiU0VMRUNUXCI6XG4gICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gJChmb3JtKS52YWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJURVhUQVJFQVwiOlxuICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9ICQoZm9ybSkudmFsKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWFkIHRoZSBjdXJyZW50bHkgdmFsdWVzIGZyb20gdGhlIGZvcm0gYW5kIHJldHVyblxuICAgICAqIG9iamVjdCBiYXNlZCBvbiB0aGUgZm9ybXMgbmFtZXNcbiAgICAgKlxuICAgICAqIEByZXR1cm4gb2JqZWN0XG4gICAgICovXG4gICAgZ2V0RGF0YSgpIHtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICB2YXIgZWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveCwgc2VsZWN0XCIsIHRoaXMpO1xuICAgICAgICBlbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9nYXRoZXJfZm9ybV9kYXRhKGUsIHJldCkpO1xuICAgICAgICB0aGlzLl9sb2coXCJnZXREYXRhKCk6XCIsIHJldCk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG5cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhT2JqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZmlsbF9mb3JtX3NpbmdsZShmb3JtLCBkYXRhT2JqKSB7XG4gICAgICAgIHZhciBmb3JtTmFtZSA9IGZvcm0ubmFtZTtcbiAgICAgICAgaWYgKGZvcm1OYW1lID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBmb3JtTmFtZSA9IGZvcm0uaWQ7XG5cbiAgICAgICAgc3dpdGNoIChmb3JtLnRhZ05hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJJTlBVVFwiOlxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZm9ybS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjaGVja2JveFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhT2JqW2Zvcm1OYW1lXSA9PSBmb3JtLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5jaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJTRUxFQ1RcIjpcbiAgICAgICAgICAgICAgICBmb3JtLnZhbHVlID0gZGF0YU9ialtmb3JtTmFtZV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiVEVYVEFSRUFcIjpcbiAgICAgICAgICAgICAgICBmb3JtLnZhbHVlID0gZGF0YU9ialtmb3JtTmFtZV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGZvcm0gZGF0YSBmcm9tIGV4dGVybmFsIGFuZCByZXJlbmRlciB0aGUgaW5wdXQgdmFsdWVzXG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKi9cbiAgICBzZXREYXRhKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fbG9nKFwic2V0RGF0YSgpXCIsIGRhdGEpO1xuICAgICAgICB2YXIgZWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveCwgc2VsZWN0XCIsIHRoaXMpO1xuICAgICAgICBlbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9maWxsX2Zvcm1fc2luZ2xlKGUsIGRhdGEpKTtcbiAgICB9XG5cbiAgICBfc3VibWl0KGUpIHtcbiAgICAgICAgdGhpcy5fbG9nKFwiX3N1Ym1pdChcIiwgZSwgXCIpOyBjYWxsaW5nOiBvbnN1Ym1pdD1cIiwgdGhpcy5jZl9vbnN1Ym1pdCk7XG4gICAgICAgIENvbXBDb3JlLmluc3RhbmNlLmV2YWxBdHRyKHRoaXMuY2Zfb25zdWJtaXQsIGUsIHRoaXMpO1xuICAgIH1cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFJlZ2lzdGVyIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9IHNlbGYucXVlcnlTZWxlY3RvcihcImZvcm1cIik7XG4gICAgICAgICAgICBpZiAoc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID0gc2VsZi5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uW3R5cGU9J3N1Ym1pdCddXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXQoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQub25zdWJtaXQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0KGUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWZvcm1cIiwgQ0pGb3JtRWxlbWVudCk7IiwiXG5jbGFzcyBDSk9wdGlvbnNFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5fc2VsZWN0RWxlbWVudElkID0gW107XG5cbiAgICB9XG5cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJmb3JcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJmb3JcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RFbGVtZW50SWQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICByZWZyZXNoKCkge1xuICAgICAgICB0aGlzLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHRoaXMuX29wdGlvbnMuZm9yRWFjaChpLCBlbGVtID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2xvZyhcImFkZFwiLCBpLCBlbGVtKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLnZhbHVlO1xuICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gZWxlbS50ZXh0O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHZhciB2YWwsIHRleHQgPSBlbGVtO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKTtcbiAgICAgICAgICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCB2YWwpO1xuICAgICAgICAgICAgb3B0aW9uLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbG9nKFwiY2otb2JqZWN0aW9uIGNvbm5lY3RlZCgpXCIpO1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIm11aFwiKTtcbiAgICAgICAgICAgIGlmIChzZWxmLnRleHRDb250ZW50LnRyaW0oKSAhPT0gXCJcIikge1xuXG4gICAgICAgICAgICAgICAgc2VsZi5fb3B0aW9ucyA9IEpTT04ucGFyc2Uoc2VsZi50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fbG9nKFwiTG9hZGluZyBvcHRpb25zIHByZXNldCBmcm9tIGpzb246XCIsIHNlbGYuX29wdGlvbnMpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgIHNlbGYucmVmcmVzaCgpO1xuICAgICAgICB9LCAxKTtcbiAgICB9XG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otb3B0aW9uc1wiLCBDSk9wdGlvbnNFbGVtZW50KTsiLCJcclxuY2xhc3MgQ0pQYW5lRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLl9zcmMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fc2hhZG93RG9tID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJzcmNcIiwgXCJzaGFkb3ctZG9tXCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxyXG5cclxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcclxuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcclxuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSBcInNyY1wiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3JjID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3JjICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9hZFVybCh0aGlzLl9zcmMpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzaGFkb3ctZG9tXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9sb2FkVXJsKHVybCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwibG9hZFwiLCB1cmwpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBqUXVlcnkuYWpheCh1cmwsIENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zSHRtbClcclxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUuaW5uZXJIVE1MID0gZGF0YVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgMSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXHJcbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoICEgc2VsZi5fc2hhZG93RG9tKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzZWxmLnRhcmdldE5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gc2VsZi5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5cclxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otcGFuZVwiLCBDSlBhbmVFbGVtZW50KTtcclxuIiwiXG5cbmNsYXNzIENKUmVuZGVyZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIENKUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgJHtyZWdbMl19ID0gJHtyZWdbMV19W2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAvL2N1ckNsb25lLnRleHRDb250ZW50ID0gdHBsTm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVySW50byhjdXJDbG9uZSwgc2NvcGUsIHRwbE5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9YDtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGdlbkNvZGUpO1xuICAgICAgICByZXR1cm4gZXZhbChnZW5Db2RlKTtcbiAgICB9XG5cbiAgICBldmFsVGV4dChzY29wZSwgdGV4dCkge1xuICAgICAgICAvL2xldCB0ZXh0V3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuXG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xce1xceyguKj8pXFx9XFx9L2csIGZ1bmN0aW9uKG1hdGNoLCBwMSkge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcbiAgICAgICAgICAgIGV2YWwoYF9fcmV0ID0gJHtwMX07YCk7XG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pXG4gICAgfVxuXG5cbiAgICByZWdpc3RlckNhbGxiYWNrcyh0YXJnZXROb2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgZXZlbnRBdHRyID0gdGFyZ2V0Tm9kZS5nZXRBdHRyaWJ1dGUoXCIoY2xpY2spXCIpO1xuICAgICAgICBpZiAoZXZlbnRBdHRyICE9PSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgY29kZSA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIGV2ZW50QXR0cik7XG4gICAgICAgICAgICB0YXJnZXROb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBlID0+IHtcbiAgICAgICAgICAgICAgICBldmFsKGNvZGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHRhcmdldE5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHBhcmFtIGN1clRlbXBsYXRlTm9kZSB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgcmVuZGVySW50byh0YXJnZXROb2RlLCBzY29wZSwgdHBsTm9kZSkge1xuICAgICAgICBpZih0eXBlb2YgdHBsTm9kZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdHBsTm9kZSA9IHRoaXMudGVtcGxhdGVEb207XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Tm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXROb2RlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgfVxuICAgICAgICAqL1xuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgbGV0IHRleHROb2RlID0gdHBsTm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB0ZXh0Tm9kZS50ZXh0Q29udGVudCA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIHRleHROb2RlLnRleHRDb250ZW50KTtcblxuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyh0cGxOb2RlKTtcblxuXG5cblxuICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKTtcblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImlmJFwiKSkge1xuICAgICAgICAgICAgaWYodGhpcy5ib29sRXZhbChzY29wZSwgdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJpZiRcIikpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSlRwbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgIH1cblxuXG4gICAgcmVsb2FkKCkge1xuICAgICAgICB2YXIgcmVuZGVyZXIgPSBuZXcgQ0pSZW5kZXJlcigpO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgcmVuZGVyZXIucmVuZGVySW50byh0aGlzLnRhcmdldE5vZGUsIHt9LCB0aGlzLnRlbXBsYXRlTm9kZSk7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFqYXgtc3JjXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJyZWFkeVwiKTtcbiAgICAgICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgICAgICBzZWxmLnRlbXBsYXRlTm9kZSA9IHNlbGYuZmlyc3RFbGVtZW50Q2hpbGQ7XG5cbiAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY29ubmVjdFwiLCBzZWxmLnRlbXBsYXRlTm9kZSk7XG4gICAgICAgICAgICAvL3RoaXMudGVtcGxhdGVOb2RlID0gdGhpcy5jb250ZW50LmNoaWxkTm9kZXNbMF0uY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHNlbGYudGFyZ2V0Tm9kZSwge2JsYWg6IFwibXVoXCJ9LCBzZWxmLnRlbXBsYXRlTm9kZSk7XG5cbiAgICAgICAgfSwgMSk7XG5cbiAgICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai10cGxcIiwgQ0pUcGxFbGVtZW50KTtcbiIsIlxuY2xhc3MgQ0pBamF4Rm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkZvcm1FbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25zdWNjZXNzID0gbnVsbDtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1hY3Rpb25cIiwgXCJwcmVsb2FkXCIsIFwib25zdWNjZXNzXCIsIC4uLkNKRm9ybUVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LWFjdGlvblwiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheEFjdGlvbiA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInByZWxvYWRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLnByZWxvYWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm9uc3VjY2Vzc1wiOlxuICAgICAgICAgICAgICAgIHRoaXMub25zdWNjZXNzID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgX29uX3N1Ym1pdF9jbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmFkZENsYXNzKFwibG9hZGluZ1wiKTtcblxuICAgICAgICBsZXQgZm9ybURhdGEgPSB7fTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9nYXRoZXJfZm9ybV9kYXRhKGUsIGZvcm1EYXRhKSk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIGxldCBhamF4T3B0aW9ucyA9IENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zO1xuICAgICAgICBhamF4T3B0aW9uc1tcIm1ldGhvZFwiXSA9IFwicG9zdFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcInVybFwiXSA9IHRoaXMuYWpheEFjdGlvbjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJkYXRhXCJdID0gSlNPTi5zdHJpbmdpZnkoZm9ybURhdGEpO1xuICAgICAgICBhamF4T3B0aW9uc1tcImNvbnRlbnRUeXBlXCJdID0gXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCI7XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVR5cGVcIl0gPSBcImpzb25cIjtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGpRdWVyeS5hamF4KGFqYXhPcHRpb25zKS5kb25lKFxuICAgICAgICAgICAgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAvL3NlbGYuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5yZW1vdmVDbGFzcyhcImxvYWRpbmdcIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0QnV0dG9uLmFkZENsYXNzKFwic2F2ZWRcIik7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbnN1Y2Nlc3MgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHIgPSBldmFsKHNlbGYub25zdWNjZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByKHRoaXMsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbiA9ICQoXCJidXR0b25bdHlwZT0nc3VibWl0J10sIGlucHV0W3R5cGU9J3N1Ym1pdCddXCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24uY2xpY2soZSA9PiB0aGlzLl9vbl9zdWJtaXRfY2xpY2soZSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveFwiLCB0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy5wcmVsb2FkKSB7XG4gICAgICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgalF1ZXJ5LmFqYXgodGhpcy5hamF4QWN0aW9uLCBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucylcbiAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2ZpbGxfZGF0YShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otYWpheC1mb3JtXCIsIENKQWpheEZvcm1FbGVtZW50KTsiLCJcblxuY2xhc3MgQ2pTY3JpcHRFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0gc2VsZi5pbm5lclRleHQ7XG4gICAgICAgICAgICBzZWxmLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBjb250ZW50KTtcbiAgICAgICAgICAgIGV2YWwoY29udGVudCk7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgICAgICAgICBzY3JpcHQudGV4dENvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgKi9cblxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1zY3JpcHRcIiwgQ2pTY3JpcHRFbGVtZW50KTsiXX0=