function copyText() {

    /* email value */
    var copyText = "a_gavin@icloud.com";
  
     /* copy the text inside the text field */
    navigator.clipboard.writeText(copyText);
  
    /* alert the copied text */
    alert("copied email to clipboard");
  }