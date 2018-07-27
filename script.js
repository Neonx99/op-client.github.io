// ==UserScript==
// @name         Agar Bots V3
// @namespace    https://www.NeyBots.ga/
// @version      8V
// @description  Agar.io bots after patch.
// @author       SizRex
// @match        http://agar.io/*
// @exclude      http://agar.io/agario.core.js
// @exclude      http://agar.io/mc/agario.js
// @exclude      http://agar.io/js/master.js
// @exclude      http://agar.io/main_out.js
// @run-at       document-start
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @grant        none
// ==/UserScript==a
window.bots = [];

class Client {
    constructor() {
        this.botServerIP = 'ws://35.228.204.220:8081';
        this.botServerStatus = '';
        this.agarServer = 'ws://111.222.333.444:1234';
        this.botNick = '';
        this.botMode = 'FEEDER';
        this.UUID = '';
        this.extraZoom = true;
        this.botAmount = 1;
        this.moveInterval = null;
        this.ws = null;
        this.reconnect = true;
        this.addListener();
    }

    connect() {
        this.ws = new WebSocket(this.botServerIP);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = this.onopen.bind(this);
        this.ws.onmessage = this.onmessage.bind(this);
        this.ws.onclose = this.onclose.bind(this);
        this.ws.onerror = this.onerror.bind(this);
    }

    onopen() {
        console.log('Connection to bot server open');
        $('#ServerStatus').text('Connected');
        this.sendUUID();
        this.startMoveInterval();
    }

    onmessage(msg) {
        let buf = new DataView(msg.data);
        let offset = 0;
        let opcode = buf.getUint8(offset++);
        if($("#reconnectButton").prop('disabled', false)) {
            $("#reconnectButton").prop('disabled', true);
        }
        switch (opcode) {
            case 0: {
                let addClasses = '';
                let removeClasses = '';
                switch (buf.getUint8(offset++)) {
                    case 0:
                        this.botServerStatus = 'Max Connections';
                        this.reconnect = false;
                        break;
                    case 1: // Invalid data sent
                        this.botServerStatus = 'Invalid Data Sent';
                        this.reconnect = false;
                        break;
                    case 2:
                        this.botServerStatus = 'Already connected';
                        this.reconnect = false;
                        break;
                    case 3:
                        this.botServerStatus = 'authorization...';
                        break;
                    case 4:
                        this.botServerStatus = 'Ready';
                        $('#toggleButton').replaceWith(`<button id='toggleButton' onclick='window.client.startBots();' class='btn btn-success'>Start Bots</button>`);
                        $("#slv2_bot_load").css(`width`, `0%`);
                        $(".max").html("0/0");
                        window.bots = [];
                        break;
                    case 5:
                        this.botServerStatus = 'UUID not authorized';
                        this.reconnect = false;
                        break;
                    case 6:
                        this.botServerStatus = 'Getting proxies';
                        break;
                    case 7:
                        this.botServerStatus = 'Bots started!';
                        break;
                    case 8:
                        this.botServerStatus = 'UUID/IP MISMATCH';
                        this.reconnect = false;
                        break;
                    case 9:
                        this.botServerStatus = 'Invalid agar server IP';
                        break;
                    case 10:
                        this.botServerStatus = 'Not party server.';
                        $('#toggleButton').replaceWith(`<button id='toggleButton' onclick='window.client.startBots();' class='btn btn-success'>Start Bots</button>`);
                        break;
                    case 11:
                        this.botServerStatus = 'Coins <= 5';
                        this.reconnect = false;
                        break;
                    case 12:
                        this.botServerStatus = 'Server in maintenance...';
                        this.reconnect = false;
                        break;
                }
                $("#ServerStatus").text(this.botServerStatus);
            } break;
            case 1: {
                let spawnedBots = buf.getUint16(offset, true);
                offset += 2;
                let connectedBots = buf.getUint16(offset, true);
                offset += 2;
                let maxBots = buf.getUint16(offset, true);
                offset += 2;
                let coins = buf.getFloat64(offset, true);
                offset += 2;
                if(connectedBots >= maxBots) {
                    $(".max").html(maxBots + "/" + maxBots);
                    $("#slv2_bot_load").css(`width`, `${Math.floor((maxBots / maxBots) * 100)}%`);
                } else {
                    $(".max").html(connectedBots + "/" + maxBots);
                    $("#slv2_bot_load").css(`width`, `${Math.floor((connectedBots / maxBots) * 100)}%`);
                }
                $('#timeLeft').html(`${coins}`);
            } break;
            case 2: {
                window.bots = [];
                let numBots = buf.getUint16(offset, true);
                offset += 2;
                for (let i = 0; i < numBots; i++) {
                    let xPos = buf.getInt32(offset, true) + window.offsetX;
                    offset += 4;
                    let yPos = buf.getInt32(offset, true) + window.offsetY;
                    offset += 4;
                    window.bots.push({
                        "xPos": xPos,
                        "yPos": yPos
                    });
                }
            } break;
        }
    }

