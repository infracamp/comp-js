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
