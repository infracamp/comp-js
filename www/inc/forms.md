# Forms `<cj-form></cj-form>`

```html
<cj-form
    onsubmit="Action to execute on submit">
</cj-form>

```


An easy way to read and write form data.


## Examples

### Read form values

```html
<div id="formData1"></div>
<cj-form onsubmit="ce.any('formData1').innerText = JSON.stringify(this.data)">
    <form oninput="output.value=JSON.stringify(this.data)">
        <input type="text" name="name1"\>
        <input type="text" name="name2"\>
        <input type="checkbox" name="check1" value="yess"\>
        <input type="radio" name="radio1" value="a"\>
        <input type="radio" name="radio1" value="b"\>
        <select name="select1"\>
            <option value="a">A</option>
            <option value="b">B</option>
        </select>
        <input name="input_datalist1" list="datalist1">
        <datalist id="datalist1">
            <option value="Some Value1">
            <option value="Some Val 2">            
        </datalist>
        <button type="submit">Send</button>
        <output name="output">
        </output>
    </form>
</cj-form>
```
<cj-exec></cj-exec>
### Set form values


```html
<cj-form id="set_form_1">
    <form>
        <input type="text" name="name1"\>
        <input type="text" name="name2"\>
        <input type="checkbox" name="check1" value="yess">
        <input type="radio" name="radio1" value="a">
        <input type="radio" name="radio1" value="b">
        <select name="select1">
           
            <option value="a">A</option>
            <option value="b">B</option>
           
        </select>
        <input name="input_datalist1" list="datalist1">
        <datalist id="datalist1">
        
            <option value="Some Value1">
            <option value="Some Val 2">            
        </datalist>
        <output name="output">
        </output>
    </form>
</cj-form>

<button onclick="ce.form('set_form_1').data = {name1: 'some value', check1: 'yess', radio1: 'a', select1: 'b'}">Set Data</button>
```
<cj-exec></cj-exec>


### Set options of select fields


```html

<select name="select1">
<cj-options></cj-options>
    <cj-options debug>
    ["a", "b", "c"]
    </cj-options>
</select>       
```
<cj-exec></cj-exec>
