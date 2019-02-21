# 


## Don'ts


### Dont overwrite html event handler names

```js
constructor() {
    this.onsubmit = null
}
```

### Loading of element content not ready on connect
Affected in Chrome / Opera:

Solution:
```js
connectedCallback() {
    var self = this;
    /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
    setTimeout( function () {
        // Access childElements / Shadow dom from here
    }, 1);
}
```

