"use strict";

/* =========================================================
   ANSH'S DRONE VAJRA 🚁⚡
   COMPLETE JAVASCRIPT
   ========================================================= */


/* =========================================================
   BLE CONFIG
========================================================= */

const BLE_DEVICE_NAME =
    "ANSH'S DRONE VAJRA";

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
   JOYSTICK VALUES
========================================================= */

const joystickValues = {

    throttle: 0,

    yaw: 0,

    pitch: 0,

    roll: 0

};


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "VAJRA JavaScript loaded."
        );


        setupLogin();

        setupNavigation();

        setupLogout();

        setupBluetooth();

        setupMotorControls();

        setupDualJoysticks();

        setupLogs();


        showLoginPage();

    }
);


/* =========================================================
   LOGIN
========================================================= */

function setupLogin() {

    const loginBtn =
        document.getElementById(
            "loginBtn"
        );

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


    if (
        !loginBtn ||
        !username ||
        !password
    ) {

        console.error(
            "Login elements not found."
        );

        return;

    }


    loginBtn.addEventListener(
        "click",
        function () {

            const user =
                username.value.trim();

            const pass =
                password.value;


            if (
                user === "VAJRA" &&
                pass === "VAJRA"
            ) {

                message.textContent =
                    "";

                showDashboard();


                addLog(
                    "[LOGIN]",
                    "Login successful."
                );

            } else {

                message.textContent =
                    "Wrong username or password.";

            }

        }
    );


    password.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                loginBtn.click();

            }

        }
    );

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLoginPage() {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (loginScreen) {

        loginScreen.style.display =
            "flex";

    }


    if (dashboard) {

        dashboard.style.display =
            "none";

    }

}


/* =========================================================
   SHOW DASHBOARD
========================================================= */

function showDashboard() {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (
        !loginScreen ||
        !dashboard
    ) {

        console.error(
            "Dashboard elements missing."
        );

        return;

    }


    loginScreen.style.display =
        "none";


    dashboard.style.display =
        "block";


    showPage(
        "controlPage"
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-btn"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const page =
                        button.getAttribute(
                            "data-page"
                        );


                    showPage(page);

                }
            );

        }
    );

}


/* =========================================================
   SHOW PAGE
========================================================= */

function showPage(pageId) {

    const pages =
        document.querySelectorAll(
            ".page"
        );

    const buttons =
        document.querySelectorAll(
            ".nav-btn"
        );


    pages.forEach(
        function (page) {

            page.classList.remove(
                "active-page"
            );

        }
    );


    buttons.forEach(
        function (button) {

            button.classList.remove(
                "active"
            );

        }
    );


    const target =
        document.getElementById(
            pageId
        );


    if (!target) {

        console.error(
            "Page does not exist:",
            pageId
        );

        return;

    }


    target.classList.add(
        "active-page"
    );


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

    const logout =
        document.getElementById(
            "logoutBtn"
        );


    if (!logout) return;


    logout.addEventListener(
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


            if (username)
                username.value = "";


            if (password)
                password.value = "";


            if (message)
                message.textContent = "";


            showLoginPage();

        }
    );

}


/* =========================================================
   BLUETOOTH
========================================================= */

function setupBluetooth() {

    const button =
        document.getElementById(
            "bleConnectBtn"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        connectBluetooth
    );

}


/* =========================================================
   CONNECT
========================================================= */

async function connectBluetooth() {

    if (!navigator.bluetooth) {

        alert(
            "Web Bluetooth is not supported. Use Chrome or Edge."
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
                        name:
                            BLE_DEVICE_NAME
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
            "VAJRA found."
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


        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        addLog(
            "[BLE]",
            "RX and TX found."
        );


        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            handleTelemetry
        );


        setBleConnected(
            true
        );


        addLog(
            "[BLE]",
            "VAJRA CONNECTED."
        );


    } catch (error) {

        console.error(
            error
        );


        setBleConnected(
            false
        );


        addLog(
            "[BLE]",
            "Connection failed: " +
            error.message
        );

    }

}


/* =========================================================
   DISCONNECT
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

        console.error(
            error
        );

    }


    bleDevice = null;

    bleServer = null;

    rxCharacteristic = null;

    txCharacteristic = null;


    setBleConnected(
        false
    );

}


/* =========================================================
   DISCONNECTED
========================================================= */

function onBluetoothDisconnected() {

    setBleConnected(
        false
    );


    addLog(
        "[BLE]",
        "VAJRA disconnected."
    );

}


/* =========================================================
   BLE STATUS
========================================================= */

