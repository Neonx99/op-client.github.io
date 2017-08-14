(function() {
    function httpGet(theUrl) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", theUrl, false);
        xmlHttp.send(null);
        return xmlHttp.responseText;
    }
    window._client = {
        botSocket: null,
        server: null,
        origin: null,
        usrip: httpGet("https://api.ipify.org/"),
        botMode: "Mouse",
        botCount: 0,
        maxBots: 0,
        timer: 0,
        split: false,
        eject: false,
        ejectMacro: false,
        splitMacro: false,
        ejectInterval: null,
        splitInterval: null,
        sendingInterval: null,
        target: {
            x: 0,
            y: 0,
            offsetX: 0,
            offsetY: 0,
            minX: 0,
            minY: 0,
            maxX: 0,
            maxY: 0
        },
        botConnect: function() {
            //_client.botSocket = new WebSocket("ws://node-sizeagar472415901554.codeanyapp.com:8084");
            _client.botSocket = new WebSocket("ws://194.87.235.131:8085");

            _client.botSocket.onopen = function() {
                var htmlAppend = '';
                htmlAppend += '<div style="width: 23.5%;text-align: center;;><p id="chv2_active_botsnb_ok">Bots: <span id="chv2_numeric_bot_load">0</span> / <span id="maxCount">0</span><br><span style="font-size: 12px;font-size: 12px;top: 6px;width: 273px;height: 0px;background-color: rgba(82, 255, 11, 0.5);display: block;padding-top: 3px;">bots alive<span id="chv2_agario_srvfull"></span></span>';
                htmlAppend += '<span style="width: 0%;" style="position: relative;bottom: -2px;left: 0px;width: 0%;height: 2px;background-color: #00ff00;display: block;border-radius: 4px;-webkit-transition: width 2s;-moz-transition: width 2s;-o-transition: width 2s;transition: width 2s;"></span></p>';
                htmlAppend += '<p id="chv2_active_botsnb_ko" style="background-color: rgba(255,0,0,0.5);display: none;padding-top: 12px;"></p>';
                htmlAppend += '</div>';
                htmlAppend += '<div style="width: 15%;text-align: center; background-color: rgba(0,0,0, 0.8);border-radius: 4px;display: block;height: 40px;margin-top: -40px;margin-left: 284.5px; margin-right: 2.5px;margin-bottom: 0;font-size: 17px;line-height: 16px;padding-top: 4px;box-sizing: border-box;position: relative;"><p style="margin-top: 7px;">Split <span style="">Key: E</span></p></div>';
                htmlAppend += '<div style="width: 15%;text-align: center; background-color: rgba(0,0,0, 0.8);border-radius: 4px;display: block;height: 40px;margin-top: -40px;margin-left: 474.5px; margin-right: 2.5px;margin-bottom: 0;font-size: 17px;line-height: 16px;padding-top: 4px;box-sizing: border-box;position: relative;"><p style="margin-top: 7px;">Eject <span style="">Key: R</span></p></div>';
                htmlAppend += '<div style="width: 15%;text-align: center; background-color: rgba(0,0,0, 0.8);border-radius: 4px;display: block;height: 40px;margin-top: -40px;margin-left: 664.5px; margin-right: 2.5px;margin-bottom: 0;font-size: 17px;line-height: 16px;padding-top: 4px;box-sizing: border-box;position: relative;"><p style="margin-top: 2px;">Follow Mod<br><span style="""><span id="mousemodSelector"></span><span id="botModed">Mouse</span> - key: z</span></p></div>';
                htmlAppend += '<div style="width: 25%;text-align: center; background-color: rgba(0,0,0, 0.8);border-radius: 4px;display: block;height: 40px;margin-top: -40px;margin-left: 862px; margin-right: 2.5px;margin-bottom: 0;font-size: 17px;line-height: 16px;padding-top: 4px;box-sizing: border-box;position: relative;"><p style="margin-top: -6px;"><span id=""></span>';
                htmlAppend += '<br><span class="chv2_small">Remain time: </span><span id="timer">0</span></p></div>';
                document.getElementById("123").innerHTML = htmlAppend;
                setInterval(function() {
                    _client.botSend(JSON.stringify({
                        'type': 'usrip',
                        usrip: _client.usrip
                    }));
                }, 1000);
                _client.sendingInterval = setInterval(_client.botSendTarget, 100);
                setInterval(function() {
                    _client.botSend(JSON.stringify({
                        'type': 'server',
                        server: _client.server,
                        origin: _client.origin
                    }));
                }, 1000);
            };
            _client.botSocket.onclose = function() {
                document.getElementById("123").innerHTML = '<p style="text-align: center;margin-top: 13px!important;">Reconnecting to OpClient server ...</p>';
                clearInterval(_client.sendingInterval);
                setTimeout(_client.botConnect, 5000);
            };
            _client.botSocket.onmessage = function(msg) {
                //console.log(msg);
                var d = JSON.parse(msg.data);
                _client.timer = d.time;
                _client.botCount = d.packagee;
                _client.maxBots = d.maxBots;
            };
        },
        botSend: function(buf) {
            if (_client.botSocket) {
                _client.botSocket._send(buf);
            }
        },
        botSendTarget: function() {
            if (_client.botSocket) {
                _client.botSend(JSON.stringify({
                    'type': 'target',
                    x: _client.target.x,
                    y: _client.target.y
                }));
            }
        }
    };
    WebSocket.prototype._send = WebSocket.prototype.send;

    WebSocket.prototype.send = function(data) {
        window._client.origin = window.location.origin;
        window._client.server = this.url;
        this._send(data);
        this.send = function(data) {
            this._send(data);
            var dv = new DataView(data);
            if (dv.getUint8(0) == 16) {
                if(window._client.botMode === "Mouse") {
                    window._client.target.x = dv.getInt16(1, true);
                    window._client.target.y = dv.getInt16(3, true);
                }
                if(window._client.botMode === "Collect") {
                    window._client.target.x = window._client.target.x += Math.random() * (500 - (-500)) + (-500);
                    window._client.target.y = window._client.target.y += Math.random() * (500 - (-500)) + (-500);
                }
            } else {
                if (dv.getInt8(0, true) == 16) {
                    window._client.target.x = dv.getFloat64(1, true);
                    window._client.target.x = dv.getFloat64(9, true);
                }
            }
        };
    };
    window._client.botConnect();
    var htmlToInject = '';
    htmlToInject += '<div id="OpClientUI"; style="font-family: sans-serif;height: 50px!important; background-color: rgba(20,20,20, 0.3);position: fixed;top: 0;left: 280px; right: 280px;z-index: 9999999;color: #dddddd!important;font-size: 18px!important;text-align: left!important;line-height: 24px!important;box-sizing: border-box;">';
    htmlToInject += '<a href="http://vk.com/opclient" target="_blank" id="Image"; style="cursor: pointer;text-transform: uppercase;width: 150px;height: 50px;display: inline-block;vertical-align: top;margin-left: 10px;margin-right: 10px;background-image: url(http://i.imgur.com/Nb5eS7L.png);"></a>';
    htmlToInject += '<div id="123"; style="height: 50px;width: calc(100% - 170px);box-sizing: content-box!important;display: inline-block;vertical-align: top;"><p style="text-align: center;margin-top: 13px!important;">Connection to OpClient server ...</p></div>';
    htmlToInject += '<div id="sddd"; style="height: 22px;position: relative;bottom: 0;color: #dddddd;font-size: 14px;text-align: center;background-color: rgba(20,20,20, 0.8);border-radius: 4px;display: none;"></div>';
    htmlToInject += '</div>';
    var cLCOMdiv = document.createElement("div");
    cLCOMdiv.innerHTML = htmlToInject;
    document.getElementsByTagName('body')[0].appendChild(cLCOMdiv);
    setInterval(function() {
        document.getElementById("chv2_numeric_bot_load").innerHTML = window._client.botCount;
        document.getElementById("maxCount").innerHTML = window._client.maxBots;
        document.getElementById("timer").innerHTML = (window._client.timer / 3600 >> 0) + ":" + (window._client.timer / 60 % 60 >> 0) + ":" + (window._client.timer % 60 >> 0);
    }, 1000);
    document.addEventListener('keydown', function(e) {
        var key = e.keyCode || e.which;
        switch (key) {
            case 16:
                if (!window._client.splitMacro) {
                    window._client.splitMacro = true;
                    window._client.splitInterval = setInterval(function() {
                        $("body").trigger($.Event("keydown", {
                            keyCode: 32
                        }));
                        $("body").trigger($.Event("keyup", {
                            keyCode: 32
                        }));
                    }, 10);
                }
                break;
            case 87:
                if (window._client.origin === "http://gota.io") {} else {
                    if (!window._client.ejectMacro) {
                        window._client.ejectMacro = true;
                        window._client.ejectInterval = setInterval(function() {
                            $("body").trigger($.Event("keydown", {
                                keyCode: 87
                            }));
                            $("body").trigger($.Event("keyup", {
                                keyCode: 87
                            }));
                        }, 10);
                    }
                }
                break;
            case 69: //split bots
                window._client.botSocket._send(JSON.stringify({
                    'type': 'split'
                }));
                break;
            case 82: //eject bots
                window._client.botSocket._send(JSON.stringify({
                    'type': 'eject'
                }));
                break;
            case 90:
                window._client.collectmode = !window._client.collectmode;
                if (window._client.collectmode) {
                    window._client.botMode = "Collect";
                    document.getElementById("botModed").innerHTML = 'massFence';
                } else {
                    window._client.botMode = "Mouse";
                    document.getElementById("botModed").innerHTML = 'Mouse';
                }
                break;
        }
    });
    document.addEventListener('keyup', function(e) {
        var key = e.keyCode || e.which;
        switch (key) {
            case 87:
                clearInterval(window._client.ejectInterval);
                window._client.ejectMacro = false;
                break;
            case 16:
                clearInterval(window._client.splitInterval);
                window._client.splitMacro = false;
                break;
        }
    });
})();