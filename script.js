/* =========================================================
   ANSH'S DRONE VAJRA 🚁⚡
   COMPLETE WEBSITE JAVASCRIPT
   Matched to current index.html
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const loginScreen = document.getElementById("loginScreen");
    const dashboard = document.getElementById("dashboard");

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const loginMessage = document.getElementById("loginMessage");

    const logoutBtn = document.getElementById("logoutBtn");

    const navButtons = document.querySelectorAll(".nav-btn");
    const pages = document.querySelectorAll(".page");

    const bleButton = document.getElementById("bleConnectBtn");
    const bleStatus = document.getElementById("bleStatus");
    const settingsBle = document.getElementById("settingsBle");

    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const allMotorStop = document.getElementById("allMotorStop");

    const armedText = document.getElementById("armedText");
    const armedIndicator = document.getElementById("armedIndicator");

    const joystick = document.getElementById("joystick");
    const joystickStick = document.getElementById("joystickStick");

    const throttleValue = document.getElementById("throttleValue");
    const yawValue = document.getElementById("yawValue");
    const pitchValue = document.getElementById("pitchValue");
    const rollValue = document.getElementById("rollValue");

    const logWindow = document.getElementById("logWindow");
    const clearLogs = document.getElementById("clearLogs");

    /* =====================================================
       BLE
       ===================================================== */

    const SERVICE_UUID =
        "12345678-1234-1234-1234-1234567890ab";

    const RX_UUID =
        "12345678-1234-1234-1234-1234567890ac";

    const TX_UUID =
        "12345678-1234-1234-1234-1234567890ad";

    const DEVICE_NAME =
        "ANSH'S DRONE VAJRA";

    let bleDevice = null;
    let bleServer = null;
    let bleService = null;
    let bleRX = null;
    let bleTX = null;

    let armed = false;
    let joystickActive = false;

    /* =====================================================
       SAFETY / STARTUP
       ===================================================== */

    if (dashboard) {
        dashboard.style.display = "none";
    }

    if (loginScreen) {
        loginScreen.style.display = "flex";
    }

    if (username) {
        username.focus();
    }

    /* =====================================================
       LOGIN
       ===================================================== */

    function login() {

        const user = username.value.trim();
        const pass = password.value.trim();

        if (user === "VAJRA" && pass === "VAJRA") {

            loginMessage.style.color = "#00ff9d";
            loginMessage.textContent = "✓ ACCESS GRANTED";

            console.log("VAJRA LOGIN SUCCESS");

            setTimeout(() => {

                loginScreen.style.display = "none";
                dashboard.style.display = "block";

                document.body.style.overflow = "auto";

                addLog("LOGIN SUCCESS — VAJRA dashboard opened");

            }, 350);

        } else {

            loginMessage.style.color = "#ff3155";
            loginMessage.textContent =
                "✕ INVALID USERNAME OR PASSWORD";

            password.value = "";
            password.focus();
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener("click", login);
    }

    if (username) {
        username.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {
                password.focus();
            }

        });
    }

    if (password) {
        password.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {
                login();
            }

        });
    }

    /* =====================================================
       LOGOUT
       ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", () => {

            stopAll();

            loginScreen.style.display = "flex";
            dashboard.style.display = "none";

            username.value = "";
            password.value = "";

            loginMessage.textContent = "";

            addLog("USER LOGGED OUT");

        });

    }

    /* =====================================================
       PAGE NAVIGATION
       ===================================================== */

    navButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const pageName = button.dataset.page;

            navButtons.forEach((btn) => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            pages.forEach((page) => {
                page.classList.remove("active-page");
            });

            const selectedPage =
                document.getElementById(pageName + "Page");

            if (selectedPage) {
                selectedPage.classList.add("active-page");
            }

            addLog("PAGE OPENED → " + pageName.toUpperCase());

        });

    });

    /* =====================================================
       LOGGING
       ===================================================== */

    function addLog(message) {

        if (!logWindow) return;

        const line = document.createElement("div");

        line.className = "log-line";

        const time =
            new Date().toLocaleTimeString();

        line.innerHTML =
            `<span>[${time}]</span> ${message}`;

        logWindow.appendChild(line);

        logWindow.scrollTop =
            logWindow.scrollHeight;
    }

    if (clearLogs) {

        clearLogs.addEventListener("click", () => {

            logWindow.innerHTML = "";

            addLog("LOGS CLEARED");

        });

    }

    /* =====================================================
       BLE STATUS
       ===================================================== */

    function setBLEConnected(connected) {

        if (connected) {

            if (bleStatus) {

                bleStatus.className =
                    "ble-status connected";

                bleStatus.innerHTML =
                    "<span></span> BLE CONNECTED";
            }

            if (bleButton) {

                bleButton.textContent =
                    "CONNECTED";

                bleButton.disabled = true;
            }

            if (settingsBle) {
                settingsBle.textContent =
                    "Connected";
            }

        } else {

            if (bleStatus) {

                bleStatus.className =
                    "ble-status disconnected";

                bleStatus.innerHTML =
                    "<span></span> BLE DISCONNECTED";
            }

            if (bleButton) {

                bleButton.textContent =
                    "CONNECT BLE";

                bleButton.disabled = false;
            }

            if (settingsBle) {
                settingsBle.textContent =
                    "Disconnected";
            }
        }
    }

    /* =====================================================
       BLE CONNECT
       ===================================================== */

    if (bleButton) {

        bleButton.addEventListener("click", async () => {

            if (!navigator.bluetooth) {

                alert(
                    "Web Bluetooth is not supported in this browser."
                );

                addLog(
                    "ERROR → Web Bluetooth not supported"
                );

                return;
            }

            try {

                addLog(
                    "SEARCHING → " + DEVICE_NAME
                );

                bleDevice =
                    await navigator.bluetooth.requestDevice({

                        filters: [
                            {
                                name: DEVICE_NAME
                            }
                        ],

                        optionalServices: [
                            SERVICE_UUID
                        ]

                    });

                addLog(
                    "DEVICE FOUND → " +
                    (bleDevice.name || DEVICE_NAME)
                );

                bleDevice.addEventListener(
                    "gattserverdisconnected",
                    onDisconnected
                );

                addLog("CONNECTING TO GATT...");

                bleServer =
                    await bleDevice.gatt.connect();

                addLog("GATT CONNECTED");

                bleService =
                    await bleServer.getPrimaryService(
                        SERVICE_UUID
                    );

                addLog("SERVICE FOUND");

                bleRX =
                    await bleService.getCharacteristic(
                        RX_UUID
                    );

                addLog("RX CHARACTERISTIC FOUND");

                bleTX =
                    await bleService.getCharacteristic(
                        TX_UUID
                    );

                addLog("TX CHARACTERISTIC FOUND");

                /* Notifications */

                if (
                    bleTX.properties.notify ||
                    bleTX.properties.indicate
                ) {

                    await bleTX.startNotifications();

                    bleTX.addEventListener(
                        "characteristicvaluechanged",
                        handleTelemetry
                    );

                    addLog(
                        "TELEMETRY NOTIFICATIONS ENABLED"
                    );
                }

                setBLEConnected(true);

                addLog("✓ VAJRA CONNECTED");

            } catch (error) {

                console.error(
                    "BLE ERROR:",
                    error
                );

                setBLEConnected(false);

                addLog(
                    "BLE ERROR → " +
                    error.message
                );
            }

        });

    }

    /* =====================================================
       BLE DISCONNECTED
       ===================================================== */

    function onDisconnected() {

        addLog("⚠ BLE DISCONNECTED");

        setBLEConnected(false);

        bleServer = null;
        bleService = null;
        bleRX = null;
        bleTX = null;

        armed = false;

        if (armedText) {
            armedText.textContent = "DISARMED";
        }

        if (armedIndicator) {
            armedIndicator.style.background =
                "#ff3155";

            armedIndicator.style.boxShadow =
                "none";
        }
    }

    /* =====================================================
       SEND BLE COMMAND
       ===================================================== */

    async function sendCommand(command) {

        console.log(
            "VAJRA COMMAND:",
            command.trim()
        );

        addLog(
            "TX → " +
            command.trim()
        );

        if (!bleRX) {

            addLog(
                "⚠ BLE NOT CONNECTED — COMMAND NOT SENT"
            );

            return false;
        }

        try {

            const encoder =
                new TextEncoder();

            const data =
                encoder.encode(command);

            /*
             * Use response write when supported.
             * Fall back to normal write for compatibility.
             */

            if (
                typeof bleRX.writeValueWithResponse ===
                "function"
            ) {

                await bleRX.writeValueWithResponse(
                    data
                );

            } else {

                await bleRX.writeValue(data);
            }

            return true;

        } catch (error) {

            console.error(
                "SEND ERROR:",
                error
            );

            addLog(
                "TX ERROR → " +
                error.message
            );

            return false;
        }
    }

    /* =====================================================
       START
       ===================================================== */

    if (startBtn) {

        startBtn.addEventListener("click", () => {

            if (!bleRX) {

                addLog(
                    "⚠ CONNECT BLE BEFORE START"
                );

                return;
            }

            armed = true;

            if (armedText) {

                armedText.textContent =
                    "ARMED";

                armedText.style.color =
                    "#00ff9d";
            }

            if (armedIndicator) {

                armedIndicator.style.background =
                    "#00ff9d";

                armedIndicator.style.boxShadow =
                    "0 0 15px #00ff9d";
            }

            sendCommand(
                "VAJRA:START\n"
            );

            addLog("MOTORS ARMED");

        });

    }

    /* =====================================================
       STOP ALL
       ===================================================== */

    if (stopBtn) {
        stopBtn.addEventListener(
            "click",
            stopAll
        );
    }

    if (allMotorStop) {
        allMotorStop.addEventListener(
            "click",
            stopAll
        );
    }

    function stopAll() {

        armed = false;

        if (armedText) {

            armedText.textContent =
                "DISARMED";

            armedText.style.color =
                "#ff3155";
        }

        if (armedIndicator) {

            armedIndicator.style.background =
                "#ff3155";

            armedIndicator.style.boxShadow =
                "none";
        }

        sendCommand(
            "VAJRA:STOP\n"
        );

        setMotorValue("M1", 900);
        setMotorValue("M2", 900);
        setMotorValue("M3", 900);
        setMotorValue("M4", 900);

        resetJoystick();

        addLog(
            "ALL MOTORS STOPPED"
        );
    }

    /* =====================================================
       MOTOR CONTROL
       ===================================================== */

    const motorInfo = {

        M1: {
            slider: "m1Slider",
            value: "m1Value"
        },

        M2: {
            slider: "m2Slider",
            value: "m2Value"
        },

        M3: {
            slider: "m3Slider",
            value: "m3Value"
        },

        M4: {
            slider: "m4Slider",
            value: "m4Value"
        }

    };

    function setMotorValue(
        motor,
        pulse
    ) {

        pulse =
            Math.max(
                900,
                Math.min(
                    2000,
                    Number(pulse)
                )
            );

        const info =
            motorInfo[motor];

        if (!info) return;

        const slider =
            document.getElementById(
                info.slider
            );

        const value =
            document.getElementById(
                info.value
            );

        if (slider) {
            slider.value = pulse;
        }

        if (value) {
            value.textContent = pulse;
        }
    }

    Object.keys(motorInfo).forEach(
        (motor) => {

            const info =
                motorInfo[motor];

            const slider =
                document.getElementById(
                    info.slider
                );

            if (!slider) return;

            slider.addEventListener(
                "input",
                () => {

                    const pulse =
                        Number(slider.value);

                    setMotorValue(
                        motor,
                        pulse
                    );

                    sendCommand(
                        `VAJRA:${motor} ${pulse}us\n`
                    );
                }
            );

        }
    );

    /* =====================================================
       INDIVIDUAL MOTOR START BUTTONS
       ===================================================== */

    document
        .querySelectorAll(".motor-start")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const motor =
                        button.dataset.motor;

                    if (!motor) return;

                    const info =
                        motorInfo[motor];

                    const slider =
                        document.getElementById(
                            info.slider
                        );

                    let pulse = 1000;

                    if (slider) {
                        pulse =
                            Number(slider.value);

                        if (pulse < 1000) {
                            pulse = 1000;
                        }
                    }

                    setMotorValue(
                        motor,
                        pulse
                    );

                    sendCommand(
                        `VAJRA:${motor} ${pulse}us\n`
                    );

                    addLog(
                        `${motor} → ${pulse} µs`
                    );

                }
            );

        });

    /* =====================================================
       JOYSTICK
       ===================================================== */

    if (joystick && joystickStick) {

        joystickStick.style.left = "50%";
        joystickStick.style.top = "50%";

        joystickStick.addEventListener(
            "pointerdown",
            (event) => {

                event.preventDefault();

                joystickActive = true;

                joystickStick.setPointerCapture(
                    event.pointerId
                );

                moveJoystick(
                    event.clientX,
                    event.clientY
                );
            }
        );

        joystickStick.addEventListener(
            "pointermove",
            (event) => {

                if (!joystickActive) return;

                event.preventDefault();

                moveJoystick(
                    event.clientX,
                    event.clientY
                );
            }
        );

        joystickStick.addEventListener(
            "pointerup",
            (event) => {

                joystickActive = false;

                try {
                    joystickStick.releasePointerCapture(
                        event.pointerId
                    );
                } catch (e) {}

                resetJoystick();
            }
        );

        joystickStick.addEventListener(
            "pointercancel",
            () => {

                joystickActive = false;

                resetJoystick();
            }
        );

    }

    /* =====================================================
       MOVE JOYSTICK
       ===================================================== */

    function moveJoystick(
        x,
        y
    ) {

        if (!joystick || !joystickStick) {
            return;
        }

        const rect =
            joystick.getBoundingClientRect();

        const centerX =
            rect.left +
            rect.width / 2;

        const centerY =
            rect.top +
            re
       
