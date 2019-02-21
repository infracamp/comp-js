# Http Requests `c.req(url)`

A streamline, less code http-request object.

## Basic usage

Make a simple http request:

```js
c.req("http://google.de").plain = (data) => console.log(data);
```

## Examples

### Using inline HTML

<cj-highlight>
<div id="id1">Hello</div>
<button onclick="c.req('/data/form.json').plain = (data) => {console.log(data); ce.any('id1').innerText = data;}">Load Ajax</button>
</cj-highlight>


### Parsing JSON

<cj-highlight>
<div id="json1"></div>
<cj-script language="Javascript">
console.log("eval ready");
c.req('/data/form.json').json = (jsonData) => ce.any('json1').innerText = jsonData["text1"]; 
</cj-script>
</cj-highlight>