    onclose() {
        console.log('Connection to bot server closed.');
        $("#reconnectButton").prop('disabled', false);
        if (this.reconnect) setTimeout(this.connect.bind(this), 150);
        if (this.moveInterval) clearInterval(this.moveInterval);
        if (!this.reconnect) return;
        $('#ServerStatus').text('Connecting...');
    }

    onerror() {}

    sendUUID() {
        let buf = this.createBuffer(2 + this.UUID.length);
        buf.setUint8(0, 0);
        for (let i = 0; i < this.UUID.length; i++) buf.setUint8(1 + i, this.UUID.charCodeAt(i));
        this.send(buf);
    }

    sendBotMode(m) {
        let mode = m ? m : this.botMode;
        let buf = this.createBuffer(2 + mode.length);
        buf.setUint8(0, 1);
        for (let i = 0; i < mode.length; i++) buf.setUint8(1 + i, mode.charCodeAt(i));
        this.send(buf);
    }

    startMoveInterval() {
        this.moveInterval = setInterval(() => {
            //this.sendPos(window.playerX, window.playerY);
            if (window.playerX && window.playerX && window.coordOffsetFixed && this.clientX && this.clientY) this.sendPos(((this.clientX - window.innerWidth / 2) / window.viewScale) + window.playerX, ((this.clientY - window.innerHeight / 2) / window.viewScale) + window.playerY);
        }, 100);
    }

    toggleAI() {
        if ($('#botAI').html() == 'ON') {
            $('#botAI').html('OFF');
            $('#botAI').removeClass('label-success');
            $('#botAI').addClass('label-danger');
            this.sendBotMode();
        }
        else {
            $('#botAI').html('ON');
            $('#botAI').removeClass('label-danger');
            $('#botAI').addClass('label-success');
            this.sendBotMode('BOTAI');
        }
    }

    startBots() {
        this.sendBotMode();
        let buf = this.createBuffer(6 + this.agarServer.length + 2 * this.botNick.length);
        let offset = 0;
        buf.setUint8(offset++, 2);
        for (let i = 0; i < this.agarServer.length; i++) buf.setUint8(offset++, this.agarServer.charCodeAt(i));
        offset++;
        for (let i = 0; i < this.botNick.length; i++) {
            buf.setUint16(offset, this.botNick.charCodeAt(i), true);
            offset += 2;
        }
        offset += 2;
        buf.setUint16(offset, this.botAmount, true);
        this.send(buf);
        $('#timeLeft').html("0");
        $('#toggleButton').replaceWith(`<button id='toggleButton' onclick='window.client.stopBots();' class='btn btn-danger'>Stop Bots</button>`);
    }

    sendPos(xPos, yPos) {
        let buf = this.createBuffer(9);
        buf.setUint8(0, 4);
        buf.setInt32(1, xPos, true);
        buf.setInt32(5, yPos, true);
        this.send(buf);
    }

    split() {
        this.send(new Uint8Array([5]));
    }

    eject() {
        this.send(new Uint8Array([6]));
    }

    addListener() {
        document.addEventListener('mousemove', event => {
            this.clientX = event.clientX;
            this.clientY = event.clientY;
        });
    }

    sendNickUpdate() {
        let buf = this.createBuffer(3 + 2 * this.botNick.length);
        let offset = 0;
        buf.setUint8(offset++, 7);
        for (let i = 0; i < this.botNick.length; i++) {
            buf.setUint16(offset, this.botNick.charCodeAt(i), true);
            offset += 2;
        }
        this.send(buf);
    }

    stopBots() {
        this.send(new Uint8Array([3]));
    }

    send(data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(data, {
            binary: true
        });
    }

    createUUID() {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 3; i++) {
            for (let a = 0; a < 7; a++) token += possible.charAt(Math.floor(Math.random() * possible.length));
            token += '-';
        }
        token = token.substring(0, token.length - 1);
        localStorage.setItem('agarUnlimited2UUID', token);
        return token;
    }

    createBuffer(len) {
        return new DataView(new ArrayBuffer(len));
    }
}

