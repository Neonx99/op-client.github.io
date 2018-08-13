if (window.location.origin == "http://agar.io") {

    window.bots = [];

    class Client {
        constructor() {
            this.totalUsers = 0;
            this.botServerIP = 'ws://35.231.22.25:8081';
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
            $('#serverStatus').text('Connected');
            this.sendUUID();
            this.startMoveInterval();
        }

        onmessage(msg) {
            let buf = new DataView(msg.data);
            let offset = 0;
            let opcode = buf.getUint8(offset++);
            if ($("#reconnectButton").prop('disabled', false)) {
                $("#reconnectButton").prop('disabled', true);
            }
            switch (opcode) {
                case 0:
                    {
                        let addClasses = '';
                        let removeClasses = '';
                        switch (buf.getUint8(offset++)) {
                            case 0:
                                this.botServerStatus = 'Max сonnections';
                                this.reconnect = false;
                                break;
                            case 1:
                                this.botServerStatus = 'Invalid Data';
                                this.reconnect = false;
                                break;
                            case 2:
                                this.botServerStatus = 'IP limit';
                                this.reconnect = false;
                                break;
                            case 3:
                                this.botServerStatus = 'auth...';
                                break;
                            case 4:
                                this.botServerStatus = 'Ready';
                                $('#toggleButton').replaceWith(`<button id='toggleButton' onclick='window.client.startBots();' class='btn btn-success'>Start Bots</button>`);
                                $("#botCounter").html("0/0");
                                window.bots = [];
                                break;
                            case 5:
                                this.botServerStatus = 'UUID not auth';
                                this.reconnect = false;
                                break;
                            case 6:
                                this.botServerStatus = 'Getting proxies';
                                break;
                            case 7:
                                this.botServerStatus = 'Bots started!';
                                break;
                            case 8:
                                this.botServerStatus = 'Auth error!';
                                this.reconnect = false;
                                break;
                            case 9:
                                this.botServerStatus = 'Invalid server';
                                break;
                            case 10:
                                this.botServerStatus = 'Not party server.';
                                $('#toggleButton').replaceWith(`<button id='toggleButton' onclick='window.client.startBots();' class='btn btn-success'>Start Bots</button>`);
                                break;
                            case 11:
                                this.botServerStatus = 'Coins are over!';
                                this.reconnect = false;
                                break;
                            case 12:
                                this.botServerStatus = 'Server in maintenance...';
                                this.reconnect = false;
                                break;
                            case 13:
                                this.totalUsers = buf.getUint8(offset++, true);
                                $("#userStatus").css("display", "block");
                                $("#usersCounter").text(this.totalUsers);
                                break;
                        }
                        $("#serverStatus").text(this.botServerStatus);
                    }
                    break;
                case 1:
                    {
                        let spawnedBots = buf.getUint16(offset, true);
                        offset += 2;
                        let connectedBots = buf.getUint16(offset, true);
                        offset += 2;
                        let maxBots = buf.getUint16(offset, true);
                        offset += 2;
                        let coins = buf.getFloat64(offset, true);
                        offset += 2;
                        if (connectedBots >= maxBots) {
                            $("#botCounter").html(maxBots + "/" + maxBots);
                        } else {
                            $("#botCounter").html(connectedBots + "/" + maxBots);
                        }
                        $('#coinsCounter').html(`${coins}`);
                    }
                    break;
                case 2:
                    {
                        window.bots = [];
                        let numBots = buf.getUint16(offset, true);
                        offset += 2;
                        for (let i = 0; i < numBots; i++) {
                            let xPos = buf.getInt32(offset, true);
                            offset += 4;
                            let yPos = buf.getInt32(offset, true);
                            offset += 4;
                            window.bots.push({
                                "xPos": xPos,
                                "yPos": yPos
                            });
                        }
                    }
                    break;
            }
        }

        onclose() {
            console.log('Connection to bot server closed.');
            $("#reconnectButton").prop('disabled', false);
            if (this.reconnect) setTimeout(this.connect.bind(this), 150);
            if (this.moveInterval) clearInterval(this.moveInterval);
            if (!this.reconnect) return;
            $('#serverStatus').text('Connecting...');
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
            } else {
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
        sUUID(a) {
            if (a) {
                $("#UUID").text(localStorage.getItem('agarUnlimited2UUID'));
            } else if (!a) {
                $("#UUID").text("hover for show");
            }
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
                    }, 10000);
                }
            }, 100);
        }

        addBotGUI() {
            const botAmount = localStorage.getItem('botAmount') || 500;
            const botMode = localStorage.getItem('botMode');
            $('head').append(`<style type="text/css">.agario-panel,.shop-blocker,#mainui-grid{border-top: 5px solid #09f4ff; background-image: url("http://cdn.ogario.ovh/static/img/pattern.png"); background-repeat: repeat; background-position: top center;}</style>`);
            $('.partymode-info').remove();
            $('.agario-promo').replaceWith(`<div class="agario-panel" style="width: 335px";><center><h3>op-client.tk</h3></center><input onkeypress="return event.charCode >= 48 && event.charCode <= 57"onchange="localStorage.setItem('botAmount', this.value);window.client.botAmount=this.value;"id="botAmount"maxlength="3"class="form-control"placeholder="Bot Amount"value="${botAmount}"></input><br></span><button id="toggleButton" onclick="window.client.startBots();" class="btn btn-success">Start Bots</button><button onclick="if(!window.client.reconnect&&window.client.ws.readyState!==1){window.client.reconnect=true;window.client.connect();}else{}" class="btn btn-success" id="reconnectButton" style="float:right;">Reconnect</button></div>`);
        }

        removeElements() {
            $('#advertisement').remove();
            $('#bannerCarousel').remove();
            $('#user-id-tag').remove();
        }

        addGUI() {
            $("body").append(`<div style="position:fixed; min-width: 200px; z-index:9999; min-height: 100px; max-width: 900px; max-height: 200px"><div id="botSector" style="min-width: 25px;color:#fff; min-height: 25px;background: #333;max-width: 200px; max-height: 200px; border-radius: 10px"><div id="botText" style="margin-left: 10px;color:#fff0; width: 49px; height: 53; background: url('https://i.imgur.com/WZdqjIs.png') no-repeat;background-position-y: 1px;background-size: 45%">_<span style="color: #fff; margin-left: 15px; ">Minions:</span><span style="color: #fff; margin-left: 5px;"id="botCounter">0/0</span></div></div><div id="botSector" style="min-width: 25px;color:#fff; min-height: 25px;background: #333;max-width: 200px; max-height: 200px; border-radius: 10px; margin-top: 5px"><div id="botText" style="margin-left: 10px;color:#fff0; width: 49px; height: 53; background: url('https://i.imgur.com/bIUuG5a.png') no-repeat;background-position-y: 1px;background-size: 45%">_<span style="color: #fff; margin-left: 15px; ">Coins:</span><span style="color: #fff; margin-left: 5px;"id="coinsCounter">0</span></div></div><div id="botSector" style="min-width: 25px;color:#fff; min-height: 25px;background: #333;max-width: 200px; max-height: 200px; border-radius: 10px; margin-top: 5px"><div id="botText" style="margin-left: 10px;color:#fff0; width: 100%; background: url('https://i.imgur.com/F8B58GB.png') no-repeat;background-position-y: 1px;background-size: 11%">_<span style="color: #fff; margin-left: 15px; ">Status:</span><span style="color: #fff; margin-left: 5px;"id="serverStatus">Waiting</span></div></div><div id="userStatus" style="display: none;min-width: 25px;color:#fff; min-height: 25px;background: #333;max-width: 200px; max-height: 200px; border-radius: 10px; margin-top: 5px"><div id="botText" style="margin-left: 10px;color:#fff0; width: 100%; background: url('https://i.imgur.com/H9UAQ5Q.png') no-repeat;background-position-y: 1px;background-size: 11%">_<span style="color: #fff; margin-left: 15px; ">Users right now:</span><span style="color: #fff; margin-left: 5px;"id="usersCounter">0</span></div></div><div id="UUIDSector" style="text-align: center;min-width: 25px;color:#fff; min-height: 25px;background: #333;max-width: 900px; max-height: 200px; border-radius: 10px; margin-top: 5px"><span style="color: #fff;">User token ( UUID )</span><span onmouseover="window.client.sUUID(true);" onmouseout="window.client.sUUID(false);" style="color: #fff; margin-left: -10px;display:block;" class="label label-info" id="UUID">hover for show</span></div></div></div>`);
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
    }, 1000);

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
        window.core.setFpsCap(120);
    }


    $.ajax('http://agar.io/agario.core.js', {
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
    if (!localStorage.getItem('botAmount')) localStorage.setItem('botAmount', 100);
    if (!localStorage.getItem('extraZoom')) localStorage.setItem('extraZoom', true);
    JSON.parse(localStorage.getItem('showMinimap')) ? $("#Minimap").show() : $("#Minimap").hide();
} else if (window.location.origin == "http://slither.io") {
    window.bots = [];
    window.fcbots = [];

    window.c_loc = {
        x: 0,
        y: 0,
        bX: 0,
        bY: 0,
        mX: 0,
        mY: 0,
        sX: 0,
        sY: 0,
        gZ: 0,
        sI: `35.228.204.220:8082`,
        gI: null,
        nM: true,
        cSD: false,
        mM: false,
        bB: false,
        bF: false,
        wCSP: true,
        sDS: null,
        sDP: null,
        uF: null
    };

    function starter() {
        var _this = this;
        _this.gU = localStorage.getItem("mU");
        if (!_this.gU) {
            _this.gU = localStorage.setItem("mU", `${_this.cU()}`);
            location.reload();
        }
        _this.bP = [];
        _this.ws = null;
        _this.open = false;
        _this.close = false;
        _this.AddEventMousemove = false;
        _this.sGD = null;
        _this.getAppData();
        _this.addEventListener(`keydown`);
        _this.addEventListener(`keyup`);
        setTimeout(function() {
            _this.rSocial();
        }.bind(_this), 3333);
        _this.cts(window.c_loc.sI);
    }

    starter.prototype.getPosition = function() {
        var _this = this;
        if (!_this.AddEventMousemove) {
            _this.addEventListener("mousemove");
            _this.AddEventMousemove = true;
        } else if (_this.AddEventMousemove) {
            if (window.location.origin == "http://slither.io") {
                if (['snake'] != undefined) {
                    window.c_loc.mX = (window.c_loc.sX - innerWidth / 2) / window.gsc + window.c_loc.x;
                    window.c_loc.mY = (window.c_loc.sY - innerHeight / 2) / window.gsc + window.c_loc.y;
                    if (window.c_loc.wCSP) {
                        window.c_loc.bX = window.c_loc.mX - ((window.c_loc.sX - innerWidth / 2) / window.gsc);
                        window.c_loc.bY = window.c_loc.mY - ((window.c_loc.sY - innerHeight / 2) / window.gsc);
                    }
                }
            } else {
                window.c_loc.bX = window.c_loc.x - ((window.c_loc.sX - innerWidth / 2) / window.gsc);
                window.c_loc.bY = window.c_loc.y - ((window.c_loc.sY - innerHeight / 2) / window.gsc);
            }
        }
    };

    starter.prototype.sUUID = function(a) {
        if (a) {
            $("#UUID").text(localStorage.getItem('mU'));
        } else if (!a) {
            $("#UUID").text("hover for show");
        }
    }

    starter.prototype.addEventListener = function(event) {
        if (event == `mousemove`) {
            document.addEventListener(event, function(e) {
                window.c_loc.sX = e.clientX;
                window.c_loc.sY = e.clientY;
            });
        } else if (event == `keydown`) {
            document.addEventListener(event, function(e) {
                switch (e.keyCode || e.which) {
                    case 88:
                        {
                            if (!window.c_loc.bB) {
                                window.c_loc.bB = true;
                                if (window.c_loc.uF.ws.readyState == 1) {
                                    window.c_loc.uF.ws.send(window.c_loc.uF.sf("true", 5));
                                }
                                $("#boostB").addClass("slv2_active");
                            }
                        }
                        break;
                    case 90:
                        {
                            if (!window.c_loc.mM) {
                                window.c_loc.mM = true;
                            } else if (window.c_loc.mM) {
                                window.c_loc.mM = false;
                            }
                        }
                        break;
                    case 67:
                        {
                            if (!window.c_loc.bF) {
                                window.c_loc.bF = true;
                                if (window.c_loc.uF.ws.readyState == 1) {
                                    window.c_loc.uF.ws.send(window.c_loc.uF.so(window.c_loc.x, window.c_loc.y, 4));
                                }
                                $("#freezeB").addClass("slv2_active");
                            } else if (window.c_loc.bF) {
                                window.c_loc.bF = false;
                                if (window.c_loc.uF.ws.readyState == 1) {
                                    window.c_loc.uF.ws.send(window.c_loc.uF.so(window.c_loc.x, window.c_loc.y, 4));
                                }
                                $("#freezeB").removeClass("slv2_active");
                            }
                        }
                        break;
                }
            });
        } else if (event == `keyup`) {
            document.addEventListener(event, function(e) {
                switch (e.keyCode || e.which) {
                    case 88:
                        {
                            if (window.c_loc.bB) {
                                window.c_loc.bB = false;
                                if (window.c_loc.uF.ws.readyState == 1) {
                                    window.c_loc.uF.ws.send(window.c_loc.uF.sf("false", 5));
                                }
                                $("#boostB").removeClass("slv2_active");
                            }
                        }
                        break;
                }
            });
        }
    }

    starter.prototype.getAppData = function() {
        var _this = this;
        if (window.location.origin == "http://slither.io") {
            if (_this.sGD == null) {
                _this.sGD = setInterval(function() {
                    if (window.snake != undefined) {
                        window.c_loc.x = window.snake.xx;
                        window.c_loc.y = window.snake.yy;
                        window.c_loc.gI = "ws://" + window.bso.ip + ":" + window.bso.po + "/slither";
                        _this.getPosition();
                    }
                }.bind(_this), 100);
            }
        } else if (window.location.origin == "http://agar.bio") {
            window.WebSocket.prototype.prototype.fakeData = window.WebSocket.prototype.prototype.send;
            window.WebSocket.prototype.prototype.send = function() {
                this.fakeData.apply(this, arguments);
                if (this.url != "ws://" + window.c_loc.sI + "/") {
                    window.c_loc.gI = this.url;
                    var app = new DataView(arguments[0]);
                    this.addEventListener("message", function(msg) {
                        var buf = new DataView(msg.data);
                        var off = 0;
                        switch (buf.getUint8(0, true)) {
                            case 64:
                                {
                                    var minX = buf.getFloat64(1, true);
                                    var minY = buf.getFloat64(9, true);
                                    var maxX = buf.getFloat64(17, true);
                                    var maxY = buf.getFloat64(25, true);
                                    console.log(maxX + maxY)
                                    if (maxX + maxY > 14141) {
                                        window.c_loc.nM = false;
                                    }
                                }
                                break;
                        }
                    });
                    if (app.byteLength == 21) {
                        window.c_loc.x = app.getFloat64(1, true);
                        window.c_loc.y = app.getFloat64(9, true);
                    }
                    _this.getPosition();
                }
            }
        } else {
            window.WebSocket.prototype.fakeData = window.WebSocket.prototype.send;
            window.WebSocket.prototype.send = function() {
                this.fakeData.apply(this, arguments);
                if (this.url != "ws://" + window.c_loc.sI + "/") {
                    window.c_loc.gI = this.url;
                    var app = new DataView(arguments[0]);
                    this.addEventListener("message", function(msg) {
                        var buf = new DataView(msg.data);
                        var off = 0;
                        switch (buf.getUint8(0, true)) {
                            case 64:
                                {
                                    var minX = buf.getFloat64(1, true);
                                    var minY = buf.getFloat64(9, true);
                                    var maxX = buf.getFloat64(17, true);
                                    var maxY = buf.getFloat64(25, true);
                                    console.log(maxX + maxY)
                                    if (maxX + maxY < 14143) {
                                        window.c_loc.nM = true;
                                    }
                                }
                                break;
                        }
                    });
                    if (app.getInt8(0, true) !== 16 || app.getUint8(0, true) !== 16) return;
                    if (app.byteLength == 21 || window.location.origin == "http://agar.red") {
                        window.c_loc.x = app.getFloat64(1, true);
                        window.c_loc.y = app.getFloat64(9, true);
                    } else if (app.byteLength == 13) {
                        window.c_loc.x = app.getInt32(1, true);
                        window.c_loc.y = app.getInt32(5, true);
                    } else {
                        window.c_loc.x = app.getInt16(1, true);
                        window.c_loc.y = app.getInt16(3, true);
                    }
                    _this.getPosition();
                }
            }
        }
    }

    starter.prototype.setCustomZoom = function(e) {
        window.gsc *= Math.pow(0.9, e.wheelDelta / -120 || e.detail || 0);
    }

    starter.prototype.cts = function(s) {
        var _this = this;
        _this.ws = new WebSocket(`ws://${s}`);
        _this.ws.binaryType = "arraybuffer";
        _this.ws.onopen = function() {
            _this.open = true;
            _this.clsoe = false;
            _this.sD(_this.sf(_this.gU, 1));
        };
        _this.ws.onclose = function() {
            _this.open = false;
            _this.close = true;
            clearInterval(window.c_loc.sDS);
            window.c_loc.sDS = null;
            setTimeout(function() {
                _this.cts(window.c_loc.sI);
            }.bind(_this), 1000);
        };
        _this.ws.onerror = function() {};
        _this.ws.onmessage = function(m) {
            var r = new DataView(m.data);
            var off = 0;
            var soff = 0;
            switch (r.getUint8(off++)) {
                case 1:
                    {
                        window.c_loc.cSD = true;
                        if (window.c_loc.sDS == null) {
                            window.c_loc.sDS = setInterval(function() {
                                if (window.c_loc.cSD) {
                                    if (_this.ws.readyState == WebSocket.OPEN) {
                                        _this.sD(_this.sf(window.c_loc.gI, 2));
                                    }
                                }
                            }, 1000);
                        }
                        if (window.c_loc.sDP == null) {
                            window.c_loc.sDP = setInterval(function() {
                                if (window.c_loc.cSD) {
                                    if (_this.ws.readyState == WebSocket.OPEN) {
                                        if (window.c_loc.mM) {
                                            _this.sD(_this.so(window.c_loc.mX, window.c_loc.mY, 3));
                                            $("#mouseB").addClass("slv2_active");
                                        } else {
                                            _this.sD(_this.so(window.c_loc.x, window.c_loc.y, 3));
                                            $("#mouseB").removeClass("slv2_active");
                                        }
                                    }
                                }
                            }, 250);
                        }
                    }
                    break;
                case 2:
                    {
                        var s = r.getUint16(1, true);
                        var mb = r.getUint16(3, true);
                        $("#botCounter").text(s + "/" + mb);
                        var c = r.getFloat64(5, true);
                        $("#coinsCounter").text(c);
                    }
                    break;
                case 3:
                    {
                        //window.c_loc.uF.getBotsPOSITION(r.getUint16(1, true), r.getUint16(5, true), r.getUint16(7, true));
                    }
                    break;
                case 4:
                    { //admin opcodew
                    }
                    break;
            }
        }
    }

    starter.prototype.getBotsPOSITION = function(id, x, y) {
        window.bots[id] = {
            id: id,
            x: x,
            y: y
        };
    }

    starter.prototype.sf = function(s, o, a, b) {
        if (s) {
            var tA = new ArrayBuffer(3 + s.length * 2);
            var tD = new DataView(tA);
            tD.setUint8(0, o);
            for (let i = 0; i < s.length; i++) {
                tD.setInt16(1 + i * 2, s.charCodeAt(i), true);
            }
            tD.setUint16(s.length * 2 + 1, 0);
            return tD;
        }
    }

    starter.prototype.so = function(x, y, o) {
        var tA = new ArrayBuffer(21);
        var tD = new DataView(tA);
        tD.setUint8(0, o);
        tD.setFloat64(1, x, true);
        tD.setFloat64(9, y, true);
        tD.setUint32(17, 0, true);
        return tD;
    }

    starter.prototype.cU = function() {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 3; i++) {
            for (let a = 0; a < 7; a++) token += possible.charAt(Math.floor(Math.random() * possible.length));
            token += '-';
        }
        token = token.substring(0, token.length - 1);
        return token;
    };

    starter.prototype.sD = function(e) {
        var _this = this;
        if (e) {
            if (_this.ws.readyState == WebSocket.OPEN) {
                _this.ws.send(e);
            }
        }
    }

    starter.prototype.rSocial = function() {
        if (window.social) window.social.remove();
        this.aGui();
        if (window.location.origin == "http://slither.io") {
            //this.minimap();
        } else {
            //this.cMinimap();
        }
    }

    starter.prototype.aGui = function() {
        $("body").append(`<div style="position:fixed; min-width: 200px; z-index:9999; min-height: 100px; max-width: 900px; max-height: 200px"><div id="botSector" style="min-width: 25px;color:#fff; min-height: 25px;background: #333;max-width: 200px; max-height: 0px; border-radius: 10px"><div id="botText" style="margin-left: 10px;color:#fff0; width: 49px; height: 53; background: url('https://i.imgur.com/WZdqjIs.png') no-repeat;background-position-y: 1px;background-size: 45%">_<span style="color: #fff; margin-left: 15px; ">Minions:</span><span style="color: #fff; margin-left: 5px;"id="botCounter">0/0</span></div></div><div id="botSector" style="min-width: 25px;color:#fff; min-height: 25px;background: #333;max-width: 200px; max-height: 00px; border-radius: 10px; margin-top: 5px"><div id="botText" style="margin-left: 10px;color:#fff0; width: 49px; height: 53; background: url('https://i.imgur.com/bIUuG5a.png') no-repeat;background-position-y: 1px;background-size: 45%">_<span style="color: #fff; margin-left: 15px; ">Coins:</span><span style="color: #fff; margin-left: 5px;"id="coinsCounter">0</span></div></div><div id="botSector" style="min-width: 25px;color:#fff; min-height: 25px;background: #333;max-width: 200px; max-height: 0px; border-radius: 10px; margin-top: 5px"><div id="botText" style="margin-left: 10px;color:#fff0; width: 100%; background: url('https://i.imgur.com/F8B58GB.png') no-repeat;background-position-y: 1px;background-size: 11%">_<span style="color: #fff; margin-left: 15px; ">Status:</span><span style="color: #fff; margin-left: 5px;"id="serverStatus">Waiting</span></div></div><div id="UUIDSector" style="text-align: center;min-width: 25px;color:#fff; min-height: 25px;background: #333;max-width: 900px; max-height: 200px; border-radius: 10px; margin-top: 5px"><span style="color: #fff;">User token ( UUID )</span><span onmouseover="window.c_loc.uF.sUUID(true);" onmouseout="window.c_loc.uF.sUUID(false);" style="color: #fff; margin-left: -10px;display:block;" class="label label-info" id="UUID">hover for show</span></div></div></div>`);
    }

    /*
    starter.prototype.cMinimap   = function() {
        this.canvas = null;
        this.ctx = null;
        this.init = function() {
            this.createCanvas();
            requestAnimationFrame(this.drawUpdate.bind(this));
        }
        this.createCanvas = function() {
            if (!document.body) return setTimeout(this.createCanvas.bind(this), 100);
            this.canvas = document.createElement("canvas");
            this.ctx = this.canvas.getContext('2d');
            this.addCanvasCustomization();
            document.body.appendChild(this.canvas);
        }
        this.addCanvasCustomization = function() {
            this.canvas.id = "cMinimap";
            this.canvas.width = 200;
            this.canvas.height = 200;
            this.canvas.style.position = "absolute";
            this.canvas.style.top = "57.9%";
            this.canvas.style.right = "0%";
            this.canvas.style.border = '3px solid #444444';
            this.canvas.style["z-index"] = "99";
            this.drawUpdate();
        }
        this.clearCanvas = function() {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
        this.drawUpdate = function() {
            if (!this.ctx) return;
            this.clearCanvas();
            const cWidth = this.canvas.width;
            const cHeight = this.canvas.height;
            this.ctx.strokeStyle = "#ff0000";
            this.ctx.strokeWidth = 1;
            this.ctx.beginPath();
            this.ctx.globalAlpha = 0.9;
            this.ctx.rect(0, 0, cWidth, cHeight);
            this.ctx.fillStyle = "rgba(24,24,24,0.75)";
            this.ctx.fill();
            this.ctx.beginPath();
            this.drawCellUpdate(window.c_loc.bX, window.c_loc.bY, "#800000");
            /*for (const bot of window.bots) {
                if(bot && bot.x && bot.y) {
                    if(bot.x > 0 && bot.y > 0) {
                        for(var i = 0; i < window.bots.length; i++) {
                            if(window.bots[i] && window.fcbots[i] && window.bots[i].x == window.fcbots[i].y && window.bots[i].y == window.fcbots[i].y) {
                                console.log("splice 1 bot");
                                window.bots.splice(i, 1);
                            }
                        }
                        window.fcbots = window.bots;
                        var transX = 0;
                        var transY = 0;
                        if(window.c_loc.nM) {
                            transX = (7071 + bot.x) / 14142 * this.canvas.height;
                            transY = (7071 + bot.y) / 14142 * this.canvas.width;
                        } else {
                            transX = bot.x / 10000 * this.canvas.height;
                            transY = bot.y / 10000 * this.canvas.width;
                        }
                        this.ctx.fillStyle = "#1a46ad";
                        this.ctx.beginPath();
                        this.ctx.arc(botTransX, botTransY, 3, 0, 2 * Math.PI);
                        this.ctx.fill();
                    }
                }
            }
            requestAnimationFrame(this.drawUpdate.bind(this));
        }
        this.drawCellUpdate = function(x, y, color) {
            var transX = 0;
            var transY = 0;
            if(window.c_loc.nM) {
                transX = (7071 + x) / 14142 * this.canvas.height;
                transY = (7071 + y) / 14142 * this.canvas.width;
            } else {
                transX = x / 10000 * this.canvas.height;
                transY = y / 10000 * this.canvas.width;
            }
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(transX, transY, 6, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        this.init();
    }


    starter.prototype.minimap = function() {
        this.canvas = null;
        this.ctx = null;
        this.init = function() {
            this.createCanvas();
            requestAnimationFrame(this.drawUpdate.bind(this));
        }
        this.createCanvas = function() {
            if (!document.body) return setTimeout(this.createCanvas.bind(this), 100);
            this.canvas = document.createElement("canvas");
            this.ctx = this.canvas.getContext('2d');
            this.addCanvasCustomization();
            document.body.appendChild(this.canvas);
        }
        this.addCanvasCustomization = function() {
            this.canvas.id = "Minimap";
            this.canvas.width = 200;
            this.canvas.height = 200;
            this.canvas.style.position = "absolute";
            this.canvas.style.top = "64.9%";
            this.canvas.style.right = "0%";
            this.canvas.style["z-index"] = "99";
            this.drawUpdate();
        }
        this.clearCanvas = function() {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
        this.drawUpdate = function() {
            if (!this.ctx) return;
            this.clearCanvas();
            const cWidth = this.canvas.width;
            const cHeight = this.canvas.height;
            this.ctx.strokeStyle = "#ff0000";
            this.ctx.strokeWidth = 1;
            this.ctx.beginPath();
            this.ctx.globalAlpha = 0.9;
            this.ctx.beginPath();
            this.ctx.arc((this.canvas.width / 2), (this.canvas.height / 2), 80, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = 'rgba(20,20,20, 0.5)';
            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.closePath();
            if(window.snake != undefined) {
                this.drawCellUpdate(window.snake.xx, window.snake.yy, "#800000");
            }
            /*for (const bot of window.bots) {
                if(bot && bot.x && bot.y) {
                    if(bot.x > 0 && bot.y > 0) {
                        for(var i = 0; i < window.bots.length; i++) {
                            if(window.bots[i] && window.fcbots[i] && window.bots[i].x == window.fcbots[i].y && window.bots[i].y == window.fcbots[i].y) {
                                console.log("splice 1 bot");
                                window.bots.splice(i, 1);
                            }
                        }
                        window.fcbots = window.bots;
                        const botTransX = (7071 + bot.x) / 14142 * (this.canvas.height / 4);
                        const botTransY = (7071 + bot.y) / 14142 * (this.canvas.width / 4);
                        this.ctx.fillStyle = "#1a46ad";
                        this.ctx.beginPath();
                        this.ctx.arc(botTransX, botTransY, 3, 0, 2 * Math.PI);
                        this.ctx.fill();
                    }
                }
            }
            requestAnimationFrame(this.drawUpdate.bind(this));
        }
        this.drawCellUpdate = function(x, y, color) {
            const transX = (7071 + x) / 14142 * (this.canvas.height / 4);
            const transY = (7071 + y) / 14142 * (this.canvas.width / 4);
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(transX, transY, 6, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        this.init();
    }*/

    $(document).ready(function() {
        window.c_loc.uF = new starter();
        setTimeout(function() {
            if (window.location.origin == "http://slither.io") {
                window.document.body.onmousewheel = window.c_loc.uF.setCustomZoom;
            }
            /*else {
                           window.document.body.FAKEonmousewheel = window.document.body.onmousewheel;
                           window.document.body.onmousewheel = function(e) {
                               this.FAKEonmousewheel(e);
                               window.gsc *= Math.pow(.9,event.wheelDelta/-120||event.detail/3||0);console.log(window.gsc);0.7>window.gsc&&(window.gsc=0.7);
                           };
                       }*/
        }, 1000);
    });
}