function setBleConnected(
    connected
) {

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

            status.className =
                "ble-status connected";

            status.innerHTML =
                '<span class="ble-dot"></span> CONNECTED';

        } else {

            status.className =
                "ble-status disconnected";

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

async function sendCommand(
    command
) {

    console.log(
        "TX:",
        command
    );


    addLog(
        "[TX]",
        command
    );


    if (!rxCharacteristic) {

        return;

    }


    try {

        const data =
            new TextEncoder().encode(
                command + "\n"
            );


        await rxCharacteristic.writeValue(
            data
        );


    } catch (error) {

        console.error(
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

    const start =
        document.getElementById(
            "startBtn"
        );

    const stop =
        document.getElementById(
            "stopBtn"
        );

    const allStop =
        document.getElementById(
            "allMotorStop"
        );


    if (start) {

        start.addEventListener(
            "click",
            function () {

                sendCommand(
                    "VAJRA:START"
                );

                setArmed(
                    true
                );

            }
        );

    }


    if (stop) {

        stop.addEventListener(
            "click",
            function () {

                sendCommand(
                    "VAJRA:STOP"
                );

                setArmed(
                    false
                );

            }
        );

    }


    if (allStop) {

        allStop.addEventListener(
            "click",
            function () {

                sendCommand(
                    "VAJRA:STOP"
                );

                setArmed(
                    false
                );

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
   MOTOR
========================================================= */

function setupSingleMotor(
    motor,
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

            sendCommand(
                "VAJRA:" +
                motor +
                " " +
                slider.value +
                "us"
            );

        }
    );


    const button =
        document.querySelector(
            '.motor-start[data-motor="' +
            motor +
            '"]'
        );


    if (button) {

        button.addEventListener(
            "click",
            function () {

                sendCommand(
                    "VAJRA:" +
                    motor +
                    " " +
                    slider.value +
                    "us"
                );

            }
        );

    }

}


/* =========================================================
   ARM STATUS
========================================================= */

function setArmed(
    armed
) {

    const indicator =
        document.getElementById(
            "armedIndicator"
        );

    const text =
        document.getElementById(
            "armedText"
        );


    if (
        !indicator ||
        !text
    ) return;


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
            "#8290a9";

    }

}


/* =========================================================
   DUAL JOYSTICKS
========================================================= */

function setupDualJoysticks() {

    setupJoystick(
        "leftJoystick",
        "leftJoystickStick",
        "left"
    );


    setupJoystick(
        "rightJoystick",
        "rightJoystickStick",
        "right"
    );

}


/* =========================================================
   JOYSTICK ENGINE
========================================================= */

function setupJoystick(
    joystickId,
    stickId,
    type
) {

    const joystick =
        document.getElementById(
            joystickId
        );

    const stick =
        document.getElementById(
            stickId
        );


    if (
        !joystick ||
        !stick
    ) {

        console.error(
            "Joystick missing:",
            joystickId
        );

        return;

    }


    let dragging =
        false;


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
         * Cursor relative to center
         */

        let x =
            clientX -
            centerX;


        let y =
            clientY -
            centerY;


        const stickRadius =
            stick.offsetWidth / 2;


        const maxDistance =
            rect.width / 2 -
            stickRadius -
            5;


        const distance =
            Math.sqrt(
                x * x +
                y * y
            );


        /*
         * Keep stick inside circle.
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
         * VISUAL MOVEMENT
         *
         * Right cursor = right stick
         * Left cursor  = left stick
         * Up cursor    = up stick
         * Down cursor  = down stick
         */

        stick.style.left =
            "calc(50% + " +
            x +
            "px)";


        stick.style.top =
            "calc(50% + " +
            y +
            "px)";


        const horizontal =
            Math.round(
                (x / maxDistance) *
                100
            );


        /*
         * Up = positive
         * Down = negative
         */

        const vertical =
            Math.round(
                (-y / maxDistance) *
                100
            );


        if (type === "left") {

            /*
             * LEFT JOYSTICK
             *
             * Up/down = throttle
             * Left/right = yaw
             */

            joystickValues.throttle =
                Math.max(
                    0,
                    Math.min(
                        100,
                        vertical
                    )
                );


            joystickValues.yaw =
                horizontal;


            updateValue(
                "throttleValue",
                joystickValues.throttle
            );


            updateValue(
                "yawValue",
                joystickValues.yaw
            );

        }


        if (type === "right") {

            /*
             * RIGHT JOYSTICK
             *
             * Up/down = pitch
             * Left/right = roll
             */

            joystickValues.pitch =
                vertical;


            joystickValues.roll =
                horizontal;


            updateValue(
                "pitchValue",
                joystickValues.pitch
            );


            updateValue(
                "rollValue",
                joystickValues.roll
            );

        }


        /*
         * SEND ALL FOUR VALUES
         */

        sendJoystickCommand();

    }


    function resetJoystick() {

        stick.style.left =
            "50%";


        stick.style.top =
            "50%";


        if (type === "left") {

            joystickValues.throttle =
                0;

            joystickValues.yaw =
                0;


            updateValue(
                "throttleValue",
                0
            );


            updateValue(
                "yawValue",
                0
            );

        }


        if (type === "right") {

            joystickValues.pitch =
                0;

            joystickValues.roll =
                0;


            updateValue(
                "pitchValue",
                0
            );


            updateValue(
                "rollValue",
                0
            );

        }


        sendJoystickCommand();

    }


    /* =====================================================
       POINTER DOWN
    ====================================================== */

    joystick.addEventListener(
        "pointerdown",
        function (event) {

            dragging =
                true;


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
       POINTER MOVE
    ====================================================== */

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
       POINTER UP
    ====================================================== */

    joystick.addEventListener(
        "pointerup",
        function (event) {

            dragging =
                false;


            try {

                joystick.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) {}


            resetJoystick();

        }
    );


    /* =====================================================
       POINTER CANCEL
    ====================================================== */

    joystick.addEventListener(
        "pointercancel",
        function () {

            dragging =
                false;


            resetJoystick();

        }
    );

}


/* =========================================================
   SEND JOYSTICK
========================================================= */

function sendJoystickCommand() {

    const command =
        "VAJRA:JOY," +
        joystickValues.throttle +
        "," +
        joystickValues.yaw +
        "," +
        joystickValues.pitch +
        "," +
        joystickValues.roll;


    sendCommand(
        command
    );

}


/* =========================================================
   UPDATE JOYSTICK VALUE
========================================================= */

function updateValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   TELEMETRY
========================================================= */

function handleTelemetry(
    event
) {

    try {

        const text =
            new TextDecoder().decode(
                event.target.value
            ).trim();


        if (
            !text.startsWith("TEL,")
        ) {

            return;

        }


        const fields =
            text.split(",");


        /*
         * 18 fields expected:
         *
         * TEL
         * roll
         * pitch
         * gx
         * gy
         * gz
         * m1
         * m2
         * m3
         * m4
         * rollP
         * rollI
         * rollD
         * rollPID
         * pitchP
         * pitchI
         * pitchD
         * pitchPID
         */

        if (
            fields.length < 18
        ) {

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


        updateText(
            "telRoll",
            formatNumber(roll) + "°"
        );


        updateText(
            "telPitch",
            formatNumber(pitch) + "°"
        );


        updateText(
            "telGx",
            formatNumber(gx)
        );


        updateText(
            "telGy",
            formatNumber(gy)
        );


        updateText(
            "telGz",
            formatNumber(gz)
        );


        updateText(
            "telM1",
            fields[6]
        );


        updateText(
            "telM2",
            fields[7]
        );


        updateText(
            "telM3",
            fields[8]
        );


        updateText(
            "telM4",
            fields[9]
        );


        updateText(
            "rollTelemetry",
            formatNumber(roll) + "°"
        );


        updateText(
            "pitchTelemetry",
            formatNumber(pitch) + "°"
        );


        updateText(
            "rollP",
            fields[10]
        );


        updateText(
            "rollI",
            fields[11]
        );


        updateText(
            "rollD",
            fields[12]
        );


        updateText(
            "rollPID",
            fields[13]
        );


        updateText(
            "pitchP",
            fields[14]
        );


        updateText(
            "pitchI",
            fields[15]
        );


        updateText(
            "pitchD",
            fields[16]
        );


        updateText(
            "pitchPID",
            fields[17]
        );


        addLog(
            "[RX]",
            text
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

function updateText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   NUMBER
========================================================= */

function formatNumber(
    value
) {

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
   LOGS
========================================================= */

function setupLogs() {

    const button =
        document.getElementById(
            "clearLogs"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        function () {

            const windowElement =
                document.getElementById(
                    "logWindow"
                );


            if (
                windowElement
            ) {

                windowElement.innerHTML =
                    "";

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

    const windowElement =
        document.getElementById(
            "logWindow"
        );


    if (!windowElement) {
        return;
    }


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


    windowElement.appendChild(
        entry
    );


    windowElement.scrollTop =
        windowElement.scrollHeight;

}
