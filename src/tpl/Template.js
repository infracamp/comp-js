/**
 *
 * @param {Node} source
 * @param {Node} target
 * @param scope
 */
function cj_render(source, target, scope) {

    var func = {

        "for$": (source, target, expr) => {
            console.log("expr", expr);
            var curSource = source.cloneNode(false);
            curSource.removeAttribute("for$");
            var _eval = 'for (' + expr + ") { render(curSource, target); };";
            eval(_eval);
            return false;
        },
        "if$": (source, target, expr) => {
            var curSource = source.cloneNode(false);
            curSource.removeAttribute("for$");
            var _eval = 'if (' + expr + ") { render(curSource, target) }";
            eval(_eval);
            return true;
        },
        "__eval__": (expr) => {

        }
    };

    var render = (source, target) => {
        console.log (source);
        if (source.nodeType !== 3)
        for (curFunc in func) {
            console.log(curFunc, source);
            if (source.hasAttribute(curFunc)) {

                console.log("muh");
                var ret = func[curFunc](source, target, source.getAttribute(curFunc));
                if (ret === false)
                    return;
            }
        }
        console.log ("source", source);
        for (var i = 0; i < source.childNodes.length; i++) {
            var curSource = source.childNodes[i];
            var newNode = curSource.cloneNode(false);
            console.log("render", curSource);
            target.appendChild(newNode);
            render(newNode, curSource);

        }
    };
    // @todo check if it is a template node and use contentElements
    render(source, target);
}