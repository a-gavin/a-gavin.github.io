function copyText() {

    /* email value */
    var uname    = "a_gavin";
    var domain   = "icloud.com";
    var copyText = uname + "@" + domain;
  
     /* copy the text inside the text field */
    navigator.clipboard.writeText(copyText);
  
    /* alert the copied text */
    alert("copied email to clipboard");
  }