# Template



```html
<div id="tpl">
    <p>I'm template</p>
    <div id="l1">
        <div id="l2">a</div>
        <div id="l2b" if$="scope[0] == 1">neinb</div>
        <div id="l2b" if$="scope[0] == 'a'">aja</div>
    </div>
    
    <div for$="curName in scope">
        Hello {{ scope[curName] }}
        <div if$="data == 'opt'">
            <div for$="cur of opt" class$="{someClass: cur == 'a'}">
                <p ></p>
                Scope: {{ cur }}: {{ scope.opt[cur] }}
            </div>
        
        </div>
    </div>
    <div each$="opt as ekey => evalue">
       hello {{ ekey }} : {{evalue}}
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
    
    console.log($("#target").html());
    $("#debug").text(target.innerHTML);
   
    console.log(cur, evalue);
}, 100);


</script>
```
<cj-exec></cj-exec>
