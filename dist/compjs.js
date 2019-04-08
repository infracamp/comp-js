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


                    setTimeout(function() {
                        $("script", self).each(function(idx, node) {
                            eval(node.textContent);
                        })
                    },1);


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
                    var ${reg[2]} = ${reg[1]}[index];
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

        ((e, a) => {
            console.log(targetNode);
        })(e,a);

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

/**
 *
 * @param {Node} source
 * @param {Node} target
 * @param scope
 */
function cj_render(source, target, scope) {

    var func = {

        "for$": (_r_source, _r_target, _r_expr) => {
            var ____eval = 'for (' + _r_expr + ") { ____renderFn(_r_source, _r_target, true); };";
            try {
                eval(____eval);
            } catch (_e) {
                throw `Error in statement for$='${_r_expr}': ` + _e;
            }
            return false;
        },
        "each$": (_r_source, _r_target, _r_expr) => {
            var ____matches = _r_expr.match(/^(.*?) as (.*?)(\=\>(.*?))$/);
            console.log(____matches);
            if (____matches.length == 5) {
                var ____eval = `for (${____matches[2]} in ${____matches[1]}) { ${____matches[4]} = ${____matches[1]}[${____matches[2]}]; ____renderFn(_r_source, _r_target, true); };`;
            } else {
                throw `Invalid each$='${_r_expr}' syntax.`;
            }
            console.log(____eval);
            eval(____eval);
            return false;
        },
        "if$": (_r_source, _r_target, _r_expr) => {
            var _____eval = 'if (' + _r_expr + ") { ____renderFn(_r_source, _r_target, true); };";
            eval(_____eval);
            return false;
        },
        "__eval__": (_r_input) => {
            _r_input = _r_input.replace(/\{\{(.*?)\}\}/g, (match, contents) => {
                try {
                    return eval(contents);
                } catch (_e) {
                    throw `Èrror in inline statement ${match} in text block '${_r_input}': ` + _e;
                }
            });
            return _r_input;
        }
    };

    /**
     * These functions are applied after the result Node was created (after the loop)
     *
     * @type {{class$: (function(*, *, *=, *): boolean)}}
     */
    var modifiers = {
        "class$": (_r_source, _r_target, _r_expr, _r_resultNode) => {
            eval("var _r_expr = " + _r_expr);
            for (__curClassName in _r_expr) {
                if (_r_expr[__curClassName]) {
                    _r_resultNode.classList.add(__curClassName);
                }
            }
            return true;
        }
    };

    var ____renderFn = (source, target, noParseAttrs) => {
        console.log ("node type", source.nodeType);
        if (source.nodeType === 1) {
            console.log("walk", source, target)

            var newTarget = source.cloneNode(false);
            if ( ! noParseAttrs) {
                for (curFunc in func) {
                    if (source.hasAttribute(curFunc)) {
                        console.log(curFunc, source, target);
                        var ret = func[curFunc](source, target, source.getAttribute(curFunc), newTarget);
                        if (ret === false)
                            return;
                    }
                }
            }

            for (curFunc in modifiers) {
                if (source.hasAttribute(curFunc)) {
                    console.log(curFunc, source, target);
                    var ret = modifiers[curFunc](source, target, source.getAttribute(curFunc), newTarget);
                    if (ret === false)
                        return;
                }
            }

            target.appendChild(newTarget);

            for (var i1 = 0; i1 < source.childNodes.length; i1++) {
                var curSource1 = source.childNodes[i1];


                // Render content nodes into previous target.
                ____renderFn(curSource1, newTarget);
            }
        } else if (source.nodeType === 3) {
            var _new_elem = source.cloneNode(false);
            _new_elem.textContent = func.__eval__(_new_elem.textContent);
            target.appendChild(_new_elem);
        } else {
            //if ()
            console.log ("normal node", source, target);
            target.appendChild(source.cloneNode(false));
            return;
        }
    };
    // @todo check if it is a template node and use contentElements

    // Walk all childs
    for (var i = 0; i < source.childNodes.length; i++) {
        var curSource = source.childNodes[i];
        // Render content nodes into previous target.
        ____renderFn(curSource, target);
    }
}

class TplNode {

}






function __compiled_tplx(scope, _cur_node) {
    for (var wurst in scope.a) {
        _cur_node.appendChild(document.createElement("div"))
    }
}



class TplCompiler {

    constructor() {
        this.attrs = {
            "for$": function (tplNode) {

            }
        }
    }




