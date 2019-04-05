/**
 *
 * @param {Node} source
 * @param {Node} target
 * @param scope
 */
function cj_render(source, target, scope) {

    var func = {

        "for$": (_r_source, _r_target, _r_expr) => {
            console.log("expr", _r_expr);


            var _eval = 'for (' + _r_expr + ") { render(_r_source, _r_target, true); };";
            eval(_eval);
            return false;
        },
        "if$": (_r_source, _r_target, _r_expr) => {
            var _eval = 'if (' + _r_expr + ") { render(_r_source, _r_target, true); };";
            console.log (_eval);
            eval(_eval);
            return false;
        },
        "__eval__": (_r_input) => {
            _r_input = _r_input.replace(/\{\{(.*?)\}\}/g, (match, contents) => {
                return eval(contents);
            });
            return _r_input;
        }
    };

    var render = (source, target, noParseAttrs) => {
        console.log ("node type", source.nodeType);
        if (source.nodeType === 1) {
            console.log("walk", source, target)

            if ( ! noParseAttrs) {
                for (curFunc in func) {
                    if (source.hasAttribute(curFunc)) {
                        console.log(curFunc, source, target);
                        var ret = func[curFunc](source, target, source.getAttribute(curFunc));
                        if (ret === false)
                            return;
                    }
                }
            }


            var newTarget = source.cloneNode(false);
            target.appendChild(newTarget);

            for (var i1 = 0; i1 < source.childNodes.length; i1++) {
                var curSource1 = source.childNodes[i1];


                // Render content nodes into previous target.
                render(curSource1, newTarget);
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
        render(curSource, target);
    }
}