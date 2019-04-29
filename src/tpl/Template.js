/**
 *
 * @param {Node} source
 * @param {Node} target
 * @param scope
 */
function cj_render(source, target, scope) {
    "use strict";


    var __reservedWords = [
        "new", "let", "var", "const", "scope", "true", "false", "in", "of"
    ];

    function rewriteExpre(expr) {
        return expr.replace(/(^|\s|\[|\()(\w+)/g, (match, space, varName) => {
                console.log("matches", space, varName);
                if (__reservedWords.indexOf(varName) > -1)
                    return match;
                if (!isNaN(parseFloat(varName)) && isFinite(varName))
                    return match;
                return space + "scope." + varName;
            });
    }

    var func = {

        "for$": (scope, _r_source, _r_target, _r_expr) => {

            var ____eval = 'for (' + _r_expr + ") { ____renderFn(scope, _r_source, _r_target, true); };";
            console.log("for", scope, this, _r_expr, ____eval);
            try {
                eval(____eval);
            } catch (_e) {
                throw `Error in statement for$='${_r_expr}': ` + _e;
            }
            return false;
        },
        "each$": (scope, _r_source, _r_target, _r_expr) => {
            var ____matches = _r_expr.match(/^(.*?) as (.*?)(\=\>(.*?))$/);
            console.log(____matches);
            if (____matches.length == 5) {
                var ____eval = `for (${____matches[2]} in ${____matches[1]}) { ${____matches[4]} = ${____matches[1]}[${____matches[2]}]; ____renderFn(scope, _r_source, _r_target, true); };`;
            } else {
                throw `Invalid each$='${_r_expr}' syntax.`;
            }
            console.log(____eval);
            eval(____eval);
            return false;
        },
        "if$": (scope, _r_source, _r_target, _r_expr) => {
            console.log("if", scope, this, _r_expr);
            var _____eval = 'if (' + _r_expr + ") { ____renderFn(scope, _r_source, _r_target, true); };";
            eval(_____eval);
            return false;
        },
        "__eval__": (scope, _r_input) => {
            var wurst = "bah";
            console.log("eval:", scope, this);
            _r_input = _r_input.replace(/\{\{(.*?)\}\}/g, (match, contents) => {
                try {
                    contents = rewriteExpre(contents);
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
        "class$": (scope, _r_source, _r_target, _r_expr, _r_resultNode) => {
            eval("var _r_expr = " + _r_expr);
            for (let __curClassName in _r_expr) {
                if (_r_expr[__curClassName]) {
                    _r_resultNode.classList.add(__curClassName);
                }
            }
            return true;
        }
    };

    var ____renderFn = (scope, source, target, noParseAttrs) => {
        console.log ("render.scope", scope, this);
        console.log ("node type", source.nodeType);
        if (source.nodeType === 1) {
            console.log("walk", source, target)

            var newTarget = source.cloneNode(false);
            if ( ! noParseAttrs) {
                for (let curFunc in func) {
                    if (source.hasAttribute(curFunc)) {
                        console.log(curFunc, source, target);
                        let ret = func[curFunc].call(scope, scope, source, target, rewriteExpre(source.getAttribute(curFunc)), newTarget);
                        if (ret === false)
                            return;
                    }
                }
            }

            for (let curFunc in modifiers) {
                if (source.hasAttribute(curFunc)) {
                    console.log(curFunc, source, target);
                    let ret = modifiers[curFunc].call(scope, scope, source, target, rewriteExpre(source.getAttribute(curFunc)), newTarget);
                    if (ret === false)
                        return;
                }
            }

            target.appendChild(newTarget);

            for (var i1 = 0; i1 < source.childNodes.length; i1++) {
                var curSource1 = source.childNodes[i1];


                // Render content nodes into previous target.
                ____renderFn.call({}, scope, curSource1, newTarget);
            }
        } else if (source.nodeType === 3) {
            var _new_elem = source.cloneNode(false);
            _new_elem.textContent = func.__eval__.call(scope, scope, _new_elem.textContent);
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
        ____renderFn.call({}, scope, curSource, target);
    }
}