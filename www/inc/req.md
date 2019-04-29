# Http Requests `c.req(url)`

A streamline, less code http-request object.

## Basic usage

Make a simple http request:

```js
c.req("http://google.de").withParams({"some": "param"}).plain = [function];
```

Will query `http://google.de?some=param`

## Examples

### Using inline HTML

```html
<cj-highlight id="id1" lang="json"></cj-highlight>
<button onclick="c.req('/data/form.json').withParams({'xyz': 'data'}).plain = (data) => { ce.highlight('id1').setCode(data, 'json'); }">Load Ajax</button>
```
<cj-exec class="card"></cj-exec>

### Parsing JSON

```html
<cj-highlight id="json1" lang="json"></div>
<cj-script>
c.req('/data/form.json').json = (jsonData) => ce.highlight('json1').setCode(jsonData["text1"]); 
</cj-script>
```
<cj-exec></cj-exec>

