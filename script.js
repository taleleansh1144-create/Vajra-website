"use strict";

/* =========================================================
   ANSH'S DRONE VAJRA 🚁⚡
   COMPLETE WEBSITE JAVASCRIPT
   ========================================================= */


/* =========================================================
   BLE CONFIGURATION
========================================================= */

const BLE_DEVICE_NAME = "ANSH'S DRONE VAJRA";

const SERVICE_UUID =
    "12345678-1234-1234-1234-1234567890ab";

const RX_UUID =
    "12345678-1234-1234-1234-1234567890ac";

const TX_UUID =
    "12345678-1234-1234-1234-1234567890ad";


let bleDevice = null;
let bleServer = null;
let rxCharacteristic = null;
let txCharacteristic = null;


/* =========================================================
   START WEBSITE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("VAJRA website loaded.");

    setupLogin();
    setupNavigation();
    setupLogout();
    setupBluetooth();
    setupMotorControls();
    setupJoystick();
    setupLogs();

    showLoginPage();

});


/* =========================================================
   LOGIN
========================================================= */

function setupLogin() {

    const loginBtn =
        document.getElementById("loginBtn");

    const username =
        document.getElementById("username");

    const password =
        document.getElementById("password");

    const loginMessage =
        document.getElementById("loginMessage");


    if (!loginBtn || !username || !password) {

        console.error("Login elements missing.");

        return;
    }


    loginBtn.addEventListener("click", function () {

        const user =
            username.value.trim();

        const pass =
            password.value;


        console.log("Login clicked:", user);


        if (
            user === "VAJRA" &&
            pass === "VAJRA"
        ) {

            if (loginMessage) {
                loginMessage.textContent = "";
            }

            showDashboard();

            addLog(
                "[LOGIN]",
                "Login successful."
            );

        } else {

            if (loginMessage) {

                loginMessage.textContent =
                    "Wrong username or password.";

            }

        }

    });


    password.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                loginBtn.click();

            }

        }
    );

}


/* =========================================================
   LOGIN PAGE
========================================================= */

function showLoginPage() {

    const loginScreen =
        document.getElementById("loginScreen");

    const dashboard =
        document.getElementById("dashboard");


    if (loginScreen) {

        loginScreen.style.display = "flex";

    }


    if (dashboard) {

        dashboard.style.display = "none";

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function showDashboard() {

    const loginScreen =
        document.getElementById("loginScreen");

    const dashboard =
        document.getElementById("dashboard");


    if (!loginScreen || !dashboard) {

        console.error(
            "Login screen or dashboard not found."
        );

        return;
    }


    loginScreen.style.display = "none";

    dashboard.style.display = "block";


    showPage("controlPage");

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(".nav-btn");


    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const pageId =
                    button.getAttribute(
                        "data-page"
                    );

                showPage(pageId);

            }
        );

    });

}


/* =========================================================
   CHANGE PAGE
========================================================= */

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");

    const buttons =
        document.querySelectorAll(".nav-btn");


    pages.forEach(function (page) {

        page.classList.remove(
            "active-page"
        );

    });


    buttons.forEach(function (button) {

        button.classList.remove(
            "active"
        );

    });


    const selectedPage =
        document.getElementById(pageId);


    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );

    } else {

        console.error(
            "Page not found:",
            pageId
        );

        return;
    }


    const selectedButton =
        document.querySelector(
            '.nav-btn[data-page="' +
            pageId +
            '"]'
        );


    if (selectedButton) {

        selectedButton.classList.add(
            "active"
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutBtn) return;


    logoutBtn.addEventListener(
        "click",
        function () {

            disconnectBluetooth();

            const username =
                document.getElementById(
                    "username"
                );

            const password =
                document.getElementById(
                    "password"
                );

            const message =
                document.getElementById(
                    "loginMessage"
                );


            if (username) {
                username.value = "";
            }


            if (password) {
                password.value = "";
            }


            if (message) {
                message.textContent = "";
            }


            showLoginPage();

        }
    );

}


/* =========================================================
   BLUETOOTH SETUP
========================================================= */

function setupBluetooth() {

    const connectButton =
        document.getElementById(
            "bleConnectBtn"
        );


    if (!connectButton) return;


    connectButton.addEventListener(
        "click",
        connectBluetooth
    );

}


/* =========================================================
   CONNECT TO VAJRA
========================================================= */

