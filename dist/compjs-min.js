/**
 * ComponentJS
 *
 * @author Matthias Leuffen <m@tth.es>
 */
class c{static req(e){return new CJ_Req(e)}}class ce{static _getElementById(e,t){var n=$("#"+e)[0];if(null===n)throw"Element #"+e+" not found";if(void 0!==t&&!n instanceof t)throw"Element #"+e+" not of type "+t;return n}static form(e){return ce._getElementById(e,CJFormElement)}static highlight(e){return ce._getElementById(e,CjHighlightElement)}static pane(e){return ce._getElementById(e,CJPaneElement)}static any(e){return ce._getElementById(e)}}class CJ_Req{constructor(e){this.request={url:e,method:"GET",body:null,success:!1,dataType:"text"}}withBody(e){return"GET"===this.request.method&&(this.request.method="POST"),(Array.isArray(e)||"object"==typeof e)&&(e=JSON.stringify(e)),this.request.body=e,this}set json(e){this._make_request(e,"json")}set plain(e){this._make_request(e,null)}set stream(e){this._make_request(e,"stream")}_make_request(e,t){this.request.success=function(n){"json"===t&&(n=JSON.parse(n)),e(n)},$.ajax(this.request)}}class CJHtmlElement extends HTMLElement{constructor(){super(),this.debug=!1}static get observedAttributes(){return["debug"]}attributeChangedCallback(e,t,n){switch(e){case"debug":this.debug=!0}}_log(e,t){this.debug&&console.log(this,...arguments)}}class CompCore{constructor(){this.ajaxOptions={dataType:"json",error:function(e){throw alert("Error executing form request."),"Error"}},this.ajaxOptionsHtml={error:function(e){throw alert("Error executing form request."),"Error"}}}static get instance(){return new CompCore}evalAttr(attrValue,event,ownerObj){if(console.log("eval",attrValue),null===attrValue)return null;if("string"==typeof attrValue){var context=function(e){return console.log(this),eval(attrValue)};console.log("owner",ownerObj);var ret=context.bind(ownerObj)(event);return"function"!=typeof ret?ret:ret.bind(ownerObj)(event)}if("function"==typeof attrValue)return attrValue(event,ownerObj);throw console.error("eval error:",attrValue),"Cannot evaluate expression - see output"}}class CjExecElement extends CJHtmlElement{constructor(){super()}connectedCallback(){var self=this;setTimeout(function(){var codeNode=self.previousElementSibling;"PRE"!==codeNode.tagName&&self._log("Cannot find sibling <pre> node"),codeNode=codeNode.querySelector("code"),self._log("textContent=",codeNode.textContent),self.innerHTML=codeNode.textContent,setTimeout(function(){$("script",self).each(function(idx,node){eval(node.textContent)})},1)},1)}}customElements.define("cj-exec",CjExecElement);class CjHighlightElement extends CJHtmlElement{constructor(){super(),this._value="",this._codeElement=null,this.lang="html"}static get observedAttributes(){return["lang",...CJHtmlElement.observedAttributes]}attributeChangedCallback(e,t,n){switch(super.attributeChangedCallback(e,t,n),e){case"lang":this.lang=n}}setCode(e,t){void 0===t&&(t=this.lang),this._value=e,null!==this._codeElement&&(this._codeElement.innerText=e,this._codeElement.classList.add(t),document.dispatchEvent(new Event("load")))}connectedCallback(){var e=this;setTimeout(function(){var t=e.innerHTML;e._log("content to highlight",t);var n=document.createElement("div");e.appendChild(n);var r=document.createElement("pre");n.appendChild(r);var o=document.createElement("code");r.appendChild(o),e._codeElement=o,o.classList.add(e.lang),o.style.whiteSpace="pre",""!==t.trim()&&(o.innerText=t,document.dispatchEvent(new Event("load")))},1)}}customElements.define("cj-highlight",CjHighlightElement);class CJFormElement extends CJHtmlElement{constructor(){super(),this._submittableElement=null,this._formElements=null,this.cf_onsubmit=null,self=this}get data(){return this.getData()}set data(e){this.setData(e)}static get observedAttributes(){return["onsubmit",...CJHtmlElement.observedAttributes]}attributeChangedCallback(e,t,n){switch(super.attributeChangedCallback(e,t,n),e){case"onsubmit":this.cf_onsubmit=n}}_gather_form_data(e,t){switch(e.tagName){case"INPUT":switch(e.type){case"checkbox":case"radio":return void(1==e.checked&&(t[e.name]=e.value))}case"SELECT":case"TEXTAREA":t[e.name]=$(e).val()}}getData(){var e={};return $("input, textarea, checkbox, select",this).each((t,n)=>this._gather_form_data(n,e)),this._log("getData():",e),e}_fill_form_single(e,t){var n=e.name;switch(void 0===n&&(n=e.id),e.tagName){case"INPUT":switch(e.type){case"checkbox":case"radio":return void(t[n]==e.value?e.checked=!0:e.checked=!1)}e.value=t[n];break;case"SELECT":case"TEXTAREA":e.value=t[n]}}setData(e){this._log("setData()",e),$("input, textarea, checkbox, select",this).each((t,n)=>this._fill_form_single(n,e))}_submit(e){this._log("_submit(",e,"); calling: onsubmit=",this.cf_onsubmit),CompCore.instance.evalAttr(this.cf_onsubmit,e,this)}connectedCallback(){var e=this;setTimeout(function(){e._submittableElement=e.querySelector("form"),null===e._submittableElement?(e._submittableElement=e.querySelector("button[type='submit']"),e._submittableElement.onclick=function(t){t.stopPropagation(),t.preventDefault(),e._submit(t)}):e._submittableElement.onsubmit=function(t){t.stopPropagation(),t.preventDefault(),e._submit(t)}},1)}}customElements.define("cj-form",CJFormElement);class CJOptionsElement extends CJHtmlElement{constructor(){super(),this._options=[],this._selectElementId=[]}static get observedAttributes(){return["for",...CJHtmlElement.observedAttributes]}attributeChangedCallback(e,t,n){switch(super.attributeChangedCallback(e,t,n),e){case"for":this._selectElementId=n}}refresh(){this.innerHTML="",this._options.forEach(i,e=>{if(this._log("add",i,e),"object"==typeof e)var t=e.value,n=e.text;else if("string"==typeof e)n=e;var r=document.createElement("option");r.setAttribute("value",t),r.textContent=n,this.appendChild(r)})}connectedCallback(){this._log("cj-objection connected()");var e=this;setTimeout(function(){console.log("muh"),""!==e.textContent.trim()&&(e._options=JSON.parse(e.textContent),e._log("Loading options preset from json:",e._options)),e.textContent="",e.refresh()},1)}}customElements.define("cj-options",CJOptionsElement);class CJPaneElement extends CJHtmlElement{constructor(){super(),this._src=null,this.targetNode=null,this._shadowDom=!1}static get observedAttributes(){return["src","shadow-dom",...CJHtmlElement.observedAttributes]}attributeChangedCallback(e,t,n){switch(super.attributeChangedCallback(e,t,n),e){case"src":this._src=n,null!=this._src&&this._loadUrl(this._src);break;case"shadow-dom":this._shadowDom=!0}}_loadUrl(url){console.log("load",url);var self=this;setTimeout(function(){jQuery.ajax(url,CompCore.instance.ajaxOptionsHtml).done(function(data){self.targetNode.innerHTML=data;var template=$("template",self.targetNode)[0],script=$("script",self.targetNode)[0].textContent;console.log("node",template),self.targetNode.appendChild(template.content);var e=function(script){eval(script)};e.call(self.targetNode,script)})},1)}connectedCallback(){var e=this;setTimeout(function(){e._shadowDom?(console.log("with shadow"),e.targetNode=e.attachShadow({mode:"open"})):(e.targetNode=document.createElement("div"),e.appendChild(e.targetNode))},1)}}customElements.define("cj-pane",CJPaneElement);class CJTimerElement extends CJHtmlElement{constructor(){super(),this._interval=null,this._intervalObj=null,this.targetNode=null,this._timeout=1}static get observedAttributes(){return["interval","timeout",...CJHtmlElement.observedAttributes]}attributeChangedCallback(e,t,n){switch(super.attributeChangedCallback(e,t,n),e){case"interval":this._interval=n;break;case"timeout":this._timeout=n}}clearInterval(){null!==this._intervalObj&&window.clearInterval(this._intervalObj)}connectedCallback(){var e=this;console.log("Timer connected"),setTimeout(function(){e.targetNode=document.createElement("div"),e.appendChild(e.targetNode);var t=$("template",e)[0].content;null!==e._interval&&(e._intervalObj=window.setInterval(function(){for(var n=e.targetNode;n.firstChild;)n.removeChild(n.firstChild);console.log("append",t),n.appendChild(t.cloneNode(!0))},e._interval))},e._timeout)}disconnectedCallback(){this.clearInterval()}}customElements.define("cj-timer",CJTimerElement);class CJRenderer{constructor(){CJRenderer.renderer=this}boolEval(scope,code){let ret=((scope,_code)=>{let __ret=null,gencode=`__ret = ${_code};`;return eval(gencode),__ret})(scope,code);return ret}forEval(scope,code,targetNode,tplNode){let reg=/^([a-zA-Z0-9_.\[\]]+)\s+as\s+([a-zA-Z0-9_.\[\]]+)$/.exec(code);console.log(reg);let genCode=`\n                for(let index = 0; index < ${reg[1]}.length; index++){\n                    var ${reg[2]} = ${reg[1]}[index];\n                    let curClone = tplNode.cloneNode(false);\n                    //curClone.textContent = tplNode.textContent;\n                    targetNode.appendChild(curClone);\n                    for(let i = 0; i < tplNode.childNodes.length; i++) {\n                        this.renderInto(curClone, scope, tplNode.childNodes[i]);\n                    }\n                }`;return console.log("eval",genCode),eval(genCode)}evalText(scope,text){return text.replace(/\{\{(.*?)\}\}/g,function(match,p1){let __ret=null;return eval(`__ret = ${p1};`),__ret})}registerCallbacks(targetNode,scope){let eventAttr=targetNode.getAttribute("(click)");if(null!==eventAttr){let code=this.evalText(scope,eventAttr);targetNode.addEventListener("click",e=>{eval(code)})}}renderInto(t,n,r){if(void 0===r&&(r=this.templateDom),e,a,console.log(t),r instanceof HTMLTemplateElement)for(let e=0;e<r.content.childNodes.length;e++)this.renderInto(t,n,r.content.childNodes[e]);else{if(r instanceof Text){let e=r.cloneNode(!0);return e.textContent=this.evalText(n,e.textContent),void t.appendChild(e)}if(console.log(r),this.registerCallbacks(t,n),r.hasAttribute("if$")&&!1===this.boolEval(n,r.getAttribute("if$")))return!1;if(r.hasAttribute("for$")){let e=r.getAttribute("for$");return this.forEval(n,e,t,r),!1}{let e=r.cloneNode(!1);t.appendChild(e);for(let t=0;t<r.childNodes.length;t++)this.renderInto(e,n,r.childNodes[t])}}}parseNode(e,t){let n=e.cloneNode(!0);for(let t=0;t<e.childNodes.length;t++)e.removeChild(e.childNodes[t]);let r=document.createElement(e.tagName);this.renderInto(r,t,n),e.replaceWith(r)}}class CJTplElement extends HTMLElement{constructor(){super(),this.ajaxSrc=null,this.templateNode=null,this.targetNode=null,this._data=null}reload(){var e=new CJRenderer;this.targetNode.innerHTML="",e.renderInto(this.targetNode,{},this.templateNode)}static get observedAttributes(){return["ajax-src"]}attributeChangedCallback(e,t,n){switch(console.log(this),e){case"ajax-src":this.ajaxSrc=n}}setData(e){this._data=e;var t=new CJRenderer;this.targetNode.innerHTML="",t.renderInto(this.targetNode,this._data,this.templateNode)}connectedCallback(){var e=this;setTimeout(function(){console.log("ready"),e.templateNode=e.firstElementChild,e.targetNode=document.createElement("div"),e.appendChild(e.targetNode),console.log("connect",e.templateNode)},1)}}function cj_render(source,target,scope){"use strict";for(var func={for$:(scope,_r_source,_r_target,_r_expr)=>{console.log("for",scope,this);var ____eval="for ("+_r_expr+") { ____renderFn(scope, _r_source, _r_target, true); };";try{eval(____eval)}catch(e){throw`Error in statement for$='${_r_expr}': `+e}return!1},each$:(scope,_r_source,_r_target,_r_expr)=>{var ____matches=_r_expr.match(/^(.*?) as (.*?)(\=\>(.*?))$/);if(console.log(____matches),5!=____matches.length)throw`Invalid each$='${_r_expr}' syntax.`;var ____eval=`for (${____matches[2]} in ${____matches[1]}) { ${____matches[4]} = ${____matches[1]}[${____matches[2]}]; ____renderFn(scope, _r_source, _r_target, true); };`;return console.log(____eval),eval(____eval),!1},if$:(scope,_r_source,_r_target,_r_expr)=>{console.log("if",scope,this);var _____eval="if ("+_r_expr+") { ____renderFn(scope, _r_source, _r_target, true); };";return eval(_____eval),!1},__eval__:(scope,_r_input)=>{var wurst="bah";return console.log("eval:",scope,this),_r_input=_r_input.replace(/\{\{(.*?)\}\}/g,(match,contents)=>{try{return eval(contents)}catch(e){throw`Èrror in inline statement ${match} in text block '${_r_input}': `+e}}),_r_input}},modifiers={class$:(scope,_r_source,_r_target,_r_expr,_r_resultNode)=>{eval("var _r_expr = "+_r_expr);for(let e in _r_expr)_r_expr[e]&&_r_resultNode.classList.add(e);return!0}},____renderFn=(e,t,n,r)=>{if(console.log("render.scope",e,this),console.log("node type",t.nodeType),1===t.nodeType){console.log("walk",t,n);var o=t.cloneNode(!1);if(!r)for(let e in func)if(t.hasAttribute(e)){if(console.log(e,t,n),!1===func[e].call(this,this,t,n,t.getAttribute(e),o))return}for(let r in modifiers)if(t.hasAttribute(r)){if(console.log(r,t,n),!1===modifiers[r].call(e,e,t,n,t.getAttribute(r),o))return}n.appendChild(o);for(var s=0;s<t.childNodes.length;s++){var a=t.childNodes[s];____renderFn.call({},e,a,o)}}else{if(3!==t.nodeType)return console.log("normal node",t,n),void n.appendChild(t.cloneNode(!1));var l=t.cloneNode(!1);l.textContent=func.__eval__.call(e,e,l.textContent),n.appendChild(l)}},i=0;i<source.childNodes.length;i++){var curSource=source.childNodes[i];____renderFn.call({},scope,curSource,target)}}customElements.define("cj-tpl",CJTplElement);class TplNode{}function __compiled_tplx(e,t){for(var n in e.a)t.appendChild(document.createElement("div"))}class TplCompiler{constructor(){this.attrs={for$:function(e){}}}compile(e){e.getAttrib}}class CJAjaxFormElement extends CJFormElement{constructor(){super(),this.ajaxAction=null,this.preload=!1,this.onsuccess=null}static get observedAttributes(){return["ajax-action","preload","onsuccess",...CJFormElement.observedAttributes]}attributeChangedCallback(e,t,n){switch(super.attributeChangedCallback(e,t,n),e){case"ajax-action":this.ajaxAction=n;break;case"preload":this.preload=!0;break;case"onsuccess":this.onsuccess=n}}_on_submit_click(e){e.preventDefault(),e.stopPropagation(),this._submitButton.prop("disabled",!0),this._submitButton.addClass("loading");let formData={};this._formElements=$("input, textarea, checkbox",this),this._formElements.each((e,t)=>this._gather_form_data(t,formData)),this._formElements.prop("disabled",!0);let ajaxOptions=CompCore.instance.ajaxOptions;ajaxOptions.method="post",ajaxOptions.url=this.ajaxAction,ajaxOptions.data=JSON.stringify(formData),ajaxOptions.contentType="application/json; charset=utf-8",ajaxOptions.dataType="json";var self=this;jQuery.ajax(ajaxOptions).done(function(data){if(self._submitButton.removeClass("loading"),self._submitButton.addClass("saved"),null!==self.onsuccess){let r=eval(self.onsuccess);"function"==typeof r&&r(this,data)}})}connectedCallback(){if(this._submitButton=$("button[type='submit'], input[type='submit']",this),this._submitButton.click(e=>this._on_submit_click(e)),this._formElements=$("input, textarea, checkbox",this),this.preload){this._formElements.prop("disabled",!0);let e=this;jQuery.ajax(this.ajaxAction,CompCore.instance.ajaxOptions).done(function(t){e._fill_data(t),e._formElements.prop("disabled",!1)})}}}customElements.define("cj-ajax-form",CJAjaxFormElement);class CjScriptElement extends CJHtmlElement{constructor(){super()}connectedCallback(){var self=this;setTimeout(function(){var content=self.innerText;self.textContent="",console.log("eval",content),eval(content)},1)}}customElements.define("cj-script",CjScriptElement);