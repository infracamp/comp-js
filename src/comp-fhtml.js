


function fhtml(input) {
    return input;
}



class CompFhtml extends HTMLScriptElement {
    constructor() {
        super();
    }


    connectedCallback() {
        console.log(this.innerText);
    }
}




customElements.define("comp-fhtml", CompFhtml, {extends: 'script'});
