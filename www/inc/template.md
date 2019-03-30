# Template



```html
<div id="tpl">
    <p>I'm template</p>
    <div for$="data in scope">
        Hello {{ data }}
    </div>
</div>
<div id="target"></div>
<script language="JavaScript">

setTimeout(function() {
    var tpl = $("#tpl").get(0);
    var target = $("#target").get(0);
    
    console.log(tpl);
    
    cj_render(tpl, target, ["a", "b", "c"]);
}, 100);


</script>

```
<cj-exec></cj-exec>