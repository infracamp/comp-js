# Forms `<cj-form></cj-form>`

```html
<cj-form
    onsubmit="Action to execute on submit">
</cj-form>

```


An easy way to read and write form data.


## Examples

### Read form values

<cj-highlight>
<div id="formData1"></div>
<cj-form onsubmit="ce.any('formData1').innerText = JSON.stringify(this.data)">
    <form>
        <input type="text" name="name1">
        <input type="text" name="name2">
        <input type="checkbox" name="check1" value="yess">
        <button type="submit">Send</button>
    </form>
</cj-form>
</cj-highlight>

### Set form values

<cj-highlight>
<cj-form id="set_form_1">
    <form>
        <input type="text" name="name1">
        <input type="text" name="name2">
        <input type="checkbox" name="check1" value="yess">
    </form>
</cj-form>
<button onclick="ce.form('set_form_1').data = {name1: 'some value', check1: 'yess'}">Set Data</button>
</cj-highlight>
