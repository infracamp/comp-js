
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