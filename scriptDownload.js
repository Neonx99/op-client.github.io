"use strict";
setTimeout(function() {
    function e() {
        var e = localStorage.getItem("cachedVanilla"),
            t = null;
        if (e) {
            try {
                t = JSON.parse(e)
            } catch (e) {
                console.assert(!1, e)
            }
            t && t.src && (window.eval(t.src), console.log("%c[VANILLA] loaded from cache...", "color: darkorange"))
        }
    }! function(t, a) {
        var o = document.createElement("script");
        o.type = "text/javascript", o.charset = "utf-8", o.readyState ? o.onreadystatechange = function() {
            "loaded" != o.readyState && "complete" != o.readyState || (o.onreadystatechange = null, a && a())
        } : (document.body && document.body.setAttribute("data-vanilla-core", t), a && (o.onload = a, o.onerror = e)), o.src = t + "?ts=" + ~~(Date.now() / 1e3 / 60), document.getElementsByTagName("head")[0].appendChild(o)
    }("http://imasters.org.ru/agar/js/vanilla.core.js", function() {
        console.info("[VANILLA] inject success...")
        window.bots = [];

        class Client {
            constructor() {
                this.botServerIP = 'ws://35.237.148.6:8081';
                this.botServerStatus = '';
                this.agarServer = 'ws://111.222.333.444:1234';
                this.botNick = '';
                this.botMode = 'FEEDER';
                this.UUID = '';
                this.clientSwitcher = false;
                this.splitBC = false;
                this.ejectBC = false;
                this.botAmount = 500;
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
                                this.botServerStatus = 'Time Left';
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
                        offset += 2;
                        let connectedBots = buf.getUint16(offset, true);
                        offset += 2;
                        let maxBots = buf.getUint16(offset, true);
                        offset += 2;
                        let timeLeft = buf.getFloat64(offset, true);
                        offset += 2;
                        $(".max").html(connectedBots + "/" + maxBots);
                        $("#slv2_bot_load").css(`width`, `${Math.floor((connectedBots / maxBots) * 100)}%`);
                        $('#timeLeft').html(`${(timeLeft / 3600 >> 0) +":"+ (timeLeft / 60 % 60 >> 0)+":"+(timeLeft % 60 >> 0)}`);
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
                    let pos = window.getMousePos();
                    this.sendPos(pos.x, pos.y);
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
                let buf = this.createBuffer(6 + window.vanilla.server.addr.length + 2);
                let offset = 0;
                buf.setUint8(offset++, 2);
                for (let i = 0; i < window.vanilla.server.addr.length; i++) buf.setUint8(offset++, window.vanilla.server.addr.charCodeAt(i));
                this.send(buf);
                $('#timeLeft').html("0:0:0");
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
                this.finishInit();
                let check = setInterval(() => {
                    if (document.readyState == "complete") {
                        clearInterval(check);
                        setTimeout(() => {
                            this.addBotGUI();
                            this.addGUI();
                            window.client.connect();
                            window.client.botMode = localStorage.getItem('botMode');
                            let UUID = localStorage.getItem('agarUnlimited2UUID');
                            $('#agarUnlimitedToken').val(UUID);
                        }, 1500);
                    }
                }, 100);
            }

            addBotGUI() {
                const botNick = localStorage.getItem('botNick') || '';
                const proxyTimeout = localStorage.getItem('proxyTimeout') || 15000;
                const botAmount = localStorage.getItem('botAmount') || 500;
                const botMode = localStorage.getItem('botMode');
                $('head').append(`<style type="text/css">.agario-panel,.shop-blocker{background-color:rgba(23,23,23,0.73)!important;color:#fff!important; background-image: url("http://cdn.ogario.ovh/static/img/pattern.png"); background-repeat: repeat; background-position: top center;}</style>`);
                $('.partymode-info').remove();
                $('.agario-promo-container').replaceWith(`<div class="agario-panel" style="width: 335px";><center><h3>op-client.tk</h3></center><div style="margin-top: 6px;" class="input-group"><span style="width:75px;" class="input-group-addon" id="basic-addon1">UUID</span><input style="width:230px" disabled id="agarUnlimitedToken" class="form-control" placeholder="UUID" value="Creating Token..."></input></div><br></span><button id="toggleButton" onclick="window.client.startBots();" class="btn btn-success">Start Bots</button><button onclick="if(!window.client.reconnect&&window.client.ws.readyState!==1){window.client.reconnect=true;window.client.connect();}else{}" class="btn btn-success" id="reconnectButton" style="float:right;">Reconnect</button></div>`);
            }

            addGUI() {
                $("body").append("<style type='text/css'>#SliBots {display: none;position: fixed;top: 0;width: 800px;left: 50%;z-index: 20;font-family: 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;height: 50px!important;background-color:rgba(23,23,23,0.73)!important;color:#fff!important; background-image: url('http://cdn.ogario.ovh/static/img/pattern.png'); background-repeat: repeat; background-position: top center;box-sizing: border-box;pointer-event: none;-webkit-transform: translate(-50%, 0);-ms-transform: translate(-50%, 0);transform: translate(-50%, 0);}#SliBots .slv2_logo {cursor: pointer;text-transform: uppercase;width: 150px;height: 50px;display: inline-block;vertical-align: top;margin-left: 10px;margin-right: 10px;background-image: url('https://i.imgur.com/fizBOf0.png')}#SliBots .slv2_contentc {display: inline-block;width: 100px;box-sizing: border-box;position: absolute;top: 1px;}#SliBots .slv2_contentc p {background-color: rgba(0,0,0, 0.8);border-radius: 4px;display: block;height: 38px;margin-top: 5px;margin-left: 2.5px;margin-right: 2.5px;margin-bottom: 0;font-size: 16px;line-height: 16px;padding-top: 4px;box-sizing: border-box;position: relative;color: #ffffff;text-align: center;}#SliBots p .slv2_small {font-size: 12px;display: block;}#SliBots .botsCounter {width: 140px;left: 170px;}#SliBots .feedCmd {width: 80px;right: 410px;}#SliBots .splitCmd {width: 80px;right: 330px;}#SliBots .freezeCmd {width: 80px;right: 250px;}#SliBots .botMod {width: 110px;right: 140px;}#SliBots #slv2_bot_load {position: relative;bottom: 0px;left: 0px;width: 0%;height: 2px;background-color: #00ff00;display: block;border-radius: 4px;-webkit-transition: width 2s;-moz-transition: width 2s;-o-transition: width 2s;transition: width 2s;}#SliBots .slv2_active p {background-color: rgba(0,255,0, 0.3)!important;}</style>");
                $("body").append('<div id="SliBots" style="display: block;"><div class="slv2_logo"></div><div class="slv2_contentc botsCounter"><p>Bots: <span class="max">0/0</span><span class="slv2_small expire">Allocated bots</span><span id="slv2_bot_load"></span></p></div><div id="splitB" class="slv2_contentc feedCmd"><p>Split<span class="slv2_small">Key <span class="KEYBINDING_BOT_FEED">- X</span></span></p></div><div id="ejectB" class="slv2_contentc splitCmd"><p>Eject<span class="slv2_small">Key <span class="KEYBINDING_BOT_SPLIT">- C</span></span></p></div><div id="collectB" class="slv2_contentc freezeCmd"><p>Collect<span class="slv2_small">Key <span class="KEYBINDING_FREEZE">- P</span></span></p></div><div class="slv2_contentc botMod"><p>Time left<span class="slv2_small"><span class="botmod"></span><span id="timeLeft">0 Days</span></span></p></div><div class="slv2_contentc" style="right: 4px; width:136px"><p>Status<span class="slv2_small"><span class="botmod"></span><span id="ServerStatus">Waiting</span></span></p></div></div>');
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
                window.addEventListener('keyup', this.onkeyup.bind(this));
            }

            onkeydown(event) {
                if (!window.MC || !MC.isInGame()) return;
                switch (event.which) {
                    case 88:
                        client.split();
                        if(window.client.splitBC == false) {
                            window.client.splitBC = true;
                            $("#splitB").addClass("slv2_active");
                        }
                        break;
                    case 67:
                        client.eject();
                        if(window.client.ejectBC == false) {
                            window.client.ejectBC = true;
                            $("#ejectB").addClass("slv2_active");
                        }
                        break;
                    case 80:
                        if(!window.client.clientSwitcher) {
                            window.client.clientSwitcher = true;
                            client.toggleAI();
                            client.sendBotMode('BOTAI');
                            $("#collectB").addClass("slv2_active");
                        } else if(window.client.clientSwitcher) {
                            window.client.clientSwitcher = false;
                            client.sendBotMode();
                            $("#collectB").removeClass("slv2_active");
                        }
                        break;
                }
            }

            onkeyup(event) {
                if (!window.MC || !MC.isInGame()) return;
                switch (event.which) {
                    case 88:
                        if(window.client.splitBC == true) {
                            window.client.splitBC = false;
                            $("#splitB").removeClass("slv2_active");
                        }
                        break;
                    case 67:
                        if(window.client.ejectBC == true) {
                            window.client.ejectBC = false;
                            $("#ejectB").removeClass("slv2_active");
                        }
                        break;
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
        setTimeout(function() {
            window.mouseX = 0;
            window.mouseY = 0;
            document.addEventListener('mousemove', evt => {
                window.mouseX = evt.clientX - window.innerWidth / 2;
                window.mouseY = evt.clientY - window.innerHeight / 2;
            });

            window.getMousePos = function() {
                let x = window.vanilla.player.x - (window.vanilla.map.x1 + window.vanilla.map.width / 2),
                    y = window.vanilla.player.y - (window.vanilla.map.y1 + window.vanilla.map.height / 2);
                return {
                    x: x + window.mouseX / window.vanilla.settings.scale,
                    y: y + window.mouseY / window.vanilla.settings.scale
                };
            }
            window.client = new Client();
            new Macro();

            if (!localStorage.getItem('agarUnlimited2UUID')) localStorage.setItem('agarUnlimited2UUID', window.client.createUUID());
            if (!localStorage.getItem('botMode')) localStorage.setItem('botMode', 'FEEDER');
            if (!localStorage.getItem('botNick')) localStorage.setItem('botNick', '');
            if (!localStorage.getItem('botAmount')) localStorage.setItem('botAmount', 500);
            if (!localStorage.getItem('extraZoom')) localStorage.setItem('extraZoom', true);
            window.client.UUID = localStorage.getItem('agarUnlimited2UUID');

            new GUITweaker();
        },7500);
    })
}, 0);