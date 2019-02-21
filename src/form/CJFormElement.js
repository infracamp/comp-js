
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