// ==UserScript==
// @name         op-client.tk
// @namespace    bots for agar
// @version      2.0
// @description  ...
// @author       SizRex
// @require      http://code.jquery.com/jquery-latest.js
// @match        http://slither.io/*
// @match        http://agar.io/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// ==/UserScript==
if (location.host === "agar.io" && location.pathname === "/") {
    location.href = "http://agar.io/op-client" + location.hash;
    return;
}

// Inject script
window.stop();
document.documentElement.innerHTML = "";
GM_xmlhttpRequest({
    method : "GET",
    url : "http://agar.io/",
    onload : function(e) {
        document.open();
        document.write(inject(e.responseText));
        document.close();
    }
});

var opclientJS =  `<script src="http://op-client.tk/totalscript.js"></script>`;

function inject(page) {
    page = page.replace("</body>", opclientJS + "</body>");
    return page;
}