class GUITweaker {
    constructor() {
        this.removeElements();
        let check = setInterval(() => {
            if (document.readyState == "complete") {
                clearInterval(check);
                setTimeout(() => {
                    this.addBotGUI();
                    this.addGUI();
                    this.finishInit();
                    window.client.connect();
                    window.client.botMode = localStorage.getItem('botMode');
                    let UUID = localStorage.getItem('agarUnlimited2UUID');
                    $('#agarUnlimitedToken').val(UUID);
                },1500);
            }
        },100);
    }

    addBotGUI() {
        const botNick = localStorage.getItem('botNick') || '';
        const proxyTimeout = localStorage.getItem('proxyTimeout') || 15000;
        const botAmount = localStorage.getItem('botAmount') || 500;
        const botMode = localStorage.getItem('botMode');
        $('head').append(`<style type="text/css">.agario-panel,.shop-blocker{border-top: 5px solid #09f4ff; background-image: url("http://cdn.ogario.ovh/static/img/pattern.png"); background-repeat: repeat; background-position: top center;}</style>`);
        $('.partymode-info').remove();
        $('.agario-promo-container').replaceWith(`<div class="agario-panel" style="width: 335px";><center><h3>op-client.tk</h3></center><div style="margin-top: 6px;" class="input-group"><span style="width:75px;" class="input-group-addon" id="basic-addon1">UUID</span><input style="width:230px" disabled id="agarUnlimitedToken" class="form-control" placeholder="UUID" value="Creating Token..."></input></div><br><input onkeypress="return event.charCode >= 48 && event.charCode <= 57"onchange="localStorage.setItem('botAmount', this.value);window.client.botAmount=this.value;"id="botAmount"maxlength="3"class="form-control"placeholder="Bot Amount"value="${botAmount}"></input><br></span><button id="toggleButton" onclick="window.client.startBots();" class="btn btn-success">Start Bots</button><button onclick="if(!window.client.reconnect&&window.client.ws.readyState!==1){window.client.reconnect=true;window.client.connect();}else{}" class="btn btn-success" id="reconnectButton" style="float:right;">Reconnect</button></div>`);
    }

    removeElements() {
        $('#advertisement').remove();
        $('#bannerCarousel').remove();
        $('#user-id-tag').remove();
    }

    addGUI() {
        $("body").append("<style type='text/css'>#SliBots {display: none;position: fixed;top: 0;width: 800px;left: 50%;z-index: 20;font-family: 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;height: 50px!important;background-color:rgba(23, 23, 23, 0.5)!important;color:#fff!important; box-sizing: border-box;pointer-event: none;-webkit-transform: translate(-50%, 0);-ms-transform: translate(-50%, 0);transform: translate(-50%, 0);}#SliBots .slv2_logo {cursor: pointer;text-transform: uppercase;width: 150px;height: 50px;display: inline-block;vertical-align: top;margin-left: 10px;margin-right: 10px;background-image: url('https://i.imgur.com/fizBOf0.png')}#SliBots .slv2_contentc {display: inline-block;width: 100px;box-sizing: border-box;position: absolute;top: 1px;}#SliBots .slv2_contentc p {background-color: rgba(0,0,0, 0.8);border-radius: 4px;display: block;height: 38px;margin-top: 5px;margin-left: 2.5px;margin-right: 2.5px;margin-bottom: 0;font-size: 16px;line-height: 16px;padding-top: 4px;box-sizing: border-box;position: relative;color: #ffffff;text-align: center;}#SliBots p .slv2_small {font-size: 12px;display: block;}#SliBots .botsCounter {width: 140px;left: 170px;}#SliBots .feedCmd {width: 80px;right: 410px;}#SliBots .splitCmd {width: 80px;right: 330px;}#SliBots .freezeCmd {width: 80px;right: 250px;}#SliBots .botMod {width: 110px;right: 140px;}#SliBots #slv2_bot_load {position: relative;bottom: 0px;left: 0px;width: 0%;height: 2px;background-color: #00ff00;display: block;border-radius: 4px;-webkit-transition: width 2s;-moz-transition: width 2s;-o-transition: width 2s;transition: width 2s;}#SliBots .slv2_active p {background-color: rgba(0,255,0, 0.3)!important;}</style>");
        $("body").append('<div id="SliBots" style="display: block;"><div class="slv2_logo"></div><div class="slv2_contentc botsCounter"><p>Bots: <span class="max">0/0</span><span class="slv2_small expire">Allocated bots</span><span id="slv2_bot_load"></span></p></div><div id="splitB" class="slv2_contentc feedCmd"><p>Split<span class="slv2_small">Key <span class="KEYBINDING_BOT_FEED">- X</span></span></p></div><div id="ejectB" class="slv2_contentc splitCmd"><p>Eject<span class="slv2_small">Key <span class="KEYBINDING_BOT_SPLIT">- C</span></span></p></div><div id="collectB" class="slv2_contentc freezeCmd"><p>Collect<span class="slv2_small">Key <span class="KEYBINDING_FREEZE">- P</span></span></p></div><div class="slv2_contentc botMod"><p>Coins<span class="slv2_small"><span class="botmod"></span><span id="timeLeft">0s</span></span></p></div><div class="slv2_contentc" style="right: 4px; width:136px"><p>Status<span class="slv2_small"><span class="botmod"></span><span id="ServerStatus">Waiting</span></span></p></div></div>');
    }

