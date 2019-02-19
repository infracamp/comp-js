# comp-form :: ajax formular sending

```html
<comp-form 
    ajax-action="ajax.json"
    >
    
    <input type="text" name="test1">
    <select name="select1"></select>
    <button type="submit" name="send">Click me</button>
</comp-form>
```

Data input (GET-Request)
```json
{
  "test1": "some Value for"
}
```

Sending Data (POST-Request)