async function connectBluetooth() {

    if (!navigator.bluetooth) {

        alert(
            "Web Bluetooth is not supported in this browser. Use Chrome or Edge."
        );

        return;
    }


    try {

        addLog(
            "[BLE]",
            "Searching for VAJRA..."
        );


        bleDevice =
            await navigator.bluetooth.requestDevice({

                filters: [
                    {
                        name: BLE_DEVICE_NAME
                    }
                ],

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        bleDevice.addEventListener(
            "gattserverdisconnected",
            onBluetoothDisconnected
        );


        addLog(
            "[BLE]",
            "VAJRA device found."
        );


        bleServer =
            await bleDevice.gatt.connect();


        addLog(
            "[BLE]",
            "GATT connected."
        );


        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        addLog(
            "[BLE]",
            "Service found."
        );


        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        addLog(
            "[BLE]",
            "RX found."
        );


        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        addLog(
            "[BLE]",
            "TX found."
        );


        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            handleTelemetry
        );


        setBleConnected(true);


        addLog(
            "[BLE]",
            "VAJRA CONNECTED."
        );


    } catch (error) {

        console.error(
            "BLE error:",
            error
        );


        addLog(
            "[BLE]",
            "Connection failed: " +
            error.message
        );


        setBleConnected(false);

    }

}


/* =========================================================
   DISCONNECT BLUETOOTH
========================================================= */

function disconnectBluetooth() {

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

    rxCharacteristic = null;
    txCharacteristic = null;

    setBleConnected(false);

}


/* =========================================================
   BLE DISCONNECTED
========================================================= */

function onBluetoothDisconnected() {

    setBleConnected(false);

    addLog(
        "[BLE]",
        "VAJRA disconnected."
    );

}


/* =========================================================
   BLE STATUS
========================================================= */

function setBleConnected(connected) {

    const status =
        document.getElementById(
            "bleStatus"
        );

    const settings =
        document.getElementById(
            "settingsBle"
        );

    const button =
        document.getElementById(
            "bleConnectBtn"
        );


    if (status) {

        if (connected) {

            status.classList.remove(
                "disconnected"
            );

            status.classList.add(
                "connected"
            );

            status.innerHTML =
                '<span class="ble-dot"></span> CONNECTED';

        } else {

            status.classList.remove(
                "connected"
            );

            status.classList.add(
                "disconnected"
            );

            status.innerHTML =
                '<span class="ble-dot"></span> DISCONNECTED';

        }

    }


    if (settings) {

        settings.textContent =
            connected
                ? "CONNECTED"
                : "DISCONNECTED";

    }


    if (button) {

        button.textContent =
            connected
                ? "CONNECTED"
                : "CONNECT BLE";

    }

}


/* =========================================================
   SEND COMMAND
========================================================= */

async function sendCommand(command) {

    console.log(
        "TX:",
        command
    );


    addLog(
        "[TX]",
        command
    );


    if (!rxCharacteristic) {

        addLog(
            "[TX]",
            "BLE not connected."
        );

        return;

    }


    try {

        const bytes =
            new TextEncoder().encode(
                command + "\n"
            );


        await rxCharacteristic.writeValue(
            bytes
        );


    } catch (error) {

        console.error(
            "Send command error:",
            error
        );


        addLog(
            "[TX]",
            "ERROR: " +
            error.message
        );

    }

}


/* =========================================================
   START / STOP
========================================================= */

function setupMotorControls() {

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


    if (startBtn) {

        startBtn.addEventListener(
            "click",
            function () {

                sendCommand(
                    "VAJRA:START"
                );

                setArmed(true);

            }
        );

    }


    if (stopBtn) {

        stopBtn.addEventListener(
            "click",
            function () {

                sendCommand(
                    "VAJRA:STOP"
                );

                setArmed(false);

            }
        );

    }


    if (allMotorStop) {

        allMotorStop.addEventListener(
            "click",
            function () {

                sendCommand(
                    "VAJRA:STOP"
                );

                setArmed(false);

            }
        );

    }


    setupSingleMotor(
        "M1",
        "m1Slider",
        "m1Value"
    );

    setupSingleMotor(
        "M2",
        "m2Slider",
        "m2Value"
    );

    setupSingleMotor(
        "M3",
        "m3Slider",
        "m3Value"
    );

    setupSingleMotor(
        "M4",
        "m4Slider",
        "m4Value"
    );

}


/* =========================================================
   INDIVIDUAL MOTOR
========================================================= */

function setupSingleMotor(
    motorName,
    sliderId,
    valueId
) {

    const slider =
        document.getElementById(
            sliderId
        );

    const value =
        document.getElementById(
            valueId
        );


    if (!slider) return;


    slider.addEventListener(
        "input",
        function () {

            if (value) {

                value.textContent =
                    slider.value;

            }

        }
    );


    slider.addEventListener(
        "change",
        function () {

            const pulse =
                Number(slider.value);


            sendCommand(
                "VAJRA:" +
                motorName +
                " " +
                pulse +
                "us"
            );

        }
    );


    const startButton =
        document.querySelector(
            '.motor-start[data-motor="' +
            motorName +
            '"]'
        );


    if (startButton) {

        startButton.addEventListener(
            "click",
            function () {

                const pulse =
                    Number(slider.value);


                sendCommand(
                    "VAJRA:" +
                    motorName +
                    " " +
                    pulse +
                    "us"
                );

            }
        );

    }

}


/* =========================================================
   ARM STATUS
========================================================= */

function setArmed(armed) {

    const indicator =
        document.getElementById(
            "armedIndicator"
        );

    const text =
        document.getElementById(
            "armedText"
        );


    if (!indicator || !text) {
        return;
    }


    if (armed) {

        indicator.style.background =
            "#00ff9d";

        indicator.style.boxShadow =
            "0 0 12px #00ff9d";

        text.textContent =
            "ARMED";

        text.style.color =
            "#00ff9d";

    } else {

        indicator.style.background =
            "#ff3158";

        indicator.style.boxShadow =
            "0 0 12px #ff3158";

        text.textContent =
            "DISARMED";

        text.style.color =
            "#8290aa";

    }

}


/* =========================================================
   FIXED JOYSTICK
========================================================= */

function setupJoystick() {

    const joystick =
        document.getElementById(
            "joystick"
        );

    const stick =
        document.getElementById(
            "joystickStick"
        );


    if (!joystick || !stick) {

        console.error(
            "Joystick not found."
        );

        return;

    }


    let dragging = false;


    /*
     * We use the actual joystick dimensions.
     * This prevents the stick from going outside the circle.
     */

    function moveJoystick(
        clientX,
        clientY
    ) {

        const rect =
            joystick.getBoundingClientRect();


        const centerX =
            rect.left +
            rect.width / 2;


        const centerY =
            rect.top +
            rect.height / 2;


        /*
         * THIS IS THE IMPORTANT PART.
         *
         * Cursor position minus joystick centre
         * gives the direction from centre to cursor.
         *
         * Positive X = RIGHT
         * Negative X = LEFT
         *
         * Positive Y = DOWN
         * Negative Y = UP
         */

        let x =
            clientX - centerX;

        let y =
            clientY - centerY;


        const stickRadius =
            stick.offsetWidth / 2;


        const maxDistance =
            rect.width / 2 -
            stickRadius -
            4;


        const distance =
            Math.sqrt(
                (x * x) +
                (y * y)
            );


        /*
         * Keep stick inside joystick.
         */

        if (
            distance >
            maxDistance
        ) {

            x =
                (x / distance) *
                maxDistance;

            y =
                (y / distance) *
                maxDistance;

        }


        /*
         * MOVE VISUAL STICK
         *
         * Cursor RIGHT  -> x positive -> stick RIGHT
         * Cursor LEFT   -> x negative -> stick LEFT
         * Cursor DOWN   -> y positive -> stick DOWN
         * Cursor UP     -> y negative -> stick UP
         */

        stick.style.left =
            `calc(50% + ${x}px)`;

        stick.style.top =
            `calc(50% + ${y}px)`;


        /*
         * Convert position into
         * flight-control values.
         */

        const roll =
            Math.round(
                (x / maxDistance) * 100
            );


        /*
         * Flight pitch is normally
         * positive when joystick moves UP.
         */

        const pitch =
            Math.round(
                (-y / maxDistance) * 100
            );


        updateJoystickDisplay(
            0,
            0,
            pitch,
            roll
        );


        /*
         * Send command to Main ESP32-C3.
         *
         * Throttle = 0
         * Yaw      = 0
         */

        sendCommand(
            "VAJRA:JOY,0,0," +
            pitch +
            "," +
            roll
        );

    }


    /* =====================================================
       RESET JOYSTICK
    ===================================================== */

    function resetJoystick() {

        stick.style.left =
            "50%";

        stick.style.top =
            "50%";


        updateJoystickDisplay(
            0,
            0,
            0,
            0
        );


        sendCommand(
            "VAJRA:JOY,0,0,0,0"
        );

    }


    /* =====================================================
       MOUSE / TOUCH START
    ===================================================== */

    joystick.addEventListener(
        "pointerdown",
        function (event) {

            dragging = true;


            try {

                joystick.setPointerCapture(
                    event.pointerId
                );

            } catch (error) {}


            moveJoystick(
                event.clientX,
                event.clientY
            );


            event.preventDefault();

        }
    );


    /* =====================================================
       MOUSE / TOUCH MOVE
    ===================================================== */

    joystick.addEventListener(
        "pointermove",
        function (event) {

            if (!dragging) {
                return;
            }


            moveJoystick(
                event.clientX,
                event.clientY
            );


            event.preventDefault();

        }
    );


    /* =====================================================
       RELEASE
    ===================================================== */

    joystick.addEventListener(
        "pointerup",
        function (event) {

            dragging = false;


            try {

                joystick.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) {}


            resetJoystick();

        }
    );


    /* =====================================================
       CANCEL
    ===================================================== */

    joystick.addEventListener(
        "pointercancel",
        function () {

            dragging = false;

            resetJoystick();

        }
    );

}


/* =========================================================
   JOYSTICK VALUES
========================================================= */

function updateJoystickDisplay(
    throttle,
    yaw,
    pitch,
    roll
) {

    const throttleValue =
        document.getElementById(
            "throttleValue"
        );

    const yawValue =
        document.getElementById(
            "yawValue"
        );

    const pitchValue =
        document.getElementById(
            "pitchValue"
        );

    const rollValue =
        document.getElementById(
            "rollValue"
        );


    if (throttleValue) {

        throttleValue.textContent =
            throttle;

    }


    if (yawValue) {

        yawValue.textContent =
            yaw;

    }


    if (pitchValue) {

        pitchValue.textContent =
            pitch;

    }


    if (rollValue) {

        rollValue.textContent =
            roll;

    }

}


/* =========================================================
   TELEMETRY
========================================================= */

function handleTelemetry(event) {

    try {

        const text =
            new TextDecoder().decode(
                event.target.value
            ).trim();


        console.log(
            "RX:",
            text
        );


        addLog(
            "[RX]",
            text
        );


        if (
            !text.startsWith("TEL,")
        ) {

            return;

        }


        const fields =
            text.split(",");


        /*
         * Total telemetry fields = 18
         */

        if (
            fields.length < 18
        ) {

            console.warn(
                "Invalid telemetry:",
                text
            );

            return;

        }


        const roll =
            Number(fields[1]);

        const pitch =
            Number(fields[2]);

        const gx =
            Number(fields[3]);

        const gy =
            Number(fields[4]);

        const gz =
            Number(fields[5]);


        const m1 =
            Number(fields[6]);

        const m2 =
            Number(fields[7]);

        const m3 =
            Number(fields[8]);

        const m4 =
            Number(fields[9]);


        setText(
            "telRoll",
            formatNumber(roll) + "°"
        );


        setText(
            "telPitch",
            formatNumber(pitch) + "°"
        );


        setText(
            "telGx",
            formatNumber(gx)
        );


        setText(
            "telGy",
            formatNumber(gy)
        );


        setText(
            "telGz",
            formatNumber(gz)
        );


        setText(
            "telM1",
            m1
        );


        setText(
            "telM2",
            m2
        );


        setText(
            "telM3",
            m3
        );


        setText(
            "telM4",
            m4
        );


        setText(
            "rollTelemetry",
            formatNumber(roll) + "°"
        );


        setText(
            "pitchTelemetry",
            formatNumber(pitch) + "°"
        );


        setText(
            "rollP",
            fields[10]
        );

        setText(
            "rollI",
            fields[11]
        );

        setText(
            "rollD",
            fields[12]
        );

        setText(
            "rollPID",
            fields[13]
        );


        setText(
            "pitchP",
            fields[14]
        );

        setText(
            "pitchI",
            fields[15]
        );

        setText(
            "pitchD",
            fields[16]
        );

        setText(
            "pitchPID",
            fields[17]
        );


    } catch (error) {

        console.error(
            "Telemetry error:",
            error
        );

    }

}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(value) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return "0.00";

    }


    return number.toFixed(2);

}


/* =========================================================
   LOG SYSTEM
========================================================= */

function setupLogs() {

    const clearLogs =
        document.getElementById(
            "clearLogs"
        );


    if (!clearLogs) return;


    clearLogs.addEventListener(
        "click",
        function () {

            const logWindow =
                document.getElementById(
                    "logWindow"
                );


            if (logWindow) {

                logWindow.innerHTML = "";

                addLog(
                    "[SYSTEM]",
                    "Logs cleared."
                );

            }

        }
    );

}


/* =========================================================
   ADD LOG
========================================================= */

function addLog(
    tag,
    message
) {

    const logWindow =
        document.getElementById(
            "logWindow"
        );


    if (!logWindow) return;


    const entry =
        document.createElement(
            "div"
        );


    entry.className =
        "log-entry";


    const tagElement =
        document.createElement(
            "span"
        );


    tagElement.textContent =
        tag;


    entry.appendChild(
        tagElement
    );


    entry.appendChild(
        document.createTextNode(
            " " + message
        )
    );


    logWindow.appendChild(
        entry
    );


    logWindow.scrollTop =
        logWindow.scrollHeight;

}