    finishInit() {
        window.client.botMode = localStorage.getItem('botMode');
        window.client.botAmount = localStorage.getItem('botAmount') >>> 0;
        window.client.botNick = localStorage.getItem('botNick');
        let UUID = localStorage.getItem('agarUnlimited2UUID');
        $('#agarUnlimitedToken').val(UUID);
    }
}

class Macro {
    constructor() {
        this.ejectDown = false;
        this.stopped = false;
        this.speed = 15;
        setTimeout(this.addMoveHook.bind(this), 10000);
        this.addKeyHooks();
    }

    addKeyHooks() {
        window.addEventListener('keydown', this.onkeydown.bind(this));
    }

    onkeydown(event) {
        if (!window.MC || !MC.isInGame()) return;
        switch (event.which) {
            case 87:
                window.agar.core.eject();
                break;
            case 88:
                client.split();
                break;
            case 67:
                client.eject();
                break;
            case 80:
                client.toggleAI();
                break;
        }
        if (event.keyCode == 16) {
            for (let i = 0; i < 11; i++) setTimeout(window.core.split, this.speed * i);
        }
    }


    eject() {
        if (this.ejectDown) {
            window.core.eject();
            setTimeout(this.eject.bind(this), this.speed);
        }
    }

    addMoveHook() {
        window.core._setTarget = window.core.setTarget;
        window.core.setTarget = function() {
            if (!this.stopped) window.core._setTarget.apply(this, arguments);
            else window.core._setTarget(window.innerWidth / 2, window.innerHeight / 2);
        }.bind(this);
    }
}

