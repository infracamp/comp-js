
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