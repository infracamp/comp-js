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
                    self.targetNode.innerHTML = data;
                    var template = $("template", self.targetNode)[0];
                    var script = $("script", self.targetNode)[0].textContent;
                    console.log("node", template);
                    self.targetNode.appendChild(template.content);
                    var e = function(script) {
                        eval(script);
                    };
                    e.call(self.targetNode, script);
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
                console.log("with shadow");
                self.targetNode = self.attachShadow({mode: 'open'});
            }

        }, 1);
    }


}



customElements.define("cj-pane", CJPaneElement);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakV4ZWNFbGVtZW50LmpzIiwiZG9jL0NqSGlnaGxpZ2h0RWxlbWVudC5qcyIsImZvcm0vQ0pGb3JtRWxlbWVudC5qcyIsImZvcm0vQ0pPcHRpb25zRWxlbWVudC5qcyIsInBhbmUvQ0pQYW5lRWxlbWVudC5qcyIsInRpbWVyL0NKVGltZXIuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ4ZWxlbS9DSkFqYXhGb3JtRWxlbWVudC5qcyIsInhlbGVtL0NKU2NyaXB0RWxlbWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvbXBqcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5jbGFzcyBjIHtcblxuXG4gICAgLyoqXG4gICAgICogSFRUUCBDbGllbnQgZm9yIEFqYXggUmVxdWVzdHNcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gdXJsXG4gICAgICogQHJldHVybiB7Q0pfUmVxfVxuICAgICAqL1xuICAgIHN0YXRpYyByZXEgKHVybCkge1xuICAgICAgICByZXR1cm4gbmV3IENKX1JlcSh1cmwpO1xuICAgIH1cblxuXG5cblxuXG59IiwiXG5jbGFzcyBjZSB7XG5cblxuICAgIHN0YXRpYyBfZ2V0RWxlbWVudEJ5SWQoaWQsIHR5cGUpIHtcbiAgICAgICAgdmFyIGVsZW0gPSAkKFwiI1wiICsgaWQpWzBdO1xuICAgICAgICBpZiAoZWxlbSA9PT0gbnVsbClcbiAgICAgICAgICAgIHRocm93IFwiRWxlbWVudCAjXCIgKyBpZCArIFwiIG5vdCBmb3VuZFwiO1xuICAgICAgICBpZiAodHlwZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgaWYgKCAhIGVsZW0gaW5zdGFuY2VvZiB0eXBlKVxuICAgICAgICAgICAgICAgIHRocm93IFwiRWxlbWVudCAjXCIgKyBpZCArIFwiIG5vdCBvZiB0eXBlIFwiICsgdHlwZTtcbiAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJucyB7Q0pGb3JtRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgZm9ybShpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDSkZvcm1FbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybiB7Q2pIaWdobGlnaHRFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBoaWdobGlnaHQoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ2pIaWdobGlnaHRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtDSlBhbmVFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBwYW5lKGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENKUGFuZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGFueShpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkKTtcbiAgICB9XG59IiwiXG5cbmNsYXNzIENKX1JlcSB7XG5cbiAgICBjb25zdHJ1Y3Rvcih1cmwpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICBib2R5OiBudWxsLFxuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJ0ZXh0XCJcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGJvZHlcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgd2l0aEJvZHkoYm9keSkge1xuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0Lm1ldGhvZCA9PT0gXCJHRVRcIilcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5tZXRob2QgPSBcIlBPU1RcIjtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYm9keSkgfHwgdHlwZW9mIGJvZHkgPT09IFwib2JqZWN0XCIpXG4gICAgICAgICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keSk7XG4gICAgICAgIHRoaXMucmVxdWVzdC5ib2R5ID0gYm9keTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0IGpzb24oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBcImpzb25cIilcbiAgICB9XG5cbiAgICBzZXQgcGxhaW4oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBudWxsKVxuICAgIH1cblxuICAgIHNldCBzdHJlYW0oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBcInN0cmVhbVwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmblxuICAgICAqIEBwYXJhbSBmaWx0ZXJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlX3JlcXVlc3QoZm4sIGZpbHRlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3Quc3VjY2VzcyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVyID09PSBcImpzb25cIilcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGZuKGRhdGEpO1xuICAgICAgICB9O1xuICAgICAgICAkLmFqYXgodGhpcy5yZXF1ZXN0KTtcbiAgICB9XG5cbn0iLCJcbmNsYXNzIENKSHRtbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5kZWJ1ZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiZGVidWdcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiZGVidWdcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmRlYnVnID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBMb2cgb3V0cHV0IChpZiBkZWJ1ZyBpcyBvbilcbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKiBAcGFyYW0gcGFyYW0xXG4gICAgICogQHBhcmFtIHBhcmFtMlxuICAgICAqL1xuICAgIF9sb2cocGFyYW0xLCBwYXJhbTIpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLCAuLi5hcmd1bWVudHMpO1xuICAgIH1cblxufSIsImNsYXNzIENvbXBDb3JlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5hamF4T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuYWpheE9wdGlvbnNIdG1sID0ge1xuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhbGVydCAoXCJFcnJvciBleGVjdXRpbmcgZm9ybSByZXF1ZXN0LlwiKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVycm9yXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBpbnN0YW5jZSAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcENvcmUoKTtcbiAgICB9XG5cblxuICAgIGV2YWxBdHRyKGF0dHJWYWx1ZSwgZXZlbnQsIG93bmVyT2JqKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBhdHRyVmFsdWUpO1xuICAgICAgICBpZiAoYXR0clZhbHVlID09PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmICh0eXBlb2YgYXR0clZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXZhbChhdHRyVmFsdWUpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJvd25lclwiLCBvd25lck9iaik7XG4gICAgICAgICAgICB2YXIgcmV0ID0gY29udGV4dC5iaW5kKG93bmVyT2JqKShldmVudCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHJldCAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICByZXR1cm4gcmV0LmJpbmQob3duZXJPYmopKGV2ZW50KVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgYXR0clZhbHVlID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICByZXR1cm4gYXR0clZhbHVlKGV2ZW50LCBvd25lck9iaik7XG5cbiAgICAgICAgY29uc29sZS5lcnJvcihcImV2YWwgZXJyb3I6XCIsIGF0dHJWYWx1ZSlcbiAgICAgICAgdGhyb3cgXCJDYW5ub3QgZXZhbHVhdGUgZXhwcmVzc2lvbiAtIHNlZSBvdXRwdXRcIlxuICAgIH1cbn1cblxuXG4iLCJcblxuY2xhc3MgQ2pFeGVjRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29kZU5vZGUgPSBzZWxmLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2RlTm9kZS50YWdOYW1lICE9PSBcIlBSRVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJDYW5ub3QgZmluZCBzaWJsaW5nIDxwcmU+IG5vZGVcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb2RlTm9kZSA9IGNvZGVOb2RlLnF1ZXJ5U2VsZWN0b3IoXCJjb2RlXCIpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9nKFwidGV4dENvbnRlbnQ9XCIsIGNvZGVOb2RlLnRleHRDb250ZW50KTtcblxuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5uZXJIVE1MID0gY29kZU5vZGUudGV4dENvbnRlbnQ7XG5cbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1leGVjXCIsIENqRXhlY0VsZW1lbnQpOyIsIlxuXG5jbGFzcyBDakhpZ2hsaWdodEVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBcIlwiO1xuICAgICAgICB0aGlzLl9jb2RlRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMubGFuZyA9IFwiaHRtbFwiXG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJsYW5nXCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwibGFuZ1wiOlxuICAgICAgICAgICAgICAgIHRoaXMubGFuZyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHRleHQgdG8gaGlnaGxpZ2h0XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgIHRoZSBjb2RlIHRvIGhpZ2h0bGlnaHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVR5cGUgVGhlIGhpZ2hsaWdodGVyIHRvIHVzZSAoaHRtbHx0ZXh0fGpzKVxuICAgICAqL1xuICAgIHNldENvZGUoY29kZSwgY29kZVR5cGUpIHtcbiAgICAgICAgaWYgKGNvZGVUeXBlID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBjb2RlVHlwZSA9IHRoaXMubGFuZztcblxuICAgICAgICB0aGlzLl92YWx1ZSA9IGNvZGU7XG4gICAgICAgIGlmICh0aGlzLl9jb2RlRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fY29kZUVsZW1lbnQuaW5uZXJUZXh0ID0gY29kZTtcbiAgICAgICAgICAgIHRoaXMuX2NvZGVFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29kZVR5cGUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJsb2FkXCIpKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBzZWxmLmlubmVySFRNTDtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9nKFwiY29udGVudCB0byBoaWdobGlnaHRcIiwgY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoZGl2KTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKHByZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY29kZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlLmFwcGVuZENoaWxkKGNvZGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2NvZGVFbGVtZW50ID0gY29kZTtcblxuICAgICAgICAgICAgICAgICAgICBjb2RlLmNsYXNzTGlzdC5hZGQoc2VsZi5sYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgY29kZS5zdHlsZS53aGl0ZVNwYWNlID0gXCJwcmVcIjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudC50cmltKCkgIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUuaW5uZXJUZXh0ID0gY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwibG9hZFwiKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgfSwgMSk7XG4gICAgfVxuXG5cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otaGlnaGxpZ2h0XCIsIENqSGlnaGxpZ2h0RWxlbWVudCk7IiwiXG5jbGFzcyBDSkZvcm1FbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdHRhYmxlRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9IG51bGw7XG4gICAgICAgIHRoaXMuY2Zfb25zdWJtaXQgPSBudWxsO1xuICAgICAgICBzZWxmID0gdGhpcztcbiAgICB9XG5cblxuICAgIGdldCBkYXRhKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXREYXRhKCk7XG4gICAgfVxuXG4gICAgc2V0IGRhdGEodmFsdWUpIHtcbiAgICAgICAgdGhpcy5zZXREYXRhKHZhbHVlKTtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wib25zdWJtaXRcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJvbnN1Ym1pdFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuY2Zfb25zdWJtaXQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhT2JqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2F0aGVyX2Zvcm1fZGF0YSAoZm9ybSwgZGF0YU9iaikge1xuICAgICAgICBzd2l0Y2ggKGZvcm0udGFnTmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIklOUFVUXCI6XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmb3JtLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyYWRpb1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvcm0uY2hlY2tlZCA9PSB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9IGZvcm0udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIlNFTEVDVFwiOlxuICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9ICQoZm9ybSkudmFsKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiVEVYVEFSRUFcIjpcbiAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSAkKGZvcm0pLnZhbCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVhZCB0aGUgY3VycmVudGx5IHZhbHVlcyBmcm9tIHRoZSBmb3JtIGFuZCByZXR1cm5cbiAgICAgKiBvYmplY3QgYmFzZWQgb24gdGhlIGZvcm1zIG5hbWVzXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIG9iamVjdFxuICAgICAqL1xuICAgIGdldERhdGEoKSB7XG4gICAgICAgIHZhciByZXQgPSB7fTtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3gsIHNlbGVjdFwiLCB0aGlzKTtcbiAgICAgICAgZWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZ2F0aGVyX2Zvcm1fZGF0YShlLCByZXQpKTtcbiAgICAgICAgdGhpcy5fbG9nKFwiZ2V0RGF0YSgpOlwiLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YU9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2ZpbGxfZm9ybV9zaW5nbGUoZm9ybSwgZGF0YU9iaikge1xuICAgICAgICB2YXIgZm9ybU5hbWUgPSBmb3JtLm5hbWU7XG4gICAgICAgIGlmIChmb3JtTmFtZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgZm9ybU5hbWUgPSBmb3JtLmlkO1xuXG4gICAgICAgIHN3aXRjaCAoZm9ybS50YWdOYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiSU5QVVRcIjpcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZvcm0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY2hlY2tib3hcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJhZGlvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YU9ialtmb3JtTmFtZV0gPT0gZm9ybS52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0uY2hlY2tlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0uY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3JtLnZhbHVlID0gZGF0YU9ialtmb3JtTmFtZV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiU0VMRUNUXCI6XG4gICAgICAgICAgICAgICAgZm9ybS52YWx1ZSA9IGRhdGFPYmpbZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlRFWFRBUkVBXCI6XG4gICAgICAgICAgICAgICAgZm9ybS52YWx1ZSA9IGRhdGFPYmpbZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBmb3JtIGRhdGEgZnJvbSBleHRlcm5hbCBhbmQgcmVyZW5kZXIgdGhlIGlucHV0IHZhbHVlc1xuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgc2V0RGF0YShkYXRhKSB7XG4gICAgICAgIHRoaXMuX2xvZyhcInNldERhdGEoKVwiLCBkYXRhKTtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3gsIHNlbGVjdFwiLCB0aGlzKTtcbiAgICAgICAgZWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZmlsbF9mb3JtX3NpbmdsZShlLCBkYXRhKSk7XG4gICAgfVxuXG4gICAgX3N1Ym1pdChlKSB7XG4gICAgICAgIHRoaXMuX2xvZyhcIl9zdWJtaXQoXCIsIGUsIFwiKTsgY2FsbGluZzogb25zdWJtaXQ9XCIsIHRoaXMuY2Zfb25zdWJtaXQpO1xuICAgICAgICBDb21wQ29yZS5pbnN0YW5jZS5ldmFsQXR0cih0aGlzLmNmX29uc3VibWl0LCBlLCB0aGlzKTtcbiAgICB9XG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBSZWdpc3RlciBldmVudCBoYW5kbGVyXG4gICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJmb3JtXCIpO1xuICAgICAgICAgICAgaWYgKHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9IHNlbGYucXVlcnlTZWxlY3RvcihcImJ1dHRvblt0eXBlPSdzdWJtaXQnXVwiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQub25jbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0KGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uc3VibWl0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1mb3JtXCIsIENKRm9ybUVsZW1lbnQpOyIsIlxuY2xhc3MgQ0pPcHRpb25zRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9vcHRpb25zID0gW107XG4gICAgICAgIHRoaXMuX3NlbGVjdEVsZW1lbnRJZCA9IFtdO1xuXG4gICAgfVxuXG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiZm9yXCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiZm9yXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0RWxlbWVudElkID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgcmVmcmVzaCgpIHtcbiAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICB0aGlzLl9vcHRpb25zLmZvckVhY2goaSwgZWxlbSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9sb2coXCJhZGRcIiwgaSwgZWxlbSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW0gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gZWxlbS52YWx1ZTtcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IGVsZW0udGV4dDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsLCB0ZXh0ID0gZWxlbTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIik7XG4gICAgICAgICAgICBvcHRpb24uc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgdmFsKTtcbiAgICAgICAgICAgIG9wdGlvbi50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xvZyhcImNqLW9iamVjdGlvbiBjb25uZWN0ZWQoKVwiKTtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJtdWhcIik7XG4gICAgICAgICAgICBpZiAoc2VsZi50ZXh0Q29udGVudC50cmltKCkgIT09IFwiXCIpIHtcblxuICAgICAgICAgICAgICAgIHNlbGYuX29wdGlvbnMgPSBKU09OLnBhcnNlKHNlbGYudGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcIkxvYWRpbmcgb3B0aW9ucyBwcmVzZXQgZnJvbSBqc29uOlwiLCBzZWxmLl9vcHRpb25zKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICBzZWxmLnJlZnJlc2goKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLW9wdGlvbnNcIiwgQ0pPcHRpb25zRWxlbWVudCk7IiwiXHJcbmNsYXNzIENKUGFuZUVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcclxuXHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5fc3JjID0gbnVsbDtcclxuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX3NoYWRvd0RvbSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wic3JjXCIsIFwic2hhZG93LWRvbVwiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cclxuXHJcbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XHJcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzcmNcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NyYyA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NyYyAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvYWRVcmwodGhpcy5fc3JjKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwic2hhZG93LWRvbVwiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2hhZG93RG9tID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfbG9hZFVybCh1cmwpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImxvYWRcIiwgdXJsKTtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgalF1ZXJ5LmFqYXgodXJsLCBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9uc0h0bWwpXHJcbiAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlLmlubmVySFRNTCA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gJChcInRlbXBsYXRlXCIsIHNlbGYudGFyZ2V0Tm9kZSlbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjcmlwdCA9ICQoXCJzY3JpcHRcIiwgc2VsZi50YXJnZXROb2RlKVswXS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm5vZGVcIiwgdGVtcGxhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZSA9IGZ1bmN0aW9uKHNjcmlwdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmFsKHNjcmlwdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBlLmNhbGwoc2VsZi50YXJnZXROb2RlLCBzY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgMSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXHJcbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoICEgc2VsZi5fc2hhZG93RG9tKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzZWxmLnRhcmdldE5vZGUpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwid2l0aCBzaGFkb3dcIik7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBzZWxmLmF0dGFjaFNoYWRvdyh7bW9kZTogJ29wZW4nfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuXHJcblxyXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1wYW5lXCIsIENKUGFuZUVsZW1lbnQpO1xyXG4iLCJjbGFzcyBDSlRpbWVyRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9pbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2ludGVydmFsT2JqID0gbnVsbDtcbiAgICAgICAgdGhpcy50YXJnZXROb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdGltZW91dCA9IDE7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJpbnRlcnZhbFwiLCBcInRpbWVvdXRcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJpbnRlcnZhbFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX2ludGVydmFsID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ0aW1lb3V0XCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fdGltZW91dCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjbGVhckludGVydmFsKCkge1xuICAgICAgICBpZiAodGhpcy5faW50ZXJ2YWxPYmogIT09IG51bGwpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuX2ludGVydmFsT2JqKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIGNvbm5lY3RlZFwiKTtcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzZWxmLnRhcmdldE5vZGUpO1xuICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gJChcInRlbXBsYXRlXCIsIHNlbGYpWzBdLmNvbnRlbnQ7XG4gICAgICAgICAgICBpZiAoc2VsZi5faW50ZXJ2YWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9pbnRlcnZhbE9iaiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG15Tm9kZSA9IHNlbGYudGFyZ2V0Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG15Tm9kZS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBteU5vZGUucmVtb3ZlQ2hpbGQobXlOb2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYXBwZW5kXCIsIHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgbXlOb2RlLmFwcGVuZENoaWxkKHRlbXBsYXRlLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAgICAgICAgICAgfSwgc2VsZi5faW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBzZWxmLl90aW1lb3V0KTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGVhckludGVydmFsKCk7XG4gICAgfVxuXG59XG5cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai10aW1lclwiLCBDSlRpbWVyRWxlbWVudCk7XG4iLCJcblxuY2xhc3MgQ0pSZW5kZXJlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgQ0pSZW5kZXJlci5yZW5kZXJlciA9IHRoaXM7XG4gICAgfVxuXG4gICAgYm9vbEV2YWwoc2NvcGUsIGNvZGUpIHtcbiAgICAgICAgbGV0IHJldCA9ICgoc2NvcGUsIF9jb2RlKSA9PiB7XG4gICAgICAgICAgICBsZXQgX19yZXQgPSBudWxsO1xuXG4gICAgICAgICAgICBsZXQgZ2VuY29kZSA9IGBfX3JldCA9ICR7X2NvZGV9O2A7XG4gICAgICAgICAgICBldmFsKGdlbmNvZGUpO1xuXG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pKHNjb3BlLCBjb2RlKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBmb3JFdmFsKHNjb3BlLCBjb2RlLCB0YXJnZXROb2RlLCB0cGxOb2RlKSB7XG4gICAgICAgIGxldCByZWcgPSAvXihbYS16QS1aMC05Xy5cXFtcXF1dKylcXHMrYXNcXHMrKFthLXpBLVowLTlfLlxcW1xcXV0rKSQvLmV4ZWMoY29kZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlZyk7XG4gICAgICAgIGxldCBnZW5Db2RlID0gYFxuICAgICAgICAgICAgICAgIGZvcihsZXQgaW5kZXggPSAwOyBpbmRleCA8ICR7cmVnWzFdfS5sZW5ndGg7IGluZGV4Kyspe1xuICAgICAgICAgICAgICAgICAgICAke3JlZ1syXX0gPSAke3JlZ1sxXX1baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3VyQ2xvbmUgPSB0cGxOb2RlLmNsb25lTm9kZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vY3VyQ2xvbmUudGV4dENvbnRlbnQgPSB0cGxOb2RlLnRleHRDb250ZW50O1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXROb2RlLmFwcGVuZENoaWxkKGN1ckNsb25lKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1gO1xuICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgZ2VuQ29kZSk7XG4gICAgICAgIHJldHVybiBldmFsKGdlbkNvZGUpO1xuICAgIH1cblxuICAgIGV2YWxUZXh0KHNjb3BlLCB0ZXh0KSB7XG4gICAgICAgIC8vbGV0IHRleHRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG5cbiAgICAgICAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFx7XFx7KC4qPylcXH1cXH0vZywgZnVuY3Rpb24obWF0Y2gsIHAxKSB7XG4gICAgICAgICAgICBsZXQgX19yZXQgPSBudWxsO1xuICAgICAgICAgICAgZXZhbChgX19yZXQgPSAke3AxfTtgKTtcbiAgICAgICAgICAgIHJldHVybiBfX3JldDtcbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIHJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKSB7XG4gICAgICAgIGxldCBldmVudEF0dHIgPSB0YXJnZXROb2RlLmdldEF0dHJpYnV0ZShcIihjbGljaylcIik7XG4gICAgICAgIGlmIChldmVudEF0dHIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBjb2RlID0gdGhpcy5ldmFsVGV4dChzY29wZSwgZXZlbnRBdHRyKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGUgPT4ge1xuICAgICAgICAgICAgICAgIGV2YWwoY29kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gdGFyZ2V0Tm9kZSB7SFRNTEVsZW1lbnR9XG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKiBAcGFyYW0gY3VyVGVtcGxhdGVOb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICByZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlKSB7XG4gICAgICAgIGlmKHR5cGVvZiB0cGxOb2RlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0cGxOb2RlID0gdGhpcy50ZW1wbGF0ZURvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0YXJnZXROb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YXJnZXROb2RlLnJlbW92ZUNoaWxkKHRhcmdldE5vZGUuY2hpbGRyZW5baV0pO1xuICAgICAgICB9XG4gICAgICAgICovXG5cbiAgICAgICAgaWYgKHRwbE5vZGUgaW5zdGFuY2VvZiBIVE1MVGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jb250ZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRwbE5vZGUgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICBsZXQgdGV4dE5vZGUgPSB0cGxOb2RlLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIHRleHROb2RlLnRleHRDb250ZW50ID0gdGhpcy5ldmFsVGV4dChzY29wZSwgdGV4dE5vZGUudGV4dENvbnRlbnQpO1xuXG4gICAgICAgICAgICB0YXJnZXROb2RlLmFwcGVuZENoaWxkKHRleHROb2RlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKHRwbE5vZGUpO1xuXG5cblxuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFja3ModGFyZ2V0Tm9kZSwgc2NvcGUpO1xuXG4gICAgICAgIGlmKHRwbE5vZGUuaGFzQXR0cmlidXRlKFwiaWYkXCIpKSB7XG4gICAgICAgICAgICBpZih0aGlzLmJvb2xFdmFsKHNjb3BlLCB0cGxOb2RlLmdldEF0dHJpYnV0ZShcImlmJFwiKSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuXG4gICAgICAgIGlmKHRwbE5vZGUuaGFzQXR0cmlidXRlKFwiZm9yJFwiKSkge1xuICAgICAgICAgICAgLy8gQXBwZW5kIGZvcmVhY2ggZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBmb3JDb2RlID0gdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJmb3IkXCIpO1xuICAgICAgICAgICAgdGhpcy5mb3JFdmFsKHNjb3BlLCBmb3JDb2RlLCB0YXJnZXROb2RlLCB0cGxOb2RlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBjaGlsZCBlbGVtZW50c1xuICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG5cbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8oY3VyQ2xvbmUsIHNjb3BlLCB0cGxOb2RlLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGFyc2VOb2RlKG5vZGUsIHNjb3BlKSB7XG4gICAgICAgIGxldCB0cGxOb2RlID0gbm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBub2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGFyZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlLnRhZ05hbWUpO1xuICAgICAgICB0aGlzLnJlbmRlckludG8odGFyZ2V0LCBzY29wZSwgdHBsTm9kZSk7XG4gICAgICAgIG5vZGUucmVwbGFjZVdpdGgodGFyZ2V0KTtcbiAgICB9XG59IiwiXG5cbmNsYXNzIENKVHBsRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmFqYXhTcmMgPSBudWxsO1xuICAgICAgICB0aGlzLnRlbXBsYXRlTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgfVxuXG5cbiAgICByZWxvYWQoKSB7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMudGFyZ2V0Tm9kZSwge30sIHRoaXMudGVtcGxhdGVOb2RlKTtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1zcmNcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtc3JjXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4U3JjID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlYWR5XCIpO1xuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gbmV3IENKUmVuZGVyZXIoKTtcbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcblxuICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb25uZWN0XCIsIHNlbGYudGVtcGxhdGVOb2RlKTtcbiAgICAgICAgICAgIC8vdGhpcy50ZW1wbGF0ZU5vZGUgPSB0aGlzLmNvbnRlbnQuY2hpbGROb2Rlc1swXS5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbmRlckludG8oc2VsZi50YXJnZXROb2RlLCB7YmxhaDogXCJtdWhcIn0sIHNlbGYudGVtcGxhdGVOb2RlKTtcblxuICAgICAgICB9LCAxKTtcblxuICAgIH1cblxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLXRwbFwiLCBDSlRwbEVsZW1lbnQpO1xuIiwiXG5jbGFzcyBDSkFqYXhGb3JtRWxlbWVudCBleHRlbmRzIENKRm9ybUVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnByZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBudWxsO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJhamF4LWFjdGlvblwiLCBcInByZWxvYWRcIiwgXCJvbnN1Y2Nlc3NcIiwgLi4uQ0pGb3JtRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtYWN0aW9uXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwicHJlbG9hZFwiOlxuICAgICAgICAgICAgICAgIHRoaXMucHJlbG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwib25zdWNjZXNzXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBfb25fc3VibWl0X2NsaWNrKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24uYWRkQ2xhc3MoXCJsb2FkaW5nXCIpO1xuXG4gICAgICAgIGxldCBmb3JtRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveFwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoZSwgZm9ybURhdGEpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgbGV0IGFqYXhPcHRpb25zID0gQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnM7XG4gICAgICAgIGFqYXhPcHRpb25zW1wibWV0aG9kXCJdID0gXCJwb3N0XCI7XG4gICAgICAgIGFqYXhPcHRpb25zW1widXJsXCJdID0gdGhpcy5hamF4QWN0aW9uO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFcIl0gPSBKU09OLnN0cmluZ2lmeShmb3JtRGF0YSk7XG4gICAgICAgIGFqYXhPcHRpb25zW1wiY29udGVudFR5cGVcIl0gPSBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJkYXRhVHlwZVwiXSA9IFwianNvblwiO1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgalF1ZXJ5LmFqYXgoYWpheE9wdGlvbnMpLmRvbmUoXG4gICAgICAgICAgICBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fc3VibWl0QnV0dG9uLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0QnV0dG9uLnJlbW92ZUNsYXNzKFwibG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24uYWRkQ2xhc3MoXCJzYXZlZFwiKTtcbiAgICAgICAgICAgICAgICAvL3NlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uc3VjY2VzcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgciA9IGV2YWwoc2VsZi5vbnN1Y2Nlc3MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHIodGhpcywgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uID0gJChcImJ1dHRvblt0eXBlPSdzdWJtaXQnXSwgaW5wdXRbdHlwZT0nc3VibWl0J11cIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5jbGljayhlID0+IHRoaXMuX29uX3N1Ym1pdF9jbGljayhlKSk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLnByZWxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBqUXVlcnkuYWpheCh0aGlzLmFqYXhBY3Rpb24sIENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zKVxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZmlsbF9kYXRhKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1hamF4LWZvcm1cIiwgQ0pBamF4Rm9ybUVsZW1lbnQpOyIsIlxuXG5jbGFzcyBDalNjcmlwdEVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBzZWxmLmlubmVyVGV4dDtcbiAgICAgICAgICAgIHNlbGYudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGNvbnRlbnQpO1xuICAgICAgICAgICAgZXZhbChjb250ZW50KTtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgICAgIHNjcmlwdC50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICAqL1xuXG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLXNjcmlwdFwiLCBDalNjcmlwdEVsZW1lbnQpOyJdfQ==
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakV4ZWNFbGVtZW50LmpzIiwiZG9jL0NqSGlnaGxpZ2h0RWxlbWVudC5qcyIsImZvcm0vQ0pGb3JtRWxlbWVudC5qcyIsImZvcm0vQ0pPcHRpb25zRWxlbWVudC5qcyIsInBhbmUvQ0pQYW5lRWxlbWVudC5qcyIsInRpbWVyL0NKVGltZXIuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ4ZWxlbS9DSkFqYXhGb3JtRWxlbWVudC5qcyIsInhlbGVtL0NKU2NyaXB0RWxlbWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImNvbXBqcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5jbGFzcyBjIHtcblxuXG4gICAgLyoqXG4gICAgICogSFRUUCBDbGllbnQgZm9yIEFqYXggUmVxdWVzdHNcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gdXJsXG4gICAgICogQHJldHVybiB7Q0pfUmVxfVxuICAgICAqL1xuICAgIHN0YXRpYyByZXEgKHVybCkge1xuICAgICAgICByZXR1cm4gbmV3IENKX1JlcSh1cmwpO1xuICAgIH1cblxuXG5cblxuXG59IiwiXG5jbGFzcyBjZSB7XG5cblxuICAgIHN0YXRpYyBfZ2V0RWxlbWVudEJ5SWQoaWQsIHR5cGUpIHtcbiAgICAgICAgdmFyIGVsZW0gPSAkKFwiI1wiICsgaWQpWzBdO1xuICAgICAgICBpZiAoZWxlbSA9PT0gbnVsbClcbiAgICAgICAgICAgIHRocm93IFwiRWxlbWVudCAjXCIgKyBpZCArIFwiIG5vdCBmb3VuZFwiO1xuICAgICAgICBpZiAodHlwZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgaWYgKCAhIGVsZW0gaW5zdGFuY2VvZiB0eXBlKVxuICAgICAgICAgICAgICAgIHRocm93IFwiRWxlbWVudCAjXCIgKyBpZCArIFwiIG5vdCBvZiB0eXBlIFwiICsgdHlwZTtcbiAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJucyB7Q0pGb3JtRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgZm9ybShpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDSkZvcm1FbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybiB7Q2pIaWdobGlnaHRFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBoaWdobGlnaHQoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ2pIaWdobGlnaHRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtDSlBhbmVFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBwYW5lKGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENKUGFuZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGFueShpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkKTtcbiAgICB9XG59IiwiXG5cbmNsYXNzIENKX1JlcSB7XG5cbiAgICBjb25zdHJ1Y3Rvcih1cmwpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0ID0ge1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICBib2R5OiBudWxsLFxuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJ0ZXh0XCJcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGJvZHlcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgd2l0aEJvZHkoYm9keSkge1xuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0Lm1ldGhvZCA9PT0gXCJHRVRcIilcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5tZXRob2QgPSBcIlBPU1RcIjtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYm9keSkgfHwgdHlwZW9mIGJvZHkgPT09IFwib2JqZWN0XCIpXG4gICAgICAgICAgICBib2R5ID0gSlNPTi5zdHJpbmdpZnkoYm9keSk7XG4gICAgICAgIHRoaXMucmVxdWVzdC5ib2R5ID0gYm9keTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0IGpzb24oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBcImpzb25cIilcbiAgICB9XG5cbiAgICBzZXQgcGxhaW4oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBudWxsKVxuICAgIH1cblxuICAgIHNldCBzdHJlYW0oZm4pIHtcbiAgICAgICAgdGhpcy5fbWFrZV9yZXF1ZXN0KGZuLCBcInN0cmVhbVwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmblxuICAgICAqIEBwYXJhbSBmaWx0ZXJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9tYWtlX3JlcXVlc3QoZm4sIGZpbHRlcikge1xuICAgICAgICB0aGlzLnJlcXVlc3Quc3VjY2VzcyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVyID09PSBcImpzb25cIilcbiAgICAgICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGZuKGRhdGEpO1xuICAgICAgICB9O1xuICAgICAgICAkLmFqYXgodGhpcy5yZXF1ZXN0KTtcbiAgICB9XG5cbn0iLCJcbmNsYXNzIENKSHRtbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5kZWJ1ZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiZGVidWdcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiZGVidWdcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmRlYnVnID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBMb2cgb3V0cHV0IChpZiBkZWJ1ZyBpcyBvbilcbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKiBAcGFyYW0gcGFyYW0xXG4gICAgICogQHBhcmFtIHBhcmFtMlxuICAgICAqL1xuICAgIF9sb2cocGFyYW0xLCBwYXJhbTIpIHtcbiAgICAgICAgaWYgKHRoaXMuZGVidWcpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLCAuLi5hcmd1bWVudHMpO1xuICAgIH1cblxufSIsImNsYXNzIENvbXBDb3JlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5hamF4T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuYWpheE9wdGlvbnNIdG1sID0ge1xuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhbGVydCAoXCJFcnJvciBleGVjdXRpbmcgZm9ybSByZXF1ZXN0LlwiKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVycm9yXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBpbnN0YW5jZSAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcENvcmUoKTtcbiAgICB9XG5cblxuICAgIGV2YWxBdHRyKGF0dHJWYWx1ZSwgZXZlbnQsIG93bmVyT2JqKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBhdHRyVmFsdWUpO1xuICAgICAgICBpZiAoYXR0clZhbHVlID09PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGlmICh0eXBlb2YgYXR0clZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXZhbChhdHRyVmFsdWUpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJvd25lclwiLCBvd25lck9iaik7XG4gICAgICAgICAgICB2YXIgcmV0ID0gY29udGV4dC5iaW5kKG93bmVyT2JqKShldmVudCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHJldCAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICByZXR1cm4gcmV0LmJpbmQob3duZXJPYmopKGV2ZW50KVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgYXR0clZhbHVlID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICByZXR1cm4gYXR0clZhbHVlKGV2ZW50LCBvd25lck9iaik7XG5cbiAgICAgICAgY29uc29sZS5lcnJvcihcImV2YWwgZXJyb3I6XCIsIGF0dHJWYWx1ZSlcbiAgICAgICAgdGhyb3cgXCJDYW5ub3QgZXZhbHVhdGUgZXhwcmVzc2lvbiAtIHNlZSBvdXRwdXRcIlxuICAgIH1cbn1cblxuXG4iLCJcblxuY2xhc3MgQ2pFeGVjRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29kZU5vZGUgPSBzZWxmLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2RlTm9kZS50YWdOYW1lICE9PSBcIlBSRVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJDYW5ub3QgZmluZCBzaWJsaW5nIDxwcmU+IG5vZGVcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb2RlTm9kZSA9IGNvZGVOb2RlLnF1ZXJ5U2VsZWN0b3IoXCJjb2RlXCIpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9nKFwidGV4dENvbnRlbnQ9XCIsIGNvZGVOb2RlLnRleHRDb250ZW50KTtcblxuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5uZXJIVE1MID0gY29kZU5vZGUudGV4dENvbnRlbnQ7XG5cbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1leGVjXCIsIENqRXhlY0VsZW1lbnQpOyIsIlxuXG5jbGFzcyBDakhpZ2hsaWdodEVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBcIlwiO1xuICAgICAgICB0aGlzLl9jb2RlRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMubGFuZyA9IFwiaHRtbFwiXG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJsYW5nXCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwibGFuZ1wiOlxuICAgICAgICAgICAgICAgIHRoaXMubGFuZyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHRleHQgdG8gaGlnaGxpZ2h0XG4gICAgICpcbiAgICAgKiBAcHVibGljXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgICAgIHRoZSBjb2RlIHRvIGhpZ2h0bGlnaHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVR5cGUgVGhlIGhpZ2hsaWdodGVyIHRvIHVzZSAoaHRtbHx0ZXh0fGpzKVxuICAgICAqL1xuICAgIHNldENvZGUoY29kZSwgY29kZVR5cGUpIHtcbiAgICAgICAgaWYgKGNvZGVUeXBlID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBjb2RlVHlwZSA9IHRoaXMubGFuZztcblxuICAgICAgICB0aGlzLl92YWx1ZSA9IGNvZGU7XG4gICAgICAgIGlmICh0aGlzLl9jb2RlRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fY29kZUVsZW1lbnQuaW5uZXJUZXh0ID0gY29kZTtcbiAgICAgICAgICAgIHRoaXMuX2NvZGVFbGVtZW50LmNsYXNzTGlzdC5hZGQoY29kZVR5cGUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJsb2FkXCIpKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBzZWxmLmlubmVySFRNTDtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9nKFwiY29udGVudCB0byBoaWdobGlnaHRcIiwgY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoZGl2KTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKHByZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY29kZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgcHJlLmFwcGVuZENoaWxkKGNvZGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2NvZGVFbGVtZW50ID0gY29kZTtcblxuICAgICAgICAgICAgICAgICAgICBjb2RlLmNsYXNzTGlzdC5hZGQoc2VsZi5sYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgY29kZS5zdHlsZS53aGl0ZVNwYWNlID0gXCJwcmVcIjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY29udGVudC50cmltKCkgIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUuaW5uZXJUZXh0ID0gY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwibG9hZFwiKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgfSwgMSk7XG4gICAgfVxuXG5cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otaGlnaGxpZ2h0XCIsIENqSGlnaGxpZ2h0RWxlbWVudCk7IiwiXG5jbGFzcyBDSkZvcm1FbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdHRhYmxlRWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9IG51bGw7XG4gICAgICAgIHRoaXMuY2Zfb25zdWJtaXQgPSBudWxsO1xuICAgICAgICBzZWxmID0gdGhpcztcbiAgICB9XG5cblxuICAgIGdldCBkYXRhKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXREYXRhKCk7XG4gICAgfVxuXG4gICAgc2V0IGRhdGEodmFsdWUpIHtcbiAgICAgICAgdGhpcy5zZXREYXRhKHZhbHVlKTtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wib25zdWJtaXRcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJvbnN1Ym1pdFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuY2Zfb25zdWJtaXQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm9ybVxuICAgICAqIEBwYXJhbSBkYXRhT2JqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfZ2F0aGVyX2Zvcm1fZGF0YSAoZm9ybSwgZGF0YU9iaikge1xuICAgICAgICBzd2l0Y2ggKGZvcm0udGFnTmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIklOUFVUXCI6XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmb3JtLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyYWRpb1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvcm0uY2hlY2tlZCA9PSB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9IGZvcm0udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIlNFTEVDVFwiOlxuICAgICAgICAgICAgICAgIGRhdGFPYmpbZm9ybS5uYW1lXSA9ICQoZm9ybSkudmFsKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiVEVYVEFSRUFcIjpcbiAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSAkKGZvcm0pLnZhbCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVhZCB0aGUgY3VycmVudGx5IHZhbHVlcyBmcm9tIHRoZSBmb3JtIGFuZCByZXR1cm5cbiAgICAgKiBvYmplY3QgYmFzZWQgb24gdGhlIGZvcm1zIG5hbWVzXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIG9iamVjdFxuICAgICAqL1xuICAgIGdldERhdGEoKSB7XG4gICAgICAgIHZhciByZXQgPSB7fTtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3gsIHNlbGVjdFwiLCB0aGlzKTtcbiAgICAgICAgZWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZ2F0aGVyX2Zvcm1fZGF0YShlLCByZXQpKTtcbiAgICAgICAgdGhpcy5fbG9nKFwiZ2V0RGF0YSgpOlwiLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cblxuXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YU9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2ZpbGxfZm9ybV9zaW5nbGUoZm9ybSwgZGF0YU9iaikge1xuICAgICAgICB2YXIgZm9ybU5hbWUgPSBmb3JtLm5hbWU7XG4gICAgICAgIGlmIChmb3JtTmFtZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgZm9ybU5hbWUgPSBmb3JtLmlkO1xuXG4gICAgICAgIHN3aXRjaCAoZm9ybS50YWdOYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiSU5QVVRcIjpcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZvcm0udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY2hlY2tib3hcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJhZGlvXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YU9ialtmb3JtTmFtZV0gPT0gZm9ybS52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0uY2hlY2tlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0uY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3JtLnZhbHVlID0gZGF0YU9ialtmb3JtTmFtZV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiU0VMRUNUXCI6XG4gICAgICAgICAgICAgICAgZm9ybS52YWx1ZSA9IGRhdGFPYmpbZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlRFWFRBUkVBXCI6XG4gICAgICAgICAgICAgICAgZm9ybS52YWx1ZSA9IGRhdGFPYmpbZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBmb3JtIGRhdGEgZnJvbSBleHRlcm5hbCBhbmQgcmVyZW5kZXIgdGhlIGlucHV0IHZhbHVlc1xuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICovXG4gICAgc2V0RGF0YShkYXRhKSB7XG4gICAgICAgIHRoaXMuX2xvZyhcInNldERhdGEoKVwiLCBkYXRhKTtcbiAgICAgICAgdmFyIGVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3gsIHNlbGVjdFwiLCB0aGlzKTtcbiAgICAgICAgZWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZmlsbF9mb3JtX3NpbmdsZShlLCBkYXRhKSk7XG4gICAgfVxuXG4gICAgX3N1Ym1pdChlKSB7XG4gICAgICAgIHRoaXMuX2xvZyhcIl9zdWJtaXQoXCIsIGUsIFwiKTsgY2FsbGluZzogb25zdWJtaXQ9XCIsIHRoaXMuY2Zfb25zdWJtaXQpO1xuICAgICAgICBDb21wQ29yZS5pbnN0YW5jZS5ldmFsQXR0cih0aGlzLmNmX29uc3VibWl0LCBlLCB0aGlzKTtcbiAgICB9XG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBSZWdpc3RlciBldmVudCBoYW5kbGVyXG4gICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJmb3JtXCIpO1xuICAgICAgICAgICAgaWYgKHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudCA9IHNlbGYucXVlcnlTZWxlY3RvcihcImJ1dHRvblt0eXBlPSdzdWJtaXQnXVwiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQub25jbGljayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0KGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uc3VibWl0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1mb3JtXCIsIENKRm9ybUVsZW1lbnQpOyIsIlxuY2xhc3MgQ0pPcHRpb25zRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9vcHRpb25zID0gW107XG4gICAgICAgIHRoaXMuX3NlbGVjdEVsZW1lbnRJZCA9IFtdO1xuXG4gICAgfVxuXG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiZm9yXCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiZm9yXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0RWxlbWVudElkID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgcmVmcmVzaCgpIHtcbiAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICB0aGlzLl9vcHRpb25zLmZvckVhY2goaSwgZWxlbSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9sb2coXCJhZGRcIiwgaSwgZWxlbSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVsZW0gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gZWxlbS52YWx1ZTtcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IGVsZW0udGV4dDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsLCB0ZXh0ID0gZWxlbTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIik7XG4gICAgICAgICAgICBvcHRpb24uc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgdmFsKTtcbiAgICAgICAgICAgIG9wdGlvbi50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2xvZyhcImNqLW9iamVjdGlvbiBjb25uZWN0ZWQoKVwiKTtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJtdWhcIik7XG4gICAgICAgICAgICBpZiAoc2VsZi50ZXh0Q29udGVudC50cmltKCkgIT09IFwiXCIpIHtcblxuICAgICAgICAgICAgICAgIHNlbGYuX29wdGlvbnMgPSBKU09OLnBhcnNlKHNlbGYudGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcIkxvYWRpbmcgb3B0aW9ucyBwcmVzZXQgZnJvbSBqc29uOlwiLCBzZWxmLl9vcHRpb25zKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICBzZWxmLnJlZnJlc2goKTtcbiAgICAgICAgfSwgMSk7XG4gICAgfVxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLW9wdGlvbnNcIiwgQ0pPcHRpb25zRWxlbWVudCk7IiwiXHJcbmNsYXNzIENKUGFuZUVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcclxuXHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5fc3JjID0gbnVsbDtcclxuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX3NoYWRvd0RvbSA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wic3JjXCIsIFwic2hhZG93LWRvbVwiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cclxuXHJcbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XHJcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzcmNcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NyYyA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NyYyAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvYWRVcmwodGhpcy5fc3JjKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwic2hhZG93LWRvbVwiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2hhZG93RG9tID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfbG9hZFVybCh1cmwpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImxvYWRcIiwgdXJsKTtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgalF1ZXJ5LmFqYXgodXJsLCBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9uc0h0bWwpXHJcbiAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlLmlubmVySFRNTCA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gJChcInRlbXBsYXRlXCIsIHNlbGYudGFyZ2V0Tm9kZSlbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjcmlwdCA9ICQoXCJzY3JpcHRcIiwgc2VsZi50YXJnZXROb2RlKVswXS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm5vZGVcIiwgdGVtcGxhdGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZSA9IGZ1bmN0aW9uKHNjcmlwdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmFsKHNjcmlwdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBlLmNhbGwoc2VsZi50YXJnZXROb2RlLCBzY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgMSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXHJcbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoICEgc2VsZi5fc2hhZG93RG9tKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzZWxmLnRhcmdldE5vZGUpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwid2l0aCBzaGFkb3dcIik7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBzZWxmLmF0dGFjaFNoYWRvdyh7bW9kZTogJ29wZW4nfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwgMSk7XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuXHJcblxyXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1wYW5lXCIsIENKUGFuZUVsZW1lbnQpO1xyXG4iLCJjbGFzcyBDSlRpbWVyRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9pbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2ludGVydmFsT2JqID0gbnVsbDtcbiAgICAgICAgdGhpcy50YXJnZXROb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdGltZW91dCA9IDE7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJpbnRlcnZhbFwiLCBcInRpbWVvdXRcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJpbnRlcnZhbFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX2ludGVydmFsID0gbmV3VmFsdWU7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ0aW1lb3V0XCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fdGltZW91dCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjbGVhckludGVydmFsKCkge1xuICAgICAgICBpZiAodGhpcy5faW50ZXJ2YWxPYmogIT09IG51bGwpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuX2ludGVydmFsT2JqKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBjb25zb2xlLmxvZyhcIlRpbWVyIGNvbm5lY3RlZFwiKTtcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzZWxmLnRhcmdldE5vZGUpO1xuICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gJChcInRlbXBsYXRlXCIsIHNlbGYpWzBdLmNvbnRlbnQ7XG4gICAgICAgICAgICBpZiAoc2VsZi5faW50ZXJ2YWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9pbnRlcnZhbE9iaiA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG15Tm9kZSA9IHNlbGYudGFyZ2V0Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG15Tm9kZS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBteU5vZGUucmVtb3ZlQ2hpbGQobXlOb2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYXBwZW5kXCIsIHRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgbXlOb2RlLmFwcGVuZENoaWxkKHRlbXBsYXRlLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAgICAgICAgICAgfSwgc2VsZi5faW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBzZWxmLl90aW1lb3V0KTtcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGVhckludGVydmFsKCk7XG4gICAgfVxuXG59XG5cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai10aW1lclwiLCBDSlRpbWVyRWxlbWVudCk7XG4iLCJcblxuY2xhc3MgQ0pSZW5kZXJlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgQ0pSZW5kZXJlci5yZW5kZXJlciA9IHRoaXM7XG4gICAgfVxuXG4gICAgYm9vbEV2YWwoc2NvcGUsIGNvZGUpIHtcbiAgICAgICAgbGV0IHJldCA9ICgoc2NvcGUsIF9jb2RlKSA9PiB7XG4gICAgICAgICAgICBsZXQgX19yZXQgPSBudWxsO1xuXG4gICAgICAgICAgICBsZXQgZ2VuY29kZSA9IGBfX3JldCA9ICR7X2NvZGV9O2A7XG4gICAgICAgICAgICBldmFsKGdlbmNvZGUpO1xuXG4gICAgICAgICAgICByZXR1cm4gX19yZXQ7XG4gICAgICAgIH0pKHNjb3BlLCBjb2RlKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBmb3JFdmFsKHNjb3BlLCBjb2RlLCB0YXJnZXROb2RlLCB0cGxOb2RlKSB7XG4gICAgICAgIGxldCByZWcgPSAvXihbYS16QS1aMC05Xy5cXFtcXF1dKylcXHMrYXNcXHMrKFthLXpBLVowLTlfLlxcW1xcXV0rKSQvLmV4ZWMoY29kZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlZyk7XG4gICAgICAgIGxldCBnZW5Db2RlID0gYFxuICAgICAgICAgICAgICAgIGZvcihsZXQgaW5kZXggPSAwOyBpbmRleCA8ICR7cmVnWzFdfS5sZW5ndGg7IGluZGV4Kyspe1xuICAgICAgICAgICAgICAgICAgICAke3JlZ1syXX0gPSAke3JlZ1sxXX1baW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3VyQ2xvbmUgPSB0cGxOb2RlLmNsb25lTm9kZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vY3VyQ2xvbmUudGV4dENvbnRlbnQgPSB0cGxOb2RlLnRleHRDb250ZW50O1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXROb2RlLmFwcGVuZENoaWxkKGN1ckNsb25lKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1gO1xuICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgZ2VuQ29kZSk7XG4gICAgICAgIHJldHVybiBldmFsKGdlbkNvZGUpO1xuICAgIH1cblxuICAgIGV2YWxUZXh0KHNjb3BlLCB0ZXh0KSB7XG4gICAgICAgIC8vbGV0IHRleHRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG5cbiAgICAgICAgcmV0dXJuIHRleHQucmVwbGFjZSgvXFx7XFx7KC4qPylcXH1cXH0vZywgZnVuY3Rpb24obWF0Y2gsIHAxKSB7XG4gICAgICAgICAgICBsZXQgX19yZXQgPSBudWxsO1xuICAgICAgICAgICAgZXZhbChgX19yZXQgPSAke3AxfTtgKTtcbiAgICAgICAgICAgIHJldHVybiBfX3JldDtcbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIHJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKSB7XG4gICAgICAgIGxldCBldmVudEF0dHIgPSB0YXJnZXROb2RlLmdldEF0dHJpYnV0ZShcIihjbGljaylcIik7XG4gICAgICAgIGlmIChldmVudEF0dHIgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBjb2RlID0gdGhpcy5ldmFsVGV4dChzY29wZSwgZXZlbnRBdHRyKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGUgPT4ge1xuICAgICAgICAgICAgICAgIGV2YWwoY29kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gdGFyZ2V0Tm9kZSB7SFRNTEVsZW1lbnR9XG4gICAgICogQHBhcmFtIGRhdGFcbiAgICAgKiBAcGFyYW0gY3VyVGVtcGxhdGVOb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICByZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlKSB7XG4gICAgICAgIGlmKHR5cGVvZiB0cGxOb2RlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0cGxOb2RlID0gdGhpcy50ZW1wbGF0ZURvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0YXJnZXROb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YXJnZXROb2RlLnJlbW92ZUNoaWxkKHRhcmdldE5vZGUuY2hpbGRyZW5baV0pO1xuICAgICAgICB9XG4gICAgICAgICovXG5cbiAgICAgICAgaWYgKHRwbE5vZGUgaW5zdGFuY2VvZiBIVE1MVGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jb250ZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRwbE5vZGUgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICBsZXQgdGV4dE5vZGUgPSB0cGxOb2RlLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIHRleHROb2RlLnRleHRDb250ZW50ID0gdGhpcy5ldmFsVGV4dChzY29wZSwgdGV4dE5vZGUudGV4dENvbnRlbnQpO1xuXG4gICAgICAgICAgICB0YXJnZXROb2RlLmFwcGVuZENoaWxkKHRleHROb2RlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKHRwbE5vZGUpO1xuXG5cblxuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFja3ModGFyZ2V0Tm9kZSwgc2NvcGUpO1xuXG4gICAgICAgIGlmKHRwbE5vZGUuaGFzQXR0cmlidXRlKFwiaWYkXCIpKSB7XG4gICAgICAgICAgICBpZih0aGlzLmJvb2xFdmFsKHNjb3BlLCB0cGxOb2RlLmdldEF0dHJpYnV0ZShcImlmJFwiKSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuXG4gICAgICAgIGlmKHRwbE5vZGUuaGFzQXR0cmlidXRlKFwiZm9yJFwiKSkge1xuICAgICAgICAgICAgLy8gQXBwZW5kIGZvcmVhY2ggZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBmb3JDb2RlID0gdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJmb3IkXCIpO1xuICAgICAgICAgICAgdGhpcy5mb3JFdmFsKHNjb3BlLCBmb3JDb2RlLCB0YXJnZXROb2RlLCB0cGxOb2RlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBjaGlsZCBlbGVtZW50c1xuICAgICAgICAgICAgbGV0IGN1ckNsb25lID0gdHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZChjdXJDbG9uZSk7XG5cbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0cGxOb2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8oY3VyQ2xvbmUsIHNjb3BlLCB0cGxOb2RlLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcGFyc2VOb2RlKG5vZGUsIHNjb3BlKSB7XG4gICAgICAgIGxldCB0cGxOb2RlID0gbm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBub2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQobm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGFyZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlLnRhZ05hbWUpO1xuICAgICAgICB0aGlzLnJlbmRlckludG8odGFyZ2V0LCBzY29wZSwgdHBsTm9kZSk7XG4gICAgICAgIG5vZGUucmVwbGFjZVdpdGgodGFyZ2V0KTtcbiAgICB9XG59IiwiXG5cbmNsYXNzIENKVHBsRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmFqYXhTcmMgPSBudWxsO1xuICAgICAgICB0aGlzLnRlbXBsYXRlTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgfVxuXG5cbiAgICByZWxvYWQoKSB7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMudGFyZ2V0Tm9kZSwge30sIHRoaXMudGVtcGxhdGVOb2RlKTtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1zcmNcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtc3JjXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4U3JjID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlYWR5XCIpO1xuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gbmV3IENKUmVuZGVyZXIoKTtcbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcblxuICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb25uZWN0XCIsIHNlbGYudGVtcGxhdGVOb2RlKTtcbiAgICAgICAgICAgIC8vdGhpcy50ZW1wbGF0ZU5vZGUgPSB0aGlzLmNvbnRlbnQuY2hpbGROb2Rlc1swXS5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbmRlckludG8oc2VsZi50YXJnZXROb2RlLCB7YmxhaDogXCJtdWhcIn0sIHNlbGYudGVtcGxhdGVOb2RlKTtcblxuICAgICAgICB9LCAxKTtcblxuICAgIH1cblxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLXRwbFwiLCBDSlRwbEVsZW1lbnQpO1xuIiwiXG5jbGFzcyBDSkFqYXhGb3JtRWxlbWVudCBleHRlbmRzIENKRm9ybUVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnByZWxvYWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBudWxsO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJhamF4LWFjdGlvblwiLCBcInByZWxvYWRcIiwgXCJvbnN1Y2Nlc3NcIiwgLi4uQ0pGb3JtRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImFqYXgtYWN0aW9uXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwicHJlbG9hZFwiOlxuICAgICAgICAgICAgICAgIHRoaXMucHJlbG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwib25zdWNjZXNzXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBfb25fc3VibWl0X2NsaWNrKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24uYWRkQ2xhc3MoXCJsb2FkaW5nXCIpO1xuXG4gICAgICAgIGxldCBmb3JtRGF0YSA9IHt9O1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveFwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoZSwgZm9ybURhdGEpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgbGV0IGFqYXhPcHRpb25zID0gQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnM7XG4gICAgICAgIGFqYXhPcHRpb25zW1wibWV0aG9kXCJdID0gXCJwb3N0XCI7XG4gICAgICAgIGFqYXhPcHRpb25zW1widXJsXCJdID0gdGhpcy5hamF4QWN0aW9uO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFcIl0gPSBKU09OLnN0cmluZ2lmeShmb3JtRGF0YSk7XG4gICAgICAgIGFqYXhPcHRpb25zW1wiY29udGVudFR5cGVcIl0gPSBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJkYXRhVHlwZVwiXSA9IFwianNvblwiO1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgalF1ZXJ5LmFqYXgoYWpheE9wdGlvbnMpLmRvbmUoXG4gICAgICAgICAgICBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fc3VibWl0QnV0dG9uLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0QnV0dG9uLnJlbW92ZUNsYXNzKFwibG9hZGluZ1wiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24uYWRkQ2xhc3MoXCJzYXZlZFwiKTtcbiAgICAgICAgICAgICAgICAvL3NlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLm9uc3VjY2VzcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgciA9IGV2YWwoc2VsZi5vbnN1Y2Nlc3MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHIgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHIodGhpcywgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uID0gJChcImJ1dHRvblt0eXBlPSdzdWJtaXQnXSwgaW5wdXRbdHlwZT0nc3VibWl0J11cIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5jbGljayhlID0+IHRoaXMuX29uX3N1Ym1pdF9jbGljayhlKSk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLnByZWxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBqUXVlcnkuYWpheCh0aGlzLmFqYXhBY3Rpb24sIENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zKVxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZmlsbF9kYXRhKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1hamF4LWZvcm1cIiwgQ0pBamF4Rm9ybUVsZW1lbnQpOyIsIlxuXG5jbGFzcyBDalNjcmlwdEVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBzZWxmLmlubmVyVGV4dDtcbiAgICAgICAgICAgIHNlbGYudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGNvbnRlbnQpO1xuICAgICAgICAgICAgZXZhbChjb250ZW50KTtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgICAgIHNjcmlwdC50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICAgICAgICAqL1xuXG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLXNjcmlwdFwiLCBDalNjcmlwdEVsZW1lbnQpOyJdfQ==