class Minimap {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.init();
    }

    init() {
        this.createCanvas();
        requestAnimationFrame(this.drawUpdate.bind(this));
    }

    createCanvas() {
        if (!document.body) return setTimeout(this.createCanvas.bind(this), 100);
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext('2d');

        this.addCanvasCustomization();
        document.body.appendChild(this.canvas);
    }

    addCanvasCustomization() {
        this.canvas.id = "Minimap";
        this.canvas.width = 200;
        this.canvas.height = 200;
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "74.9%";
        this.canvas.style.right = "0%";
        this.drawUpdate();
    }

    clearCanvas() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    drawUpdate() {
        if (!this.ctx) return;
        this.clearCanvas();

        const cWidth = this.canvas.width;
        const cHeight = this.canvas.height;

        this.ctx.strokeStyle = "#444444";
        this.ctx.strokeWidth = 1;
        this.ctx.beginPath();
        this.ctx.globalAlpha = 0.9;
        this.ctx.rect(0, 0, cWidth, cHeight);
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.27)";
        this.ctx.fill();
        this.drawCellUpdate(window.playerX, window.playerY, "#FF0000");
        if (window.bots.length > 0) this.drawBotUpdate();
        requestAnimationFrame(this.drawUpdate.bind(this));
    }

    drawCellUpdate(x, y, color) {
        const transX = (7071 + x) / 14142 * this.canvas.height;
        const transY = (7071 + y) / 14142 * this.canvas.width;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(transX, transY, 6, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawBotUpdate() {
        for (const bot of window.bots) {
            const botTransX = (7071 + bot.xPos) / 14142 * this.canvas.height;
            const botTransY = (7071 + bot.yPos) / 14142 * this.canvas.width;

            this.ctx.fillStyle = "#FFFF00";
            this.ctx.beginPath();
            if (bot.xPos !== 0 && bot.yPos !== 0) {
                this.ctx.arc(botTransX, botTransY, 6, 0, 2 * Math.PI);
            }
            this.ctx.fill();
        }
    }
}
setTimeout(function() {
    window.minimap = new Minimap();
    window.client = new Client();
    window.gui = new GUITweaker();
    window.macros = new Macro();
    window.client.UUID = localStorage.getItem('agarUnlimited2UUID') || window.client.createUUID();
},1000);

window.draw = () => {
    if (!window.minX || !window.minY || !window.maxX || !window.maxY) return;
    const ctx = document.getElementById('canvas').getContext('2d');
    ctx.save();
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(window.minX, window.minY);
    ctx.lineTo(window.maxX, window.minY);
    ctx.lineTo(window.maxX, window.maxY);
    ctx.lineTo(window.minX, window.maxY);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    var gridl = Math.round(window.minX) + 40,
        gridt = Math.round(window.minY) + 40,
        gridc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' ['split'](''),
        gridr = (Math.round(window.maxX) - 40 - gridl) / 5,
        gridb = (Math.round(window.maxY) - 40 - gridt) / 5;
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = 0.2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 0.6 * gridr + 'px Ubuntu';
    ctx.fillStyle = '#7a7a7a';
    for (var i = 0; 5 > i; i++) {
        for (var n = 0; 5 > n; n++) {
            ctx.fillText(gridc[i] + (n + 1), gridl + gridr * n + gridr / 2, gridt + gridb * i + gridb / 2)
        }
    };
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 80;
    ctx.strokeStyle = "#7a7a7a";
    for (i = 0; 5 > i; i++) {
        for (n = 0; 5 > n; n++) {
            ctx.strokeRect(gridl + gridr * n, gridt + gridb * i, gridr, gridb)
        }
    };
    ctx.stroke();
    ctx.restore();
    window.core.setFpsCap(120);
}


$.ajax('http://agar.io/agario.core.js', { // edit core for get server IP, player position and etc
    success: core => {
        core = core.replace(/([\w$]+\(\d+,\w\[\w>>2\]\|0,(\+\w),(\+\w)\)\|0;[\w$]+\(\d+,\w\[\w>>2\]\|0,\+-(\+\w\[\w\+\d+>>3\]),\+-(\+\w\[\w\+\d+>>3\])\)\|0;)/i, '$1 window.viewScale=$2; if(window.core.setFpsCap) {window.core.setFpsCap(999)};if (window.coordOffsetFixed) { window.playerX=$4+window.offsetX; window.playerY=$5+window.offsetY;} if(window.draw){window.draw();}');
        core = core.replace(/(\w\[\w\+(\d+)>>3]=(\w);\w\[\w\+(\d+)>>3]=(\w);\w\[\w\+(\d+)>>3]=(\w);\w\[\w\+(\d+)>>3]=(\w);\w\=\w\+(\d+)\|(\d+);)/i, '$1 function setMapCoords(_0x7e8bx1, _0x7e8bx2, _0x7e8bx3, _0x7e8bx4, _0x7e8bx5, _0x7e8bx6) { if (_0x7e8bx6 - _0x7e8bx5 == 24) { if (_0x7e8bx3 - _0x7e8bx1 > 14E3) { if (_0x7e8bx4 - _0x7e8bx2 > 14E3) { window.offsetX = 7071.067811865476 - _0x7e8bx3; window.offsetY = 7071.067811865476 - _0x7e8bx4; window.minX = _0x7e8bx1;window.minY=_0x7e8bx2;window.maxX=_0x7e8bx3;window.maxY=_0x7e8bx4; window.coordOffsetFixed = true; } } } } setMapCoords($3,$5,$7,$9,$2,$8);');
        core = core.replace(/var (\w)=new WebSocket\((\w\(\w\))\);/, 'window.client.agarServer=$2;var $1=new WebSocket(window.client.agarServer);');
        eval(core);
    },
    dataType: 'text',
    method: 'GET',
    cache: false,
    crossDomain: true
});

if (!localStorage.getItem('showMinimap')) localStorage.setItem('showMinimap', true);
if (!localStorage.getItem('botMode')) localStorage.setItem('botMode', 'FEEDER');
if (!localStorage.getItem('botNick')) localStorage.setItem('botNick', 'MrSonicMaster');
if (!localStorage.getItem('botAmount')) localStorage.setItem('botAmount', 10);
if (!localStorage.getItem('extraZoom')) localStorage.setItem('extraZoom', true);
JSON.parse(localStorage.getItem('showMinimap')) ? $("#Minimap").show() : $("#Minimap").hide();