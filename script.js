/* ============================================================
   ANSH'S DRONE VAJRA 🚁⚡
   CLEAN SCRIPT.JS
   Matched to current index.html
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ============================================================
       ELEMENTS
       ============================================================ */

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

    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const allMotorStop = document.getElementById("allMotorStop");

    const armedText = document.getElementById("armedText");
    const armedIndicator = document.getElementById("armedIndicator");

    const settingsBle = document.getElementById("settingsBle");

    const logWindow = document.getElementById("logWindow");
    const clearLogs = document.getElementById("clearLogs");

    /* ============================================================
       STATE
       ============================================================ */

    let bleDevice = null;
    let bleServer = null;
    let bleService = null;

    let bleRX = null;
    let bleTX = null;

    let connected = false;
    let armed = false;

    let joystickActive = false;
    let joystickPointerId = null;

    let throttle = 0;
    let yaw = 0;
    let pitch = 0;
    let roll = 0;

    /* ============================================================
       BLE UUID
       ============================================================ */

    const SERVICE_UUID =
        "12345678-1234-1234-1234-1234567890ab";

    const RX_UUID =
        "12345678-1234-1234-1234-1234567890ac";

    const TX_UUID =
        "12345678-1234-1234-1234-1234567890ad";

    /* ============================================================
       STARTUP
       ============================================================ */

    if (dashboard) {
        dashboard.style.display = "none";
    }

    if (loginScreen) {
        loginScreen.style.display = "flex";
    }

    if (username) {
        setTimeout(() => username.focus(), 100);
    }

    updateBLEUI();

    addLog("VAJRA dashboard initialized");
    addLog("Waiting for BLE connection...");

    console.log("=================================");
    console.log("VAJRA WEBSITE READY");
    console.log("=================================");

    /* ============================================================
       LOGIN
       ============================================================ */

    function loginVAJRA() {

        if (!username || !password) {
            console.error("Login inputs not found.");
            return;
        }

        const user = username.value.trim();
        const pass = password.value.trim();

        console.log("LOGIN ATTEMPT:", user);

        if (user === "VAJRA" && pass === "VAJRA") {

            console.log("VAJRA LOGIN SUCCESS");

            if (loginMessage) {
                loginMessage.textContent = "✓ ACCESS GRANTED";
                loginMessage.style.color = "#00ff9d";
            }

            setTimeout(() => {

                if (loginScreen) {
                    loginScreen.style.display = "none";
                }

                if (dashboard) {
                    dashboard.style.display = "block";
                }

                document.body.style.overflow = "auto";

                addLog("LOGIN SUCCESS — VAJRA dashboard opened");

            }, 250);

        } else {

            console.log("VAJRA LOGIN FAILED");

            if (loginMessage) {
                loginMessage.textContent =
                    "✕ INVALID USERNAME OR PASSWORD";

                loginMessage.style.color = "#ff3155";
            }

            password.value = "";
            password.focus();
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener("click", loginVAJRA);
    } else {
        console.error("ERROR: loginBtn not found.");
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
                loginVAJRA();
            }

        });

    }

    /* ============================================================
       LOGOUT
       ============================================================ */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", async () => {

            if (armed) {
                await stopAll();
            }

            disconnectBLE();

            if (dashboard) {
                dashboard.style.display = "none";
            }

            if (loginScreen) {
                loginScreen.style.display = "flex";
            }

            username.value = "";
            password.value = "";

            if (loginMessage) {
                loginMessage.textContent = "";
            }

            armed = false;

            updateArmedUI();

            setTimeout(() => {
                username.focus();
            }, 100);

            addLog("Logged out of VAJRA");

        });

    }

    /* ============================================================
       PAGE NAVIGATION
       ============================================================ */

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

            addLog("Opened " + pageName.toUpperCase() + " page");

        });

    });

    /* ============================================================
       LOGGING
       ============================================================ */

    function addLog(message) {

        if (!logWindow) {
            return;
        }

        const line = document.createElement("div");

        line.className = "log-line";

        const time =
            new Date().toLocaleTimeString();

        line.innerHTML =
            `<span>[${time}]</span> ${escapeHTML(message)}`;

        logWindow.appendChild(line);

        logWindow.scrollTop =
            logWindow.scrollHeight;
    }

    function escapeHTML(text) {

        return String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    if (clearLogs) {

        clearLogs.addEventListener("click", () => {

            if (logWindow) {
                logWindow.innerHTML = "";
            }

            addLog("LOGS CLEARED");

        });

    }

    /* ============================================================
       BLE CONNECT
       ============================================================ */

    if (bleButton) {

        bleButton.addEventListener("click", async () => {

            if (connected) {

                disconnectBLE();

            } else {

                await connectBLE();

            }

        });

    }

    async function connectBLE() {

        if (!navigator.bluetooth) {

            alert(
                "Web Bluetooth is not supported.\n\n" +
                "Please use Google Chrome or Microsoft Edge."
            );

            addLog("Web Bluetooth is not supported.");

            return;
        }

        try {

            addLog("Searching for ANSH'S DRONE VAJRA...");

            /*
             * No name filter.
             * This makes the browser Bluetooth picker
             * show compatible BLE devices.
             */

            bleDevice =
                await navigator.bluetooth.requestDevice({

                    acceptAllDevices: true,

                    optionalServices: [
                        SERVICE_UUID
                    ]

                });

            addLog(
                "BLE device selected: " +
                (bleDevice.name || "Unknown device")
            );

            bleDevice.addEventListener(
                "gattserverdisconnected",
                handleBLEDisconnect
            );

            addLog("Connecting to GATT...");

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

            addLog("RX FOUND");

            bleTX =
                await bleService.getCharacteristic(
                    TX_UUID
                );

            addLog("TX FOUND");

            /* ----------------------------------------------------
               TELEMETRY NOTIFICATIONS
               ---------------------------------------------------- */

            if (
                bleTX.properties.notify ||
                bleTX.properties.indicate
            ) {

                await bleTX.startNotifications();

                bleTX.addEventListener(
                    "characteristicvaluechanged",
                    handleTelemetry
                );

                addLog("TELEMETRY NOTIFICATIONS ACTIVE");

            }

            connected = true;
            armed = false;

            updateBLEUI();
            updateArmedUI();

            addLog("VAJRA CONNECTED");

        } catch (error) {

            console.error("BLE ERROR:", error);

            connected = false;

            updateBLEUI();

            if (error.name === "NotFoundError") {

                addLog("Bluetooth device selection cancelled.");

            } else {

                addLog(
                    "BLE ERROR: " +
                    error.message
                );

                alert(
                    "Bluetooth connection failed:\n\n" +
                    error.message
                );

            }

        }

    }

    /* ============================================================
       BLE DISCONNECT
       ============================================================ */

    function disconnectBLE() {

        try {

            if (
                bleDevice &&
                bleDevice.gatt &&
                bleDevice.gatt.connected
            ) {

                bleDevice.gatt.disconnect();

            }

        } catch (error) {

            console.error(error);

        }

        bleDevice = null;
        bleServer = null;
        bleService = null;
        bleRX = null;
        bleTX = null;

        connected = false;
        armed = false;

        updateBLEUI();
        updateArmedUI();

        addLog("VAJRA BLE disconnected");

    }

    function handleBLEDisconnect() {

        bleServer = null;
        bleService = null;
        bleRX = null;
        bleTX = null;

        connected = false;
        armed = false;

        updateBLEUI();
        updateArmedUI();

        addLog("VAJRA BLE DISCONNECTED");

    }

    /* ============================================================
       BLE UI
       ============================================================ */

    function updateBLEUI() {

        if (!bleStatus) {
            return;
        }

        if (connected) {

            bleStatus.className =
                "ble-status connected";

            bleStatus.innerHTML =
                "<span></span> BLE CONNECTED";

            if (bleButton) {
                bleButton.textContent =
                    "DISCONNECT BLE";
            }

            if (settingsBle) {
                settingsBle.textContent =
                    "Connected";
            }

        } else {

            bleStatus.className =
                "ble-status disconnected";

            bleStatus.innerHTML =
                "<span></span> BLE DISCONNECTED";

            if (bleButton) {
                bleButton.textContent =
                    "CONNECT BLE";
            }

            if (settingsBle) {
                settingsBle.textContent =
                    "Disconnected";
            }

        }

    }

    /* ============================================================
       SEND BLE COMMAND
       ============================================================ */

    async function sendCommand(command) {

        if (!bleRX) {

            console.log(
                "BLE NOT CONNECTED:",
                command
            );

            addLog(
                "COMMAND NOT SENT — BLE disconnected"
            );

            return false;
        }

        try {

            const cleanCommand =
                command.endsWith("\n")
                    ? command
                    : command + "\n";

            const data =
                new TextEncoder().encode(
                    cleanCommand
                );

            /*
             * Prefer writeWithoutResponse because
             * the ESP32 BLE RX characteristic normally
             * accepts fast writes.
             */

            if (
                typeof bleRX.writeValueWithoutResponse ===
                "function"
            ) {

                await bleRX.writeValueWithoutResponse(
                    data
                );

            } else {

                await bleRX.writeValue(data);

            }

            console.log(
                "VAJRA TX:",
                cleanCommand.trim()
            );

            addLog(
                "TX → " +
                cleanCommand.trim()
            );

            return true;

        } catch (error) {

            console.error(
                "SEND ERROR:",
                error
            );

            addLog(
                "TX ERROR: " +
                error.message
            );

            return false;
        }

    }

    /* ============================================================
       START BUTTON
       ============================================================ */

    if (startBtn) {

        startBtn.addEventListener(
            "click",
            async () => {

                if (!connected) {

                    alert(
                        "Connect VAJRA through BLE first."
                    );

                    addLog(
                        "START blocked — BLE not connected"
                    );

                    return;
                }

                armed = true;

                updateArmedUI();

                await sendCommand(
                    "VAJRA:START"
                );

                addLog(
                    "VAJRA START command sent"
                );

            }
        );

    }

    /* ============================================================
       STOP BUTTONS
       ============================================================ */

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

    async function stopAll() {

        armed = false;

        updateArmedUI();

        await sendCommand(
            "VAJRA:STOP"
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

    /* ============================================================
       ARMED UI
       ============================================================ */

    function updateArmedUI() {

        if (!armedText || !armedIndicator) {
            return;
        }

        if (armed) {

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

            armedIndicator.style.background =
                "#ff3155";

            armedIndicator.style.boxShadow =
                "none";

        }

    }

    /* ============================================================
       MOTOR SLIDERS
       ============================================================ */

    const motors = [
        "M1",
        "M2",
        "M3",
        "M4"
    ];

    motors.forEach((motor) => {

        const lower =
            motor.toLowerCase();

        const slider =
            document.getElementById(
                lower + "Slider"
            );

        const value =
            document.getElementById(
                lower + "Value"
            );

        if (!slider) {
            return;
        }

        slider.addEventListener(
            "input",
            async () => {

                const pulse =
                    Number(slider.value);

                if (value) {
                    value.textContent =
                        pulse;
                }

                /*
                 * Only send slider commands when
                 * BLE is connected.
                 */

                if (connected) {

                    await sendCommand(
                        `VAJRA:${motor} ${pulse}us`
                    );

                }

            }
        );

    });

    /* ============================================================
       INDIVIDUAL MOTOR START BUTTONS
       ============================================================ */

    document
        .querySelectorAll(".motor-start")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async () => {

                    const motor =
                        button.dataset.motor;

                    if (!motor) {
                        return;
                    }

                    if (!connected) {

                        alert(
                            "Connect VAJRA through BLE first."
                        );

                        return;
                    }

                    await sendCommand(
                        `VAJRA:${motor} START`
                    );

                    setMotorValue(
                        motor,
                        2000
                    );

                    addLog(
                        `${motor} START command sent`
                    );

                }
            );

        });

    /* ============================================================
       M
