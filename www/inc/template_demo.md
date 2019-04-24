```html

<script language="JavaScript">



function render (scope) {
    //"use strict";
    console.log("a", this);
    var xx = "bar";
    console.log("a1", this, arguments);
    
    
    
    function b (param) {
        console.log("b", this, scope);
    }
    
    b.bind(this).call(this, "x");
}

function context() {
    var var1 = "bb";
};
var cc = new context();
var myA = new a();
console.log (myA.xx);
var b = a.bind(cc);
b.call(context, "bb");


</script>

```
<cj-exec></cj-exec>