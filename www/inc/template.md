# Template



```html
<div id="tpl">
    <p>I'm template</p>
    <div id="l1">
        <div id="l2">a</div>
        <div id="l2b" if$="scope[0] == 1">neinb</div>
        <div id="l2b" if$="scope[0] == 'a'">aja</div>
    </div>
    
    <div for$="data in scope">
        Hello {{ data }}
        <div if$="data == 'opt'">
            <div for$="cur in scope.opt" class$="{someClass: cur == 'a'}">
                <p ></p>
                Scope: {{ cur }}: {{ scope.opt[cur] }}
            </div>
        
        </div>
    </div>
</div>
Target:
<div id="target"></div>

<pre id="debug"></pre>
<script language="JavaScript">

setTimeout(function() {
    var tpl = $("#tpl").get(0);
    var target = $("#target").get(0);
    
    console.log(tpl);
    
    cj_render(tpl, target, {"arr": ["a", "b", "c"], "arr2": "b", "opt": {"a": "a1", "b": "b1"}});
    setTimeout((e) => {
        console.log($("#target").html());
        $("#debug").text(target.innerHTML);
    }, 100)
    
}, 100);


</script>

```
<cj-exec></cj-exec>