    compile(node) {


        node.getAttrib


    }


}

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakV4ZWNFbGVtZW50LmpzIiwiZG9jL0NqSGlnaGxpZ2h0RWxlbWVudC5qcyIsImZvcm0vQ0pGb3JtRWxlbWVudC5qcyIsImZvcm0vQ0pPcHRpb25zRWxlbWVudC5qcyIsInBhbmUvQ0pQYW5lRWxlbWVudC5qcyIsInRpbWVyL0NKVGltZXIuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ0cGwvVGVtcGxhdGUuanMiLCJ0cGwvVHBsQ29tcGlsZXIuanMiLCJ4ZWxlbS9DSkFqYXhGb3JtRWxlbWVudC5qcyIsInhlbGVtL0NKU2NyaXB0RWxlbWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb21wanMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuY2xhc3MgYyB7XG5cblxuICAgIC8qKlxuICAgICAqIEhUVFAgQ2xpZW50IGZvciBBamF4IFJlcXVlc3RzXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHVybFxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxICh1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDSl9SZXEodXJsKTtcbiAgICB9XG5cblxuXG5cblxufSIsIlxuY2xhc3MgY2Uge1xuXG5cbiAgICBzdGF0aWMgX2dldEVsZW1lbnRCeUlkKGlkLCB0eXBlKSB7XG4gICAgICAgIHZhciBlbGVtID0gJChcIiNcIiArIGlkKVswXTtcbiAgICAgICAgaWYgKGVsZW0gPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBcIkVsZW1lbnQgI1wiICsgaWQgKyBcIiBub3QgZm91bmRcIjtcbiAgICAgICAgaWYgKHR5cGUgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGlmICggISBlbGVtIGluc3RhbmNlb2YgdHlwZSlcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVsZW1lbnQgI1wiICsgaWQgKyBcIiBub3Qgb2YgdHlwZSBcIiArIHR5cGU7XG4gICAgICAgIHJldHVybiBlbGVtO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybnMge0NKRm9ybUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGZvcm0oaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pGb3JtRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0NqSGlnaGxpZ2h0RWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgaGlnaGxpZ2h0KGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENqSGlnaGxpZ2h0RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybiB7Q0pQYW5lRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFuZShpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDSlBhbmVFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBhbnkoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSl9SZXEge1xuXG4gICAgY29uc3RydWN0b3IodXJsKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgYm9keTogbnVsbCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwidGV4dFwiXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBib2R5XG4gICAgICogQHJldHVybiB7Q0pfUmVxfVxuICAgICAqL1xuICAgIHdpdGhCb2R5KGJvZHkpIHtcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5tZXRob2QgPT09IFwiR0VUXCIpXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QubWV0aG9kID0gXCJQT1NUXCI7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGJvZHkpIHx8IHR5cGVvZiBib2R5ID09PSBcIm9iamVjdFwiKVxuICAgICAgICAgICAgYm9keSA9IEpTT04uc3RyaW5naWZ5KGJvZHkpO1xuICAgICAgICB0aGlzLnJlcXVlc3QuYm9keSA9IGJvZHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldCBqc29uKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgXCJqc29uXCIpXG4gICAgfVxuXG4gICAgc2V0IHBsYWluKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgbnVsbClcbiAgICB9XG5cbiAgICBzZXQgc3RyZWFtKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgXCJzdHJlYW1cIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm5cbiAgICAgKiBAcGFyYW0gZmlsdGVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZV9yZXF1ZXN0KGZuLCBmaWx0ZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKGZpbHRlciA9PT0gXCJqc29uXCIpXG4gICAgICAgICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICBmbihkYXRhKTtcbiAgICAgICAgfTtcbiAgICAgICAgJC5hamF4KHRoaXMucmVxdWVzdCk7XG4gICAgfVxuXG59IiwiXG5jbGFzcyBDSkh0bWxFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZGVidWcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImRlYnVnXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImRlYnVnXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5kZWJ1ZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogTG9nIG91dHB1dCAoaWYgZGVidWcgaXMgb24pXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICogQHBhcmFtIHBhcmFtMVxuICAgICAqIEBwYXJhbSBwYXJhbTJcbiAgICAgKi9cbiAgICBfbG9nKHBhcmFtMSwgcGFyYW0yKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKVxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcywgLi4uYXJndW1lbnRzKTtcbiAgICB9XG5cbn0iLCJjbGFzcyBDb21wQ29yZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYWpheE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zSHRtbCA9IHtcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgaW5zdGFuY2UgKCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBDb3JlKCk7XG4gICAgfVxuXG5cbiAgICBldmFsQXR0cihhdHRyVmFsdWUsIGV2ZW50LCBvd25lck9iaikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgYXR0clZhbHVlKTtcbiAgICAgICAgaWYgKGF0dHJWYWx1ZSA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBpZiAodHlwZW9mIGF0dHJWYWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWwoYXR0clZhbHVlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwib3duZXJcIiwgb3duZXJPYmopO1xuICAgICAgICAgICAgdmFyIHJldCA9IGNvbnRleHQuYmluZChvd25lck9iaikoZXZlbnQpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXQgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgcmV0dXJuIHJldC5iaW5kKG93bmVyT2JqKShldmVudClcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGF0dHJWYWx1ZSA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgcmV0dXJuIGF0dHJWYWx1ZShldmVudCwgb3duZXJPYmopO1xuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJldmFsIGVycm9yOlwiLCBhdHRyVmFsdWUpXG4gICAgICAgIHRocm93IFwiQ2Fubm90IGV2YWx1YXRlIGV4cHJlc3Npb24gLSBzZWUgb3V0cHV0XCJcbiAgICB9XG59XG5cblxuIiwiXG5cbmNsYXNzIENqRXhlY0VsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGVOb2RlID0gc2VsZi5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29kZU5vZGUudGFnTmFtZSAhPT0gXCJQUkVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9nKFwiQ2Fubm90IGZpbmQgc2libGluZyA8cHJlPiBub2RlXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29kZU5vZGUgPSBjb2RlTm9kZS5xdWVyeVNlbGVjdG9yKFwiY29kZVwiKTtcblxuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcInRleHRDb250ZW50PVwiLCBjb2RlTm9kZS50ZXh0Q29udGVudCk7XG5cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmlubmVySFRNTCA9IGNvZGVOb2RlLnRleHRDb250ZW50O1xuXG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCJzY3JpcHRcIiwgc2VsZikuZWFjaChmdW5jdGlvbihpZHgsIG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmFsKG5vZGUudGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfSwxKTtcblxuXG4gICAgICAgICAgICAgICAgfSwgMSk7XG4gICAgfVxuXG5cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otZXhlY1wiLCBDakV4ZWNFbGVtZW50KTsiLCJcblxuY2xhc3MgQ2pIaWdobGlnaHRFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gXCJcIjtcbiAgICAgICAgdGhpcy5fY29kZUVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmxhbmcgPSBcImh0bWxcIlxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wibGFuZ1wiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImxhbmdcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmcgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB0ZXh0IHRvIGhpZ2hsaWdodFxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlICAgICB0aGUgY29kZSB0byBoaWdodGxpZ2h0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVUeXBlIFRoZSBoaWdobGlnaHRlciB0byB1c2UgKGh0bWx8dGV4dHxqcylcbiAgICAgKi9cbiAgICBzZXRDb2RlKGNvZGUsIGNvZGVUeXBlKSB7XG4gICAgICAgIGlmIChjb2RlVHlwZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgY29kZVR5cGUgPSB0aGlzLmxhbmc7XG5cbiAgICAgICAgdGhpcy5fdmFsdWUgPSBjb2RlO1xuICAgICAgICBpZiAodGhpcy5fY29kZUVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvZGVFbGVtZW50LmlubmVyVGV4dCA9IGNvZGU7XG4gICAgICAgICAgICB0aGlzLl9jb2RlRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvZGVUeXBlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwibG9hZFwiKSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gc2VsZi5pbm5lckhUTUw7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcImNvbnRlbnQgdG8gaGlnaGxpZ2h0XCIsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKGRpdik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChwcmUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNvZGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHByZS5hcHBlbmRDaGlsZChjb2RlKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9jb2RlRWxlbWVudCA9IGNvZGU7XG5cbiAgICAgICAgICAgICAgICAgICAgY29kZS5jbGFzc0xpc3QuYWRkKHNlbGYubGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIGNvZGUuc3R5bGUud2hpdGVTcGFjZSA9IFwicHJlXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQudHJpbSgpICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlLmlubmVyVGV4dCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImxvYWRcIikpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWhpZ2hsaWdodFwiLCBDakhpZ2hsaWdodEVsZW1lbnQpOyIsIlxuY2xhc3MgQ0pGb3JtRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSBudWxsO1xuICAgICAgICB0aGlzLmNmX29uc3VibWl0ID0gbnVsbDtcbiAgICAgICAgc2VsZiA9IHRoaXM7XG4gICAgfVxuXG5cbiAgICBnZXQgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGF0YSgpO1xuICAgIH1cblxuICAgIHNldCBkYXRhKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuc2V0RGF0YSh2YWx1ZSk7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcIm9uc3VibWl0XCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwib25zdWJtaXRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmNmX29uc3VibWl0ID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YU9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dhdGhlcl9mb3JtX2RhdGEgKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgc3dpdGNoIChmb3JtLnRhZ05hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJJTlBVVFwiOlxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZm9ybS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjaGVja2JveFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3JtLmNoZWNrZWQgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSBmb3JtLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJTRUxFQ1RcIjpcbiAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSAkKGZvcm0pLnZhbCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlRFWFRBUkVBXCI6XG4gICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gJChmb3JtKS52YWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGN1cnJlbnRseSB2YWx1ZXMgZnJvbSB0aGUgZm9ybSBhbmQgcmV0dXJuXG4gICAgICogb2JqZWN0IGJhc2VkIG9uIHRoZSBmb3JtcyBuYW1lc1xuICAgICAqXG4gICAgICogQHJldHVybiBvYmplY3RcbiAgICAgKi9cbiAgICBnZXREYXRhKCkge1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94LCBzZWxlY3RcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoZSwgcmV0KSk7XG4gICAgICAgIHRoaXMuX2xvZyhcImdldERhdGEoKTpcIiwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cblxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWxsX2Zvcm1fc2luZ2xlKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgdmFyIGZvcm1OYW1lID0gZm9ybS5uYW1lO1xuICAgICAgICBpZiAoZm9ybU5hbWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGZvcm1OYW1lID0gZm9ybS5pZDtcblxuICAgICAgICBzd2l0Y2ggKGZvcm0udGFnTmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIklOUFVUXCI6XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmb3JtLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyYWRpb1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFPYmpbZm9ybU5hbWVdID09IGZvcm0udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9ybS52YWx1ZSA9IGRhdGFPYmpbZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlNFTEVDVFwiOlxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJURVhUQVJFQVwiOlxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgZm9ybSBkYXRhIGZyb20gZXh0ZXJuYWwgYW5kIHJlcmVuZGVyIHRoZSBpbnB1dCB2YWx1ZXNcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIHNldERhdGEoZGF0YSkge1xuICAgICAgICB0aGlzLl9sb2coXCJzZXREYXRhKClcIiwgZGF0YSk7XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94LCBzZWxlY3RcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2ZpbGxfZm9ybV9zaW5nbGUoZSwgZGF0YSkpO1xuICAgIH1cblxuICAgIF9zdWJtaXQoZSkge1xuICAgICAgICB0aGlzLl9sb2coXCJfc3VibWl0KFwiLCBlLCBcIik7IGNhbGxpbmc6IG9uc3VibWl0PVwiLCB0aGlzLmNmX29uc3VibWl0KTtcbiAgICAgICAgQ29tcENvcmUuaW5zdGFuY2UuZXZhbEF0dHIodGhpcy5jZl9vbnN1Ym1pdCwgZSwgdGhpcyk7XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gUmVnaXN0ZXIgZXZlbnQgaGFuZGxlclxuICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID0gc2VsZi5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKTtcbiAgICAgICAgICAgIGlmIChzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJidXR0b25bdHlwZT0nc3VibWl0J11cIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudC5vbnN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXQoZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otZm9ybVwiLCBDSkZvcm1FbGVtZW50KTsiLCJcbmNsYXNzIENKT3B0aW9uc0VsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9zZWxlY3RFbGVtZW50SWQgPSBbXTtcblxuICAgIH1cblxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImZvclwiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImZvclwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdEVsZW1lbnRJZCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHJlZnJlc2goKSB7XG4gICAgICAgIHRoaXMuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgdGhpcy5fb3B0aW9ucy5mb3JFYWNoKGksIGVsZW0gPT4ge1xuICAgICAgICAgICAgdGhpcy5fbG9nKFwiYWRkXCIsIGksIGVsZW0pO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBlbGVtLnRleHQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCwgdGV4dCA9IGVsZW07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgICAgICAgICAgb3B0aW9uLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIHZhbCk7XG4gICAgICAgICAgICBvcHRpb24udGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9sb2coXCJjai1vYmplY3Rpb24gY29ubmVjdGVkKClcIik7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibXVoXCIpO1xuICAgICAgICAgICAgaWYgKHNlbGYudGV4dENvbnRlbnQudHJpbSgpICE9PSBcIlwiKSB7XG5cbiAgICAgICAgICAgICAgICBzZWxmLl9vcHRpb25zID0gSlNPTi5wYXJzZShzZWxmLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJMb2FkaW5nIG9wdGlvbnMgcHJlc2V0IGZyb20ganNvbjpcIiwgc2VsZi5fb3B0aW9ucylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgc2VsZi5yZWZyZXNoKCk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1vcHRpb25zXCIsIENKT3B0aW9uc0VsZW1lbnQpOyIsIlxyXG5jbGFzcyBDSlBhbmVFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuX3NyYyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy50YXJnZXROb2RlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcInNyY1wiLCBcInNoYWRvdy1kb21cIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XHJcblxyXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xyXG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwic3JjXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zcmMgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zcmMgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkVXJsKHRoaXMuX3NyYyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInNoYWRvdy1kb21cIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NoYWRvd0RvbSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2xvYWRVcmwodXJsKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2FkXCIsIHVybCk7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHVybCwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnNIdG1sKVxyXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQoXCJ0ZW1wbGF0ZVwiLCBzZWxmLnRhcmdldE5vZGUpWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzY3JpcHQgPSAkKFwic2NyaXB0XCIsIHNlbGYudGFyZ2V0Tm9kZSlbMF0udGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJub2RlXCIsIHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGUgPSBmdW5jdGlvbihzY3JpcHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZhbChzY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgZS5jYWxsKHNlbGYudGFyZ2V0Tm9kZSwgc2NyaXB0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIDEpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xyXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCAhIHNlbGYuX3NoYWRvd0RvbSkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIndpdGggc2hhZG93XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gc2VsZi5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5cclxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otcGFuZVwiLCBDSlBhbmVFbGVtZW50KTtcclxuIiwiY2xhc3MgQ0pUaW1lckVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5faW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbnRlcnZhbE9iaiA9IG51bGw7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3RpbWVvdXQgPSAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiaW50ZXJ2YWxcIiwgXCJ0aW1lb3V0XCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiaW50ZXJ2YWxcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcnZhbCA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidGltZW91dFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVvdXQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgY2xlYXJJbnRlcnZhbCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2ludGVydmFsT2JqICE9PSBudWxsKSB7XG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLl9pbnRlcnZhbE9iailcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBjb25uZWN0ZWRcIik7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQoXCJ0ZW1wbGF0ZVwiLCBzZWxmKVswXS5jb250ZW50O1xuICAgICAgICAgICAgaWYgKHNlbGYuX2ludGVydmFsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5faW50ZXJ2YWxPYmogPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBteU5vZGUgPSBzZWxmLnRhcmdldE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChteU5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXlOb2RlLnJlbW92ZUNoaWxkKG15Tm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImFwcGVuZFwiLCB0ZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIG15Tm9kZS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICAgICAgICAgIH0sIHNlbGYuX2ludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgc2VsZi5fdGltZW91dCk7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xlYXJJbnRlcnZhbCgpO1xuICAgIH1cblxufVxuXG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otdGltZXJcIiwgQ0pUaW1lckVsZW1lbnQpO1xuIiwiXG5cbmNsYXNzIENKUmVuZGVyZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIENKUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyICR7cmVnWzJdfSA9ICR7cmVnWzFdfVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy9jdXJDbG9uZS50ZXh0Q29udGVudCA9IHRwbE5vZGUudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8oY3VyQ2xvbmUsIHNjb3BlLCB0cGxOb2RlLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfWA7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBnZW5Db2RlKTtcbiAgICAgICAgcmV0dXJuIGV2YWwoZ2VuQ29kZSk7XG4gICAgfVxuXG4gICAgZXZhbFRleHQoc2NvcGUsIHRleHQpIHtcbiAgICAgICAgLy9sZXQgdGV4dFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcblxuICAgICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHtcXHsoLio/KVxcfVxcfS9nLCBmdW5jdGlvbihtYXRjaCwgcDEpIHtcbiAgICAgICAgICAgIGxldCBfX3JldCA9IG51bGw7XG4gICAgICAgICAgICBldmFsKGBfX3JldCA9ICR7cDF9O2ApO1xuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KVxuICAgIH1cblxuXG4gICAgcmVnaXN0ZXJDYWxsYmFja3ModGFyZ2V0Tm9kZSwgc2NvcGUpIHtcbiAgICAgICAgbGV0IGV2ZW50QXR0ciA9IHRhcmdldE5vZGUuZ2V0QXR0cmlidXRlKFwiKGNsaWNrKVwiKTtcbiAgICAgICAgaWYgKGV2ZW50QXR0ciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IGNvZGUgPSB0aGlzLmV2YWxUZXh0KHNjb3BlLCBldmVudEF0dHIpO1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZSA9PiB7XG4gICAgICAgICAgICAgICAgZXZhbChjb2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB0YXJnZXROb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwYXJhbSBjdXJUZW1wbGF0ZU5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUpIHtcbiAgICAgICAgaWYodHlwZW9mIHRwbE5vZGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRwbE5vZGUgPSB0aGlzLnRlbXBsYXRlRG9tO1xuICAgICAgICB9XG5cbiAgICAgICAgKChlLCBhKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0YXJnZXROb2RlKTtcbiAgICAgICAgfSkoZSxhKTtcblxuICAgICAgICAvKlxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Tm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXROb2RlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgfVxuICAgICAgICAqL1xuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgbGV0IHRleHROb2RlID0gdHBsTm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB0ZXh0Tm9kZS50ZXh0Q29udGVudCA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIHRleHROb2RlLnRleHRDb250ZW50KTtcblxuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyh0cGxOb2RlKTtcblxuXG5cblxuICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKTtcblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImlmJFwiKSkge1xuICAgICAgICAgICAgaWYodGhpcy5ib29sRXZhbChzY29wZSwgdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJpZiRcIikpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSlRwbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICB9XG5cblxuICAgIHJlbG9hZCgpIHtcbiAgICAgICAgdmFyIHJlbmRlcmVyID0gbmV3IENKUmVuZGVyZXIoKTtcbiAgICAgICAgdGhpcy50YXJnZXROb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHJlbmRlcmVyLnJlbmRlckludG8odGhpcy50YXJnZXROb2RlLCB7fSwgdGhpcy50ZW1wbGF0ZU5vZGUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJhamF4LXNyY1wiXTsgfVxuXG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuXG5cbiAgICBzZXREYXRhKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMudGFyZ2V0Tm9kZSwgdGhpcy5fZGF0YSwgdGhpcy50ZW1wbGF0ZU5vZGUpO1xuICAgIH1cblxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVhZHlcIik7XG5cbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XG5cbiAgICAgICAgICAgIC8vc2VsZi5zZXREYXRhKHt9KTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb25uZWN0XCIsIHNlbGYudGVtcGxhdGVOb2RlKTtcbiAgICAgICAgICAgIC8vdGhpcy50ZW1wbGF0ZU5vZGUgPSB0aGlzLmNvbnRlbnQuY2hpbGROb2Rlc1swXS5jbG9uZU5vZGUodHJ1ZSk7XG5cblxuXG4gICAgICAgIH0sIDEpO1xuXG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otdHBsXCIsIENKVHBsRWxlbWVudCk7XG4iLCIvKipcbiAqXG4gKiBAcGFyYW0ge05vZGV9IHNvdXJjZVxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSBzY29wZVxuICovXG5mdW5jdGlvbiBjal9yZW5kZXIoc291cmNlLCB0YXJnZXQsIHNjb3BlKSB7XG5cbiAgICB2YXIgZnVuYyA9IHtcblxuICAgICAgICBcImZvciRcIjogKF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCBfcl9leHByKSA9PiB7XG4gICAgICAgICAgICB2YXIgX19fX2V2YWwgPSAnZm9yICgnICsgX3JfZXhwciArIFwiKSB7IF9fX19yZW5kZXJGbihfcl9zb3VyY2UsIF9yX3RhcmdldCwgdHJ1ZSk7IH07XCI7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGV2YWwoX19fX2V2YWwpO1xuICAgICAgICAgICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBgRXJyb3IgaW4gc3RhdGVtZW50IGZvciQ9JyR7X3JfZXhwcn0nOiBgICsgX2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZWFjaCRcIjogKF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCBfcl9leHByKSA9PiB7XG4gICAgICAgICAgICB2YXIgX19fX21hdGNoZXMgPSBfcl9leHByLm1hdGNoKC9eKC4qPykgYXMgKC4qPykoXFw9XFw+KC4qPykpJC8pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coX19fX21hdGNoZXMpO1xuICAgICAgICAgICAgaWYgKF9fX19tYXRjaGVzLmxlbmd0aCA9PSA1KSB7XG4gICAgICAgICAgICAgICAgdmFyIF9fX19ldmFsID0gYGZvciAoJHtfX19fbWF0Y2hlc1syXX0gaW4gJHtfX19fbWF0Y2hlc1sxXX0pIHsgJHtfX19fbWF0Y2hlc1s0XX0gPSAke19fX19tYXRjaGVzWzFdfVske19fX19tYXRjaGVzWzJdfV07IF9fX19yZW5kZXJGbihfcl9zb3VyY2UsIF9yX3RhcmdldCwgdHJ1ZSk7IH07YDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgYEludmFsaWQgZWFjaCQ9JyR7X3JfZXhwcn0nIHN5bnRheC5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coX19fX2V2YWwpO1xuICAgICAgICAgICAgZXZhbChfX19fZXZhbCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIFwiaWYkXCI6IChfcl9zb3VyY2UsIF9yX3RhcmdldCwgX3JfZXhwcikgPT4ge1xuICAgICAgICAgICAgdmFyIF9fX19fZXZhbCA9ICdpZiAoJyArIF9yX2V4cHIgKyBcIikgeyBfX19fcmVuZGVyRm4oX3Jfc291cmNlLCBfcl90YXJnZXQsIHRydWUpOyB9O1wiO1xuICAgICAgICAgICAgZXZhbChfX19fX2V2YWwpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBcIl9fZXZhbF9fXCI6IChfcl9pbnB1dCkgPT4ge1xuICAgICAgICAgICAgX3JfaW5wdXQgPSBfcl9pbnB1dC5yZXBsYWNlKC9cXHtcXHsoLio/KVxcfVxcfS9nLCAobWF0Y2gsIGNvbnRlbnRzKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2YWwoY29udGVudHMpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGDDiHJyb3IgaW4gaW5saW5lIHN0YXRlbWVudCAke21hdGNofSBpbiB0ZXh0IGJsb2NrICcke19yX2lucHV0fSc6IGAgKyBfZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBfcl9pbnB1dDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGVzZSBmdW5jdGlvbnMgYXJlIGFwcGxpZWQgYWZ0ZXIgdGhlIHJlc3VsdCBOb2RlIHdhcyBjcmVhdGVkIChhZnRlciB0aGUgbG9vcClcbiAgICAgKlxuICAgICAqIEB0eXBlIHt7Y2xhc3MkOiAoZnVuY3Rpb24oKiwgKiwgKj0sICopOiBib29sZWFuKX19XG4gICAgICovXG4gICAgdmFyIG1vZGlmaWVycyA9IHtcbiAgICAgICAgXCJjbGFzcyRcIjogKF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCBfcl9leHByLCBfcl9yZXN1bHROb2RlKSA9PiB7XG4gICAgICAgICAgICBldmFsKFwidmFyIF9yX2V4cHIgPSBcIiArIF9yX2V4cHIpO1xuICAgICAgICAgICAgZm9yIChfX2N1ckNsYXNzTmFtZSBpbiBfcl9leHByKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9yX2V4cHJbX19jdXJDbGFzc05hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIF9yX3Jlc3VsdE5vZGUuY2xhc3NMaXN0LmFkZChfX2N1ckNsYXNzTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIF9fX19yZW5kZXJGbiA9IChzb3VyY2UsIHRhcmdldCwgbm9QYXJzZUF0dHJzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nIChcIm5vZGUgdHlwZVwiLCBzb3VyY2Uubm9kZVR5cGUpO1xuICAgICAgICBpZiAoc291cmNlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIndhbGtcIiwgc291cmNlLCB0YXJnZXQpXG5cbiAgICAgICAgICAgIHZhciBuZXdUYXJnZXQgPSBzb3VyY2UuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIGlmICggISBub1BhcnNlQXR0cnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGN1ckZ1bmMgaW4gZnVuYykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmhhc0F0dHJpYnV0ZShjdXJGdW5jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coY3VyRnVuYywgc291cmNlLCB0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJldCA9IGZ1bmNbY3VyRnVuY10oc291cmNlLCB0YXJnZXQsIHNvdXJjZS5nZXRBdHRyaWJ1dGUoY3VyRnVuYyksIG5ld1RhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmV0ID09PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY3VyRnVuYyBpbiBtb2RpZmllcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmhhc0F0dHJpYnV0ZShjdXJGdW5jKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjdXJGdW5jLCBzb3VyY2UsIHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXQgPSBtb2RpZmllcnNbY3VyRnVuY10oc291cmNlLCB0YXJnZXQsIHNvdXJjZS5nZXRBdHRyaWJ1dGUoY3VyRnVuYyksIG5ld1RhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXQgPT09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5ld1RhcmdldCk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkxID0gMDsgaTEgPCBzb3VyY2UuY2hpbGROb2Rlcy5sZW5ndGg7IGkxKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VyU291cmNlMSA9IHNvdXJjZS5jaGlsZE5vZGVzW2kxXTtcblxuXG4gICAgICAgICAgICAgICAgLy8gUmVuZGVyIGNvbnRlbnQgbm9kZXMgaW50byBwcmV2aW91cyB0YXJnZXQuXG4gICAgICAgICAgICAgICAgX19fX3JlbmRlckZuKGN1clNvdXJjZTEsIG5ld1RhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc291cmNlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICB2YXIgX25ld19lbGVtID0gc291cmNlLmNsb25lTm9kZShmYWxzZSk7XG4gICAgICAgICAgICBfbmV3X2VsZW0udGV4dENvbnRlbnQgPSBmdW5jLl9fZXZhbF9fKF9uZXdfZWxlbS50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoX25ld19lbGVtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vaWYgKClcbiAgICAgICAgICAgIGNvbnNvbGUubG9nIChcIm5vcm1hbCBub2RlXCIsIHNvdXJjZSwgdGFyZ2V0KTtcbiAgICAgICAgICAgIHRhcmdldC5hcHBlbmRDaGlsZChzb3VyY2UuY2xvbmVOb2RlKGZhbHNlKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIEB0b2RvIGNoZWNrIGlmIGl0IGlzIGEgdGVtcGxhdGUgbm9kZSBhbmQgdXNlIGNvbnRlbnRFbGVtZW50c1xuXG4gICAgLy8gV2FsayBhbGwgY2hpbGRzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2UuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY3VyU291cmNlID0gc291cmNlLmNoaWxkTm9kZXNbaV07XG4gICAgICAgIC8vIFJlbmRlciBjb250ZW50IG5vZGVzIGludG8gcHJldmlvdXMgdGFyZ2V0LlxuICAgICAgICBfX19fcmVuZGVyRm4oY3VyU291cmNlLCB0YXJnZXQpO1xuICAgIH1cbn0iLCJcbmNsYXNzIFRwbE5vZGUge1xuXG59XG5cblxuXG5cblxuXG5mdW5jdGlvbiBfX2NvbXBpbGVkX3RwbHgoc2NvcGUsIF9jdXJfbm9kZSkge1xuICAgIGZvciAodmFyIHd1cnN0IGluIHNjb3BlLmEpIHtcbiAgICAgICAgX2N1cl9ub2RlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpXG4gICAgfVxufVxuXG5cblxuY2xhc3MgVHBsQ29tcGlsZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYXR0cnMgPSB7XG4gICAgICAgICAgICBcImZvciRcIjogZnVuY3Rpb24gKHRwbE5vZGUpIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG5cblxuXG4gICAgY29tcGlsZShub2RlKSB7XG5cblxuICAgICAgICBub2RlLmdldEF0dHJpYlxuXG5cbiAgICB9XG5cblxufSIsIlxuY2xhc3MgQ0pBamF4Rm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkZvcm1FbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25zdWNjZXNzID0gbnVsbDtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1hY3Rpb25cIiwgXCJwcmVsb2FkXCIsIFwib25zdWNjZXNzXCIsIC4uLkNKRm9ybUVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LWFjdGlvblwiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheEFjdGlvbiA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInByZWxvYWRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLnByZWxvYWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm9uc3VjY2Vzc1wiOlxuICAgICAgICAgICAgICAgIHRoaXMub25zdWNjZXNzID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgX29uX3N1Ym1pdF9jbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmFkZENsYXNzKFwibG9hZGluZ1wiKTtcblxuICAgICAgICBsZXQgZm9ybURhdGEgPSB7fTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9nYXRoZXJfZm9ybV9kYXRhKGUsIGZvcm1EYXRhKSk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIGxldCBhamF4T3B0aW9ucyA9IENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zO1xuICAgICAgICBhamF4T3B0aW9uc1tcIm1ldGhvZFwiXSA9IFwicG9zdFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcInVybFwiXSA9IHRoaXMuYWpheEFjdGlvbjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJkYXRhXCJdID0gSlNPTi5zdHJpbmdpZnkoZm9ybURhdGEpO1xuICAgICAgICBhamF4T3B0aW9uc1tcImNvbnRlbnRUeXBlXCJdID0gXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCI7XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVR5cGVcIl0gPSBcImpzb25cIjtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGpRdWVyeS5hamF4KGFqYXhPcHRpb25zKS5kb25lKFxuICAgICAgICAgICAgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAvL3NlbGYuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5yZW1vdmVDbGFzcyhcImxvYWRpbmdcIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0QnV0dG9uLmFkZENsYXNzKFwic2F2ZWRcIik7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbnN1Y2Nlc3MgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHIgPSBldmFsKHNlbGYub25zdWNjZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByKHRoaXMsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbiA9ICQoXCJidXR0b25bdHlwZT0nc3VibWl0J10sIGlucHV0W3R5cGU9J3N1Ym1pdCddXCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24uY2xpY2soZSA9PiB0aGlzLl9vbl9zdWJtaXRfY2xpY2soZSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveFwiLCB0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy5wcmVsb2FkKSB7XG4gICAgICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgalF1ZXJ5LmFqYXgodGhpcy5hamF4QWN0aW9uLCBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucylcbiAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2ZpbGxfZGF0YShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otYWpheC1mb3JtXCIsIENKQWpheEZvcm1FbGVtZW50KTsiLCJcblxuY2xhc3MgQ2pTY3JpcHRFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0gc2VsZi5pbm5lclRleHQ7XG4gICAgICAgICAgICBzZWxmLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBjb250ZW50KTtcbiAgICAgICAgICAgIGV2YWwoY29udGVudCk7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgICAgICAgICBzY3JpcHQudGV4dENvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgKi9cblxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1zY3JpcHRcIiwgQ2pTY3JpcHRFbGVtZW50KTsiXX0=
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakV4ZWNFbGVtZW50LmpzIiwiZG9jL0NqSGlnaGxpZ2h0RWxlbWVudC5qcyIsImZvcm0vQ0pGb3JtRWxlbWVudC5qcyIsImZvcm0vQ0pPcHRpb25zRWxlbWVudC5qcyIsInBhbmUvQ0pQYW5lRWxlbWVudC5qcyIsInRpbWVyL0NKVGltZXIuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ0cGwvVGVtcGxhdGUuanMiLCJ0cGwvVHBsQ29tcGlsZXIuanMiLCJ4ZWxlbS9DSkFqYXhGb3JtRWxlbWVudC5qcyIsInhlbGVtL0NKU2NyaXB0RWxlbWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb21wanMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuY2xhc3MgYyB7XG5cblxuICAgIC8qKlxuICAgICAqIEhUVFAgQ2xpZW50IGZvciBBamF4IFJlcXVlc3RzXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIHVybFxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxICh1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDSl9SZXEodXJsKTtcbiAgICB9XG5cblxuXG5cblxufSIsIlxuY2xhc3MgY2Uge1xuXG5cbiAgICBzdGF0aWMgX2dldEVsZW1lbnRCeUlkKGlkLCB0eXBlKSB7XG4gICAgICAgIHZhciBlbGVtID0gJChcIiNcIiArIGlkKVswXTtcbiAgICAgICAgaWYgKGVsZW0gPT09IG51bGwpXG4gICAgICAgICAgICB0aHJvdyBcIkVsZW1lbnQgI1wiICsgaWQgKyBcIiBub3QgZm91bmRcIjtcbiAgICAgICAgaWYgKHR5cGUgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGlmICggISBlbGVtIGluc3RhbmNlb2YgdHlwZSlcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVsZW1lbnQgI1wiICsgaWQgKyBcIiBub3Qgb2YgdHlwZSBcIiArIHR5cGU7XG4gICAgICAgIHJldHVybiBlbGVtO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybnMge0NKRm9ybUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGZvcm0oaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pGb3JtRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0NqSGlnaGxpZ2h0RWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgaGlnaGxpZ2h0KGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENqSGlnaGxpZ2h0RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybiB7Q0pQYW5lRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFuZShpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDSlBhbmVFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBhbnkoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSl9SZXEge1xuXG4gICAgY29uc3RydWN0b3IodXJsKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgYm9keTogbnVsbCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwidGV4dFwiXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBib2R5XG4gICAgICogQHJldHVybiB7Q0pfUmVxfVxuICAgICAqL1xuICAgIHdpdGhCb2R5KGJvZHkpIHtcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5tZXRob2QgPT09IFwiR0VUXCIpXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QubWV0aG9kID0gXCJQT1NUXCI7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGJvZHkpIHx8IHR5cGVvZiBib2R5ID09PSBcIm9iamVjdFwiKVxuICAgICAgICAgICAgYm9keSA9IEpTT04uc3RyaW5naWZ5KGJvZHkpO1xuICAgICAgICB0aGlzLnJlcXVlc3QuYm9keSA9IGJvZHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldCBqc29uKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgXCJqc29uXCIpXG4gICAgfVxuXG4gICAgc2V0IHBsYWluKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgbnVsbClcbiAgICB9XG5cbiAgICBzZXQgc3RyZWFtKGZuKSB7XG4gICAgICAgIHRoaXMuX21ha2VfcmVxdWVzdChmbiwgXCJzdHJlYW1cIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZm5cbiAgICAgKiBAcGFyYW0gZmlsdGVyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfbWFrZV9yZXF1ZXN0KGZuLCBmaWx0ZXIpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKGZpbHRlciA9PT0gXCJqc29uXCIpXG4gICAgICAgICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICBmbihkYXRhKTtcbiAgICAgICAgfTtcbiAgICAgICAgJC5hamF4KHRoaXMucmVxdWVzdCk7XG4gICAgfVxuXG59IiwiXG5jbGFzcyBDSkh0bWxFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZGVidWcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImRlYnVnXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImRlYnVnXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5kZWJ1ZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogTG9nIG91dHB1dCAoaWYgZGVidWcgaXMgb24pXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICogQHBhcmFtIHBhcmFtMVxuICAgICAqIEBwYXJhbSBwYXJhbTJcbiAgICAgKi9cbiAgICBfbG9nKHBhcmFtMSwgcGFyYW0yKSB7XG4gICAgICAgIGlmICh0aGlzLmRlYnVnKVxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcywgLi4uYXJndW1lbnRzKTtcbiAgICB9XG5cbn0iLCJjbGFzcyBDb21wQ29yZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYWpheE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zSHRtbCA9IHtcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYWxlcnQgKFwiRXJyb3IgZXhlY3V0aW5nIGZvcm0gcmVxdWVzdC5cIik7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFcnJvclwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgaW5zdGFuY2UgKCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBDb3JlKCk7XG4gICAgfVxuXG5cbiAgICBldmFsQXR0cihhdHRyVmFsdWUsIGV2ZW50LCBvd25lck9iaikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgYXR0clZhbHVlKTtcbiAgICAgICAgaWYgKGF0dHJWYWx1ZSA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBpZiAodHlwZW9mIGF0dHJWYWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWwoYXR0clZhbHVlKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwib3duZXJcIiwgb3duZXJPYmopO1xuICAgICAgICAgICAgdmFyIHJldCA9IGNvbnRleHQuYmluZChvd25lck9iaikoZXZlbnQpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXQgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgcmV0dXJuIHJldC5iaW5kKG93bmVyT2JqKShldmVudClcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGF0dHJWYWx1ZSA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgcmV0dXJuIGF0dHJWYWx1ZShldmVudCwgb3duZXJPYmopO1xuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJldmFsIGVycm9yOlwiLCBhdHRyVmFsdWUpXG4gICAgICAgIHRocm93IFwiQ2Fubm90IGV2YWx1YXRlIGV4cHJlc3Npb24gLSBzZWUgb3V0cHV0XCJcbiAgICB9XG59XG5cblxuIiwiXG5cbmNsYXNzIENqRXhlY0VsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cblxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGVOb2RlID0gc2VsZi5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29kZU5vZGUudGFnTmFtZSAhPT0gXCJQUkVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9nKFwiQ2Fubm90IGZpbmQgc2libGluZyA8cHJlPiBub2RlXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29kZU5vZGUgPSBjb2RlTm9kZS5xdWVyeVNlbGVjdG9yKFwiY29kZVwiKTtcblxuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcInRleHRDb250ZW50PVwiLCBjb2RlTm9kZS50ZXh0Q29udGVudCk7XG5cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmlubmVySFRNTCA9IGNvZGVOb2RlLnRleHRDb250ZW50O1xuXG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCJzY3JpcHRcIiwgc2VsZikuZWFjaChmdW5jdGlvbihpZHgsIG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmFsKG5vZGUudGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfSwxKTtcblxuXG4gICAgICAgICAgICAgICAgfSwgMSk7XG4gICAgfVxuXG5cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otZXhlY1wiLCBDakV4ZWNFbGVtZW50KTsiLCJcblxuY2xhc3MgQ2pIaWdobGlnaHRFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gXCJcIjtcbiAgICAgICAgdGhpcy5fY29kZUVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmxhbmcgPSBcImh0bWxcIlxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wibGFuZ1wiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImxhbmdcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmcgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB0ZXh0IHRvIGhpZ2hsaWdodFxuICAgICAqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlICAgICB0aGUgY29kZSB0byBoaWdodGxpZ2h0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVUeXBlIFRoZSBoaWdobGlnaHRlciB0byB1c2UgKGh0bWx8dGV4dHxqcylcbiAgICAgKi9cbiAgICBzZXRDb2RlKGNvZGUsIGNvZGVUeXBlKSB7XG4gICAgICAgIGlmIChjb2RlVHlwZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgY29kZVR5cGUgPSB0aGlzLmxhbmc7XG5cbiAgICAgICAgdGhpcy5fdmFsdWUgPSBjb2RlO1xuICAgICAgICBpZiAodGhpcy5fY29kZUVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvZGVFbGVtZW50LmlubmVyVGV4dCA9IGNvZGU7XG4gICAgICAgICAgICB0aGlzLl9jb2RlRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNvZGVUeXBlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwibG9hZFwiKSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gc2VsZi5pbm5lckhUTUw7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcImNvbnRlbnQgdG8gaGlnaGxpZ2h0XCIsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKGRpdik7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgICAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChwcmUpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNvZGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHByZS5hcHBlbmRDaGlsZChjb2RlKTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9jb2RlRWxlbWVudCA9IGNvZGU7XG5cbiAgICAgICAgICAgICAgICAgICAgY29kZS5jbGFzc0xpc3QuYWRkKHNlbGYubGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIGNvZGUuc3R5bGUud2hpdGVTcGFjZSA9IFwicHJlXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQudHJpbSgpICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlLmlubmVyVGV4dCA9IGNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImxvYWRcIikpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWhpZ2hsaWdodFwiLCBDakhpZ2hsaWdodEVsZW1lbnQpOyIsIlxuY2xhc3MgQ0pGb3JtRWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSBudWxsO1xuICAgICAgICB0aGlzLmNmX29uc3VibWl0ID0gbnVsbDtcbiAgICAgICAgc2VsZiA9IHRoaXM7XG4gICAgfVxuXG5cbiAgICBnZXQgZGF0YSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RGF0YSgpO1xuICAgIH1cblxuICAgIHNldCBkYXRhKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuc2V0RGF0YSh2YWx1ZSk7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcIm9uc3VibWl0XCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwib25zdWJtaXRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLmNmX29uc3VibWl0ID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YU9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dhdGhlcl9mb3JtX2RhdGEgKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgc3dpdGNoIChmb3JtLnRhZ05hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJJTlBVVFwiOlxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZm9ybS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjaGVja2JveFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3JtLmNoZWNrZWQgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSBmb3JtLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJTRUxFQ1RcIjpcbiAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSAkKGZvcm0pLnZhbCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlRFWFRBUkVBXCI6XG4gICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gJChmb3JtKS52YWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGN1cnJlbnRseSB2YWx1ZXMgZnJvbSB0aGUgZm9ybSBhbmQgcmV0dXJuXG4gICAgICogb2JqZWN0IGJhc2VkIG9uIHRoZSBmb3JtcyBuYW1lc1xuICAgICAqXG4gICAgICogQHJldHVybiBvYmplY3RcbiAgICAgKi9cbiAgICBnZXREYXRhKCkge1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94LCBzZWxlY3RcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoZSwgcmV0KSk7XG4gICAgICAgIHRoaXMuX2xvZyhcImdldERhdGEoKTpcIiwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cblxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWxsX2Zvcm1fc2luZ2xlKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgdmFyIGZvcm1OYW1lID0gZm9ybS5uYW1lO1xuICAgICAgICBpZiAoZm9ybU5hbWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGZvcm1OYW1lID0gZm9ybS5pZDtcblxuICAgICAgICBzd2l0Y2ggKGZvcm0udGFnTmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIklOUFVUXCI6XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmb3JtLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyYWRpb1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFPYmpbZm9ybU5hbWVdID09IGZvcm0udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9ybS52YWx1ZSA9IGRhdGFPYmpbZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlNFTEVDVFwiOlxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJURVhUQVJFQVwiOlxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgZm9ybSBkYXRhIGZyb20gZXh0ZXJuYWwgYW5kIHJlcmVuZGVyIHRoZSBpbnB1dCB2YWx1ZXNcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIHNldERhdGEoZGF0YSkge1xuICAgICAgICB0aGlzLl9sb2coXCJzZXREYXRhKClcIiwgZGF0YSk7XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94LCBzZWxlY3RcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2ZpbGxfZm9ybV9zaW5nbGUoZSwgZGF0YSkpO1xuICAgIH1cblxuICAgIF9zdWJtaXQoZSkge1xuICAgICAgICB0aGlzLl9sb2coXCJfc3VibWl0KFwiLCBlLCBcIik7IGNhbGxpbmc6IG9uc3VibWl0PVwiLCB0aGlzLmNmX29uc3VibWl0KTtcbiAgICAgICAgQ29tcENvcmUuaW5zdGFuY2UuZXZhbEF0dHIodGhpcy5jZl9vbnN1Ym1pdCwgZSwgdGhpcyk7XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gUmVnaXN0ZXIgZXZlbnQgaGFuZGxlclxuICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID0gc2VsZi5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKTtcbiAgICAgICAgICAgIGlmIChzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJidXR0b25bdHlwZT0nc3VibWl0J11cIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudC5vbnN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXQoZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otZm9ybVwiLCBDSkZvcm1FbGVtZW50KTsiLCJcbmNsYXNzIENKT3B0aW9uc0VsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9zZWxlY3RFbGVtZW50SWQgPSBbXTtcblxuICAgIH1cblxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImZvclwiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImZvclwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdEVsZW1lbnRJZCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHJlZnJlc2goKSB7XG4gICAgICAgIHRoaXMuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgdGhpcy5fb3B0aW9ucy5mb3JFYWNoKGksIGVsZW0gPT4ge1xuICAgICAgICAgICAgdGhpcy5fbG9nKFwiYWRkXCIsIGksIGVsZW0pO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBlbGVtLnRleHQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCwgdGV4dCA9IGVsZW07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgICAgICAgICAgb3B0aW9uLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIHZhbCk7XG4gICAgICAgICAgICBvcHRpb24udGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9sb2coXCJjai1vYmplY3Rpb24gY29ubmVjdGVkKClcIik7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibXVoXCIpO1xuICAgICAgICAgICAgaWYgKHNlbGYudGV4dENvbnRlbnQudHJpbSgpICE9PSBcIlwiKSB7XG5cbiAgICAgICAgICAgICAgICBzZWxmLl9vcHRpb25zID0gSlNPTi5wYXJzZShzZWxmLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJMb2FkaW5nIG9wdGlvbnMgcHJlc2V0IGZyb20ganNvbjpcIiwgc2VsZi5fb3B0aW9ucylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgc2VsZi5yZWZyZXNoKCk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1vcHRpb25zXCIsIENKT3B0aW9uc0VsZW1lbnQpOyIsIlxyXG5jbGFzcyBDSlBhbmVFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuX3NyYyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy50YXJnZXROb2RlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcInNyY1wiLCBcInNoYWRvdy1kb21cIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XHJcblxyXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xyXG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwic3JjXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zcmMgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zcmMgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkVXJsKHRoaXMuX3NyYyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInNoYWRvdy1kb21cIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NoYWRvd0RvbSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2xvYWRVcmwodXJsKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2FkXCIsIHVybCk7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHVybCwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnNIdG1sKVxyXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQoXCJ0ZW1wbGF0ZVwiLCBzZWxmLnRhcmdldE5vZGUpWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzY3JpcHQgPSAkKFwic2NyaXB0XCIsIHNlbGYudGFyZ2V0Tm9kZSlbMF0udGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJub2RlXCIsIHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGUgPSBmdW5jdGlvbihzY3JpcHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZhbChzY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgZS5jYWxsKHNlbGYudGFyZ2V0Tm9kZSwgc2NyaXB0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIDEpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xyXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCAhIHNlbGYuX3NoYWRvd0RvbSkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIndpdGggc2hhZG93XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gc2VsZi5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5cclxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otcGFuZVwiLCBDSlBhbmVFbGVtZW50KTtcclxuIiwiY2xhc3MgQ0pUaW1lckVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5faW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbnRlcnZhbE9iaiA9IG51bGw7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3RpbWVvdXQgPSAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiaW50ZXJ2YWxcIiwgXCJ0aW1lb3V0XCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiaW50ZXJ2YWxcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcnZhbCA9IG5ld1ZhbHVlO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidGltZW91dFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVvdXQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgY2xlYXJJbnRlcnZhbCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2ludGVydmFsT2JqICE9PSBudWxsKSB7XG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLl9pbnRlcnZhbE9iailcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBjb25uZWN0ZWRcIik7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQoXCJ0ZW1wbGF0ZVwiLCBzZWxmKVswXS5jb250ZW50O1xuICAgICAgICAgICAgaWYgKHNlbGYuX2ludGVydmFsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5faW50ZXJ2YWxPYmogPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBteU5vZGUgPSBzZWxmLnRhcmdldE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChteU5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXlOb2RlLnJlbW92ZUNoaWxkKG15Tm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImFwcGVuZFwiLCB0ZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIG15Tm9kZS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICAgICAgICAgIH0sIHNlbGYuX2ludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgc2VsZi5fdGltZW91dCk7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xlYXJJbnRlcnZhbCgpO1xuICAgIH1cblxufVxuXG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otdGltZXJcIiwgQ0pUaW1lckVsZW1lbnQpO1xuIiwiXG5cbmNsYXNzIENKUmVuZGVyZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIENKUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyICR7cmVnWzJdfSA9ICR7cmVnWzFdfVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy9jdXJDbG9uZS50ZXh0Q29udGVudCA9IHRwbE5vZGUudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8oY3VyQ2xvbmUsIHNjb3BlLCB0cGxOb2RlLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfWA7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBnZW5Db2RlKTtcbiAgICAgICAgcmV0dXJuIGV2YWwoZ2VuQ29kZSk7XG4gICAgfVxuXG4gICAgZXZhbFRleHQoc2NvcGUsIHRleHQpIHtcbiAgICAgICAgLy9sZXQgdGV4dFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcblxuICAgICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHtcXHsoLio/KVxcfVxcfS9nLCBmdW5jdGlvbihtYXRjaCwgcDEpIHtcbiAgICAgICAgICAgIGxldCBfX3JldCA9IG51bGw7XG4gICAgICAgICAgICBldmFsKGBfX3JldCA9ICR7cDF9O2ApO1xuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KVxuICAgIH1cblxuXG4gICAgcmVnaXN0ZXJDYWxsYmFja3ModGFyZ2V0Tm9kZSwgc2NvcGUpIHtcbiAgICAgICAgbGV0IGV2ZW50QXR0ciA9IHRhcmdldE5vZGUuZ2V0QXR0cmlidXRlKFwiKGNsaWNrKVwiKTtcbiAgICAgICAgaWYgKGV2ZW50QXR0ciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IGNvZGUgPSB0aGlzLmV2YWxUZXh0KHNjb3BlLCBldmVudEF0dHIpO1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZSA9PiB7XG4gICAgICAgICAgICAgICAgZXZhbChjb2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB0YXJnZXROb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwYXJhbSBjdXJUZW1wbGF0ZU5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUpIHtcbiAgICAgICAgaWYodHlwZW9mIHRwbE5vZGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRwbE5vZGUgPSB0aGlzLnRlbXBsYXRlRG9tO1xuICAgICAgICB9XG5cbiAgICAgICAgKChlLCBhKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0YXJnZXROb2RlKTtcbiAgICAgICAgfSkoZSxhKTtcblxuICAgICAgICAvKlxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Tm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXROb2RlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgfVxuICAgICAgICAqL1xuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgbGV0IHRleHROb2RlID0gdHBsTm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB0ZXh0Tm9kZS50ZXh0Q29udGVudCA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIHRleHROb2RlLnRleHRDb250ZW50KTtcblxuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyh0cGxOb2RlKTtcblxuXG5cblxuICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKTtcblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImlmJFwiKSkge1xuICAgICAgICAgICAgaWYodGhpcy5ib29sRXZhbChzY29wZSwgdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJpZiRcIikpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSlRwbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICB9XG5cblxuICAgIHJlbG9hZCgpIHtcbiAgICAgICAgdmFyIHJlbmRlcmVyID0gbmV3IENKUmVuZGVyZXIoKTtcbiAgICAgICAgdGhpcy50YXJnZXROb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHJlbmRlcmVyLnJlbmRlckludG8odGhpcy50YXJnZXROb2RlLCB7fSwgdGhpcy50ZW1wbGF0ZU5vZGUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJhamF4LXNyY1wiXTsgfVxuXG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuXG5cbiAgICBzZXREYXRhKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMudGFyZ2V0Tm9kZSwgdGhpcy5fZGF0YSwgdGhpcy50ZW1wbGF0ZU5vZGUpO1xuICAgIH1cblxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVhZHlcIik7XG5cbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XG5cbiAgICAgICAgICAgIC8vc2VsZi5zZXREYXRhKHt9KTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb25uZWN0XCIsIHNlbGYudGVtcGxhdGVOb2RlKTtcbiAgICAgICAgICAgIC8vdGhpcy50ZW1wbGF0ZU5vZGUgPSB0aGlzLmNvbnRlbnQuY2hpbGROb2Rlc1swXS5jbG9uZU5vZGUodHJ1ZSk7XG5cblxuXG4gICAgICAgIH0sIDEpO1xuXG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otdHBsXCIsIENKVHBsRWxlbWVudCk7XG4iLCIvKipcbiAqXG4gKiBAcGFyYW0ge05vZGV9IHNvdXJjZVxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSBzY29wZVxuICovXG5mdW5jdGlvbiBjal9yZW5kZXIoc291cmNlLCB0YXJnZXQsIHNjb3BlKSB7XG5cbiAgICB2YXIgZnVuYyA9IHtcblxuICAgICAgICBcImZvciRcIjogKF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCBfcl9leHByKSA9PiB7XG4gICAgICAgICAgICB2YXIgX19fX2V2YWwgPSAnZm9yICgnICsgX3JfZXhwciArIFwiKSB7IF9fX19yZW5kZXJGbihfcl9zb3VyY2UsIF9yX3RhcmdldCwgdHJ1ZSk7IH07XCI7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGV2YWwoX19fX2V2YWwpO1xuICAgICAgICAgICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBgRXJyb3IgaW4gc3RhdGVtZW50IGZvciQ9JyR7X3JfZXhwcn0nOiBgICsgX2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZWFjaCRcIjogKF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCBfcl9leHByKSA9PiB7XG4gICAgICAgICAgICB2YXIgX19fX21hdGNoZXMgPSBfcl9leHByLm1hdGNoKC9eKC4qPykgYXMgKC4qPykoXFw9XFw+KC4qPykpJC8pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coX19fX21hdGNoZXMpO1xuICAgICAgICAgICAgaWYgKF9fX19tYXRjaGVzLmxlbmd0aCA9PSA1KSB7XG4gICAgICAgICAgICAgICAgdmFyIF9fX19ldmFsID0gYGZvciAoJHtfX19fbWF0Y2hlc1syXX0gaW4gJHtfX19fbWF0Y2hlc1sxXX0pIHsgJHtfX19fbWF0Y2hlc1s0XX0gPSAke19fX19tYXRjaGVzWzFdfVske19fX19tYXRjaGVzWzJdfV07IF9fX19yZW5kZXJGbihfcl9zb3VyY2UsIF9yX3RhcmdldCwgdHJ1ZSk7IH07YDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgYEludmFsaWQgZWFjaCQ9JyR7X3JfZXhwcn0nIHN5bnRheC5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coX19fX2V2YWwpO1xuICAgICAgICAgICAgZXZhbChfX19fZXZhbCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIFwiaWYkXCI6IChfcl9zb3VyY2UsIF9yX3RhcmdldCwgX3JfZXhwcikgPT4ge1xuICAgICAgICAgICAgdmFyIF9fX19fZXZhbCA9ICdpZiAoJyArIF9yX2V4cHIgKyBcIikgeyBfX19fcmVuZGVyRm4oX3Jfc291cmNlLCBfcl90YXJnZXQsIHRydWUpOyB9O1wiO1xuICAgICAgICAgICAgZXZhbChfX19fX2V2YWwpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBcIl9fZXZhbF9fXCI6IChfcl9pbnB1dCkgPT4ge1xuICAgICAgICAgICAgX3JfaW5wdXQgPSBfcl9pbnB1dC5yZXBsYWNlKC9cXHtcXHsoLio/KVxcfVxcfS9nLCAobWF0Y2gsIGNvbnRlbnRzKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2YWwoY29udGVudHMpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGDDiHJyb3IgaW4gaW5saW5lIHN0YXRlbWVudCAke21hdGNofSBpbiB0ZXh0IGJsb2NrICcke19yX2lucHV0fSc6IGAgKyBfZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBfcl9pbnB1dDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGVzZSBmdW5jdGlvbnMgYXJlIGFwcGxpZWQgYWZ0ZXIgdGhlIHJlc3VsdCBOb2RlIHdhcyBjcmVhdGVkIChhZnRlciB0aGUgbG9vcClcbiAgICAgKlxuICAgICAqIEB0eXBlIHt7Y2xhc3MkOiAoZnVuY3Rpb24oKiwgKiwgKj0sICopOiBib29sZWFuKX19XG4gICAgICovXG4gICAgdmFyIG1vZGlmaWVycyA9IHtcbiAgICAgICAgXCJjbGFzcyRcIjogKF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCBfcl9leHByLCBfcl9yZXN1bHROb2RlKSA9PiB7XG4gICAgICAgICAgICBldmFsKFwidmFyIF9yX2V4cHIgPSBcIiArIF9yX2V4cHIpO1xuICAgICAgICAgICAgZm9yIChfX2N1ckNsYXNzTmFtZSBpbiBfcl9leHByKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9yX2V4cHJbX19jdXJDbGFzc05hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIF9yX3Jlc3VsdE5vZGUuY2xhc3NMaXN0LmFkZChfX2N1ckNsYXNzTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIF9fX19yZW5kZXJGbiA9IChzb3VyY2UsIHRhcmdldCwgbm9QYXJzZUF0dHJzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nIChcIm5vZGUgdHlwZVwiLCBzb3VyY2Uubm9kZVR5cGUpO1xuICAgICAgICBpZiAoc291cmNlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIndhbGtcIiwgc291cmNlLCB0YXJnZXQpXG5cbiAgICAgICAgICAgIHZhciBuZXdUYXJnZXQgPSBzb3VyY2UuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIGlmICggISBub1BhcnNlQXR0cnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGN1ckZ1bmMgaW4gZnVuYykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmhhc0F0dHJpYnV0ZShjdXJGdW5jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coY3VyRnVuYywgc291cmNlLCB0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJldCA9IGZ1bmNbY3VyRnVuY10oc291cmNlLCB0YXJnZXQsIHNvdXJjZS5nZXRBdHRyaWJ1dGUoY3VyRnVuYyksIG5ld1RhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmV0ID09PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY3VyRnVuYyBpbiBtb2RpZmllcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmhhc0F0dHJpYnV0ZShjdXJGdW5jKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjdXJGdW5jLCBzb3VyY2UsIHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXQgPSBtb2RpZmllcnNbY3VyRnVuY10oc291cmNlLCB0YXJnZXQsIHNvdXJjZS5nZXRBdHRyaWJ1dGUoY3VyRnVuYyksIG5ld1RhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXQgPT09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKG5ld1RhcmdldCk7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkxID0gMDsgaTEgPCBzb3VyY2UuY2hpbGROb2Rlcy5sZW5ndGg7IGkxKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VyU291cmNlMSA9IHNvdXJjZS5jaGlsZE5vZGVzW2kxXTtcblxuXG4gICAgICAgICAgICAgICAgLy8gUmVuZGVyIGNvbnRlbnQgbm9kZXMgaW50byBwcmV2aW91cyB0YXJnZXQuXG4gICAgICAgICAgICAgICAgX19fX3JlbmRlckZuKGN1clNvdXJjZTEsIG5ld1RhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc291cmNlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICB2YXIgX25ld19lbGVtID0gc291cmNlLmNsb25lTm9kZShmYWxzZSk7XG4gICAgICAgICAgICBfbmV3X2VsZW0udGV4dENvbnRlbnQgPSBmdW5jLl9fZXZhbF9fKF9uZXdfZWxlbS50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoX25ld19lbGVtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vaWYgKClcbiAgICAgICAgICAgIGNvbnNvbGUubG9nIChcIm5vcm1hbCBub2RlXCIsIHNvdXJjZSwgdGFyZ2V0KTtcbiAgICAgICAgICAgIHRhcmdldC5hcHBlbmRDaGlsZChzb3VyY2UuY2xvbmVOb2RlKGZhbHNlKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIEB0b2RvIGNoZWNrIGlmIGl0IGlzIGEgdGVtcGxhdGUgbm9kZSBhbmQgdXNlIGNvbnRlbnRFbGVtZW50c1xuXG4gICAgLy8gV2FsayBhbGwgY2hpbGRzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2UuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY3VyU291cmNlID0gc291cmNlLmNoaWxkTm9kZXNbaV07XG4gICAgICAgIC8vIFJlbmRlciBjb250ZW50IG5vZGVzIGludG8gcHJldmlvdXMgdGFyZ2V0LlxuICAgICAgICBfX19fcmVuZGVyRm4oY3VyU291cmNlLCB0YXJnZXQpO1xuICAgIH1cbn0iLCJcbmNsYXNzIFRwbE5vZGUge1xuXG59XG5cblxuXG5cblxuXG5mdW5jdGlvbiBfX2NvbXBpbGVkX3RwbHgoc2NvcGUsIF9jdXJfbm9kZSkge1xuICAgIGZvciAodmFyIHd1cnN0IGluIHNjb3BlLmEpIHtcbiAgICAgICAgX2N1cl9ub2RlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpXG4gICAgfVxufVxuXG5cblxuY2xhc3MgVHBsQ29tcGlsZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYXR0cnMgPSB7XG4gICAgICAgICAgICBcImZvciRcIjogZnVuY3Rpb24gKHRwbE5vZGUpIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG5cblxuXG4gICAgY29tcGlsZShub2RlKSB7XG5cblxuICAgICAgICBub2RlLmdldEF0dHJpYlxuXG5cbiAgICB9XG5cblxufSIsIlxuY2xhc3MgQ0pBamF4Rm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkZvcm1FbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25zdWNjZXNzID0gbnVsbDtcbiAgICB9XG5cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYWpheC1hY3Rpb25cIiwgXCJwcmVsb2FkXCIsIFwib25zdWNjZXNzXCIsIC4uLkNKRm9ybUVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LWFjdGlvblwiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheEFjdGlvbiA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInByZWxvYWRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLnByZWxvYWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm9uc3VjY2Vzc1wiOlxuICAgICAgICAgICAgICAgIHRoaXMub25zdWNjZXNzID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgX29uX3N1Ym1pdF9jbGljayhlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmFkZENsYXNzKFwibG9hZGluZ1wiKTtcblxuICAgICAgICBsZXQgZm9ybURhdGEgPSB7fTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5lYWNoKChpLCBlKSA9PiB0aGlzLl9nYXRoZXJfZm9ybV9kYXRhKGUsIGZvcm1EYXRhKSk7XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIGxldCBhamF4T3B0aW9ucyA9IENvbXBDb3JlLmluc3RhbmNlLmFqYXhPcHRpb25zO1xuICAgICAgICBhamF4T3B0aW9uc1tcIm1ldGhvZFwiXSA9IFwicG9zdFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcInVybFwiXSA9IHRoaXMuYWpheEFjdGlvbjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJkYXRhXCJdID0gSlNPTi5zdHJpbmdpZnkoZm9ybURhdGEpO1xuICAgICAgICBhamF4T3B0aW9uc1tcImNvbnRlbnRUeXBlXCJdID0gXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCI7XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVR5cGVcIl0gPSBcImpzb25cIjtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGpRdWVyeS5hamF4KGFqYXhPcHRpb25zKS5kb25lKFxuICAgICAgICAgICAgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAvL3NlbGYuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5yZW1vdmVDbGFzcyhcImxvYWRpbmdcIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0QnV0dG9uLmFkZENsYXNzKFwic2F2ZWRcIik7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5vbnN1Y2Nlc3MgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHIgPSBldmFsKHNlbGYub25zdWNjZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByKHRoaXMsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbiA9ICQoXCJidXR0b25bdHlwZT0nc3VibWl0J10sIGlucHV0W3R5cGU9J3N1Ym1pdCddXCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24uY2xpY2soZSA9PiB0aGlzLl9vbl9zdWJtaXRfY2xpY2soZSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMgPSAkKFwiaW5wdXQsIHRleHRhcmVhLCBjaGVja2JveFwiLCB0aGlzKTtcblxuICAgICAgICBpZiAodGhpcy5wcmVsb2FkKSB7XG4gICAgICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgalF1ZXJ5LmFqYXgodGhpcy5hamF4QWN0aW9uLCBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucylcbiAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2ZpbGxfZGF0YShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otYWpheC1mb3JtXCIsIENKQWpheEZvcm1FbGVtZW50KTsiLCJcblxuY2xhc3MgQ2pTY3JpcHRFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0gc2VsZi5pbm5lclRleHQ7XG4gICAgICAgICAgICBzZWxmLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBjb250ZW50KTtcbiAgICAgICAgICAgIGV2YWwoY29udGVudCk7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgICAgICAgICBzY3JpcHQudGV4dENvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgICAgICAgICAgKi9cblxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1zY3JpcHRcIiwgQ2pTY3JpcHRFbGVtZW50KTsiXX0=