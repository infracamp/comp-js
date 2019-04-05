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
                return eval(contents);
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