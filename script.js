/* =========================================================
   ANSH'S DRONE VAJRA 🚁⚡
   MAIN WEBSITE JAVASCRIPT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "================================"
        );

        console.log(
            "VAJRA SCRIPT LOADED"
        );

        console.log(
            "================================"
        );


        /* =====================================================
           GET HTML ELEMENTS
        ===================================================== */

        const loginScreen =
            document.getElementById(
                "loginScreen"
            );

        const dashboard =
            document.getElementById(
                "dashboard"
            );

        const username =
            document.getElementById(
                "username"
            );

        const password =
            document.getElementById(
                "password"
            );

        const loginBtn =
            document.getElementById(
                "loginBtn"
            );

        const loginMessage =
            document.getElementById(
                "loginMessage"
            );

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );


        /* =====================================================
           CHECK IMPORTANT ELEMENTS
        ===================================================== */

        console.log(
            "loginScreen:",
            loginScreen
        );

        console.log(
            "dashboard:",
            dashboard
        );

        console.log(
            "username:",
            username
        );

        console.log(
            "password:",
            password
        );

        console.log(
            "loginBtn:",
            loginBtn
        );


        /* =====================================================
           INITIAL SCREEN
        ===================================================== */

        if (loginScreen) {

            loginScreen.style.display =
                "flex";

        }

        if (dashboard) {

            dashboard.style.display =
                "none";

        }


        /* =====================================================
           LOGIN
        ===================================================== */

        function login() {

            console.log(
                "LOGIN BUTTON CLICKED"
            );

            const user =
                username.value.trim();

            const pass =
                password.value.trim();


            console.log(
                "Username:",
                user
            );

            console.log(
                "Password entered:",
                pass.length > 0
            );


            if (
                user === "VAJRA" &&
                pass === "VAJRA"
            ) {

                console.log(
                    "LOGIN CORRECT"
                );


                loginMessage.textContent =
                    "✓ ACCESS GRANTED";

                loginMessage.style.color =
                    "#00ff9d";


                /*
                 * OPEN DASHBOARD
                 */

                loginScreen.style.display =
                    "none";

                dashboard.style.display =
                    "block";


                document.body.style.overflow =
                    "auto";


                addLog(
                    "LOGIN SUCCESS"
                );

                addLog(
                    "VAJRA CONTROL PANEL OPENED"
                );


            } else {

                console.log(
                    "LOGIN INCORRECT"
                );


                loginMessage.textContent =
                    "✕ INVALID USERNAME OR PASSWORD";

                loginMessage.style.color =
                    "#ff3155";


                password.value = "";

                password.focus();

            }

        }


        /* =====================================================
           LOGIN BUTTON
        ===================================================== */

        if (loginBtn) {

            loginBtn.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    login();

                }
            );

        } else {

            console.error(
                "ERROR: loginBtn NOT FOUND"
            );

        }


        /* =====================================================
           ENTER KEY
        ===================================================== */

        if (username) {

            username.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        password.focus();

                    }

                }
            );

        }


        if (password) {

            password.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        login();

                    }

                }
            );

        }


        /* =====================================================
           LOGOUT
        ===================================================== */

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                function () {

                    disconnectBLE();

                    loginScreen.style.display =
                        "flex";

                    dashboard.style.display =
                        "none";

                    username.value = "";

                    password.value = "";

                    loginMessage.textContent =
                        "";

                    username.focus();

                }
            );

        }


        /* =====================================================
           NAVIGATION
        ===================================================== */

        const navButtons =
            document.querySelectorAll(
                ".nav-btn"
            );

        const pages =
            document.querySelectorAll(
                ".page"
            );


        navButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const pageName =
                            button.dataset.page;


                        navButtons.forEach(
                            function (btn) {

                                btn.classList.remove(
                                    "active"
                                );

                            }
                        );


                        button.classList.add(
                            "active"
                        );


                        pages.forEach(
                            function (page) {

                                page.classList.remove(
                                    "active-page"
                                );

                            }
                        );


                        const page =
                            document.getElementById(
                                pageName +
                                "Page"
                            );


                        if (page) {

                            page.classList.add(
                                "active-page"
                            );

                        }


                        addLog(
                            "OPENED " +
                            pageName.toUpperCase()
                        );

                    }
                );

            }
        );


        /* =====================================================
           LOGS
        ===================================================== */

        const logWindow =
            document.getElementById(
                "logWindow"
            );

        const clearLogs =
            document.getElementById(
                "clearLogs"
            );


        function addLog(
            message
        ) {

            if (!logWindow) {
                return;
            }


            const line =
                document.createElement(
                    "div"
                );


            line.className =
                "log-line";


            const time =
                new Date()
                    .toLocaleTimeString();


            const timeSpan =
                document.createElement(
                    "span"
                );


            timeSpan.textContent =
                "[" +
                time +
                "]";


            line.appendChild(
                timeSpan
            );


            line.appendChild(
                document.createTextNode(
                    message
                )
            );


            logWindow.appendChild(
                line
            );


            logWindow.scrollTop =
                logWindow.scrollHeight;

        }


        if (clearLogs) {

            clearLogs.addEventListener(
                "click",
                function () {

                    logWindow.innerHTML =
                        "";

                    addLog(
                        "LOGS CLEARED"
                    );

                }
            );

        }


        /* =====================================================
           BLE
        ===================================================== */

        const bleConnectBtn =
            document.getElementById(
                "bleConnectBtn"
            );

        const bleStatus =
            document.getElementById(
                "bleStatus"
            );

        const settingsBle =
            document.getElementById(
                "settingsBle"
            );


        const SERVICE_UUID =
            "12345678-1234-1234-1234-1234567890ab";

        const RX_UUID =
            "12345678-1234-1234-1234-1234567890ac";

        const TX_UUID =
            "12345678-1234-1234-1234-1234567890ad";


        let bleDevice = null;

        let bleServer = null;

        let bleService = null;

        let bleRX = null;

        let bleTX = null;

        let bleConnected = false;


        /* =====================================================
           BLE BUTTON
        ===================================================== */

        if (bleConnectBtn) {

            bleConnectBtn.addEventListener(
                "click",
                async function () {

                    if (
                        bleConnected
                    ) {

                        disconnectBLE();

                    } else {

                        await connectBLE();

                    }

                }
            );

        }


        /* =====================================================
           CONNECT BLE
        ===================================================== */

        async function connectBLE() {

            if (
                !navigator.bluetooth
            ) {

                alert(
                    "Web Bluetooth is not supported.\n\nUse Google Chrome or Microsoft Edge."
                );

                return;

            }


            try {

                addLog(
                    "SEARCHING FOR VAJRA BLE..."
                );


                bleDevice =
                    await navigator.bluetooth.requestDevice(
                        {

                            filters: [
                                {
                                    name:
                                        "ANSH'S DRONE VAJRA"
                                }
                            ],

                            optionalServices: [
                                SERVICE_UUID
                            ]

                        }
                    );


                addLog(
                    "VAJRA DEVICE FOUND"
                );


                bleDevice.addEventListener(
                    "gattserverdisconnected",
                    onBLEDisconnected
                );


                bleServer =
                    await bleDevice.gatt.connect();


                addLog(
                    "GATT CONNECTED"
                );


                bleService =
                    await bleServer.getPrimaryService(
                        SERVICE_UUID
                    );


                addLog(
                    "SERVICE FOUND"
                );


                bleRX =
                    await bleService.getCharacteristic(
                        RX_UUID
                    );


                addLog(
                    "RX FOUND"
                );


                bleTX =
                    await bleService.getCharacteristic(
                        TX_UUID
                    );


                addLog(
                    "TX FOUND"
                );


                if (
                    bleTX.properties.notify
                ) {

                    await bleTX.startNotifications();


                    bleTX.addEventListener(
                        "characteristicvaluechanged",
                        receiveTelemetry
                    );


                    addLog(
                        "TELEMETRY ACTIVE"
                    );

                }


                bleConnected =
                    true;


                updateBLEUI(
                    true
                );


                addLog(
                    "VAJRA CONNECTED"
                );


            } catch (
                error
            ) {

                console.error(
                    "BLE ERROR:",
                    error
                );


                bleConnected =
                    false;


                updateBLEUI(
                    false
                );


                if (
                    error.name !==
                    "NotFoundError"
                ) {

                    addLog(
                        "BLE ERROR: " +
                        error.message
                    );

                }

            }

        }


        /* =====================================================
           BLE DISCONNECT
        ===================================================== */

        function disconnectBLE() {

            try {

                if (
                    bleDevice &&
                    bleDevice.gatt &&
                    bleDevice.gatt.connected
                ) {

                    bleDevice.gatt.disconnect();

                }

            } catch (
                error
            ) {

                console.error(
                    error
                );

            }


            bleDevice = null;

            bleServer = null;

            bleService = null;

            bleRX = null;

            bleTX = null;

            bleConnected =
                false;


            updateBLEUI(
                false
            );

        }


        function onBLEDisconnected() {

            bleConnected =
                false;

            bleServer = null;

            bleService = null;

            bleRX = null;

            bleTX = null;


            updateBLEUI(
                false
            );


            addLog(
                "BLE DISCONNECTED"
            );

        }


        /* =====================================================
           BLE UI
        ===================================================== */

        function updateBLEUI(
            state
        ) {

            if (!bleStatus) {
                return;
            }


            if (state) {

                bleStatus.className =
                    "ble-status connected";

                bleStatus.innerHTML =
                    "<span></span> BLE CONNECTED";


                bleConnectBtn.textContent =
                    "DISCONNECT BLE";


                if (settingsBle) {

                    settingsBle.textContent =
                        "Connected";

                }

            } else {

                bleStatus.className =
                    "ble-status disconnected";

                bleStatus.innerHTML =
                    "<span></span> BLE DISCONNECTED";


                bleConnectBtn.textContent =
                    "CONNECT BLE";


                if (settingsBle) {

                    settingsBle.textContent =
                        "Disconnected";

                }

            }

        }


        /* =====================================================
           SEND BLE COMMAND
        ===================================================== */

        async function sendCommand(
            command
        ) {

            if (!bleRX) {

                addLog(
                    "COMMAND BLOCKED — BLE DISCONNECTED"
                );

                return;

            }


            try {

                const message =
                    command.endsWith(
                        "\n"
                    )
                        ? command
                        : command + "\n";


                const data =
                    new TextEncoder()
                        .encode(
                            message
                        );


                if (
                    bleRX.writeValueWithoutResponse
                ) {

                    await bleRX.writeValueWithoutResponse(
                        data
                    );

                } else {

                    await bleRX.writeValue(
                        data
                    );

                }


                console.log(
                    "VAJRA TX:",
                    message.trim()
                );


            } catch (
                error
            ) {

                console.error(
                    "TX ERROR:",
                    error
                );


                addLog(
                    "TX ERROR: " +
                    error.message
                );

            }

        }


        /* =====================================================
           START / STOP
        ===================================================== */

        const startBtn =
            document.getElementById(
                "startBtn"
            );

        const stopBtn =
            document.getElementById(
                "stopBtn"
            );

        const allMotorStop =
            document.getElementById(
                "allMotorStop"
            );

        const armedText =
            document.getElementById(
                "armedText"
            );

        const armedIndicator =
            document.getElementById(
                "armedIndicator"
            );


        function updateArmed(
            state
        ) {

            if (
                !armedText ||
                !armedIndicator
            ) {

                return;

            }


            if (state) {

                armedText.textContent =
                    "ARMED";

                armedText.style.color =
                    "#00ff9d";

                armedIndicator.style.background =
                    "#00ff9d";

                armedIndicator.style.boxShadow =
                    "0 0 15px #00ff9d";

            } else {

                armedText.textContent =
                    "DISARMED";

                armedText.style.color =
                    "#ff3155";

                armedIndicat
