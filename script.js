"use strict";

/* =========================================================
   ANSH'S DRONE VAJRA 🚁⚡
   COMPLETE JAVASCRIPT
========================================================= */


/* =========================================================
   BLE
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
   JOYSTICK
========================================================= */

const joystickValues = {

    throttle: 0,
    yaw: 0,
    pitch: 0,
    roll: 0

};


let lastJoystickSend = 0;

const JOYSTICK_INTERVAL = 50;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "VAJRA JS loaded."
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

    const loginButton =
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
        !loginButton ||
        !username ||
        !password
    ) {

        console.error(
            "Login elements missing."
        );

        return;

    }


    loginButton.addEventListener(
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

                if (message) {
                    message.textContent = "";
                }


                showDashboard();


                addLog(
                    "[LOGIN]",
                    "Login successful."
                );

            } else {

                if (message) {

                    message.textContent =
                        "Wrong username or password.";

                }

            }

        }
    );


    password.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                loginButton.click();

            }

        }
    );

}


/* =========================================================
   LOGIN PAGE
========================================================= */

function showLoginPage() {

    const login =
        document.getElementById(
            "loginScreen"
        );

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (login) {

        login.style.display =
            "flex";

    }


    if (dashboard) {

        dashboard.style.display =
            "none";

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function showDashboard() {

    const login =
        document.getElementById(
            "loginScreen"
        );

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (
        !login ||
        !dashboard
    ) {

        console.error(
            "Dashboard elements missing."
        );

        return;

    }


    login.style.display =
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


                    showPage(
                        page
                    );

                }
            );

        }
    );

}


/* =========================================================
   SHOW PAGE
========================================================= */

function showPage(
    pageId
) {

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


    const selectedPage =
        document.getElementById(
            pageId
        );


    if (!selectedPage) {

        console.error(
            "Page not found:",
            pageId
        );

        return;

    }


    selectedPage.classList.add(
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

    const button =
        document.getElementById(
            "logoutBtn"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        function () {

            disconnectBluetooth();

            showLoginPage();

        }
    );

}


/* =========================================================
   BLUETOOTH SETUP
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
   CONNECT BLE
========================================================= */

async function connectBluetooth() {

    console.log(
        "BLE CONNECT BUTTON CLICKED"
    );


    if (
        !navigator.bluetooth
    ) {

        alert(
            "Web Bluetooth is not supported. Use Google Chrome or Microsoft Edge."
        );

        return;

    }


    try {

        addLog(
            "[BLE]",
            "Opening Bluetooth search..."
        );


        /*
         * IMPORTANT
         *
         * Do not filter by name.
         *
         * The browser will show available
         * BLE GATT devices.
         */

        bleDevice =
            await navigator.bluetooth.requestDevice({

                acceptAllDevices: true,

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        console.log(
            "Selected BLE device:",
            bleDevice.name
        );


        addLog(
            "[BLE]",
            "Selected: " +
            (
                bleDevice.name ||
                "Unknown device"
            )
        );


        if (
            !bleDevice.gatt
        ) {

            throw new Error(
                "Selected device has no GATT interface."
            );

        }


        bleDevice.addEventListener(
            "gattserverdisconnected",
            onBluetoothDisconnected
        );


        addLog(
            "[BLE]",
            "Connecting to GATT..."
        );


        bleServer =
            await bleDevice.gatt.connect();


        addLog(
            "[BLE]",
            "GATT CONNECTED"
        );


        /*
         * Find VAJRA service.
         */

        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        addLog(
            "[BLE]",
            "SERVICE FOUND"
        );


        /*
         * Website -> Main
         */

        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        addLog(
            "[BLE]",
            "RX FOUND"
        );


        /*
         * Main -> Website
         */

        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        addLog(
            "[BLE]",
            "TX FOUND"
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
            "VAJRA CONNECTED"
        );


        /*
         * Test command.
         */

        await sendCommand(
            "VAJRA:STATUS"
        );

    } catch (error) {

        console.error(
            "BLE ERROR:",
            error
        );


        setBleConnected(
            false
        );


        addLog(
            "[BLE]",
            "ERROR: " +
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

    bleServer = null;

    rxCharacteristic = null;

    txCharacteristic = null;


    setBleConnected(
        false
    );


    addLog(
        "[BLE]",
        "VAJRA disconnected."
    );

}


/* =========================================================
   BLE UI
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
   SEND BLE COMMAND
========================================================= */

async function sendCommand(
    command
) {

    console.log(
        "VAJRA TX:",
        command
    );


    addLog(
        "[TX]",
        command
    );


    if (!rxCharacteristic) {

        return false;

    }


    try {

        const data =
            new TextEncoder().encode(
                command + "\n"
            );


        await rxCharacteristic.writeValue(
            data
        );


        return true;

    } catch (error) {

        console.error(
            error
        );


        addLog(
            "[TX]",
            "ERROR: " +
            error.message
        );


        return false;

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

                setArmed(true);

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

                setArmed(false);

                resetAllJoystickValues();

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

                setArmed(false);

                resetAllJoystickValues();

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
   MOTOR CONTROL
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
         * Cursor relative to centre.
         *
         * RIGHT = positive X
         * LEFT  = negative X
         * DOWN  = positive Y
         * UP    = negative Y
         */

        let x =
            clientX -
            centerX;


        let y =
            clientY -
            centerY;


        const stickRadius =
            stick.offsetWidth /
            2;


        const maxDistance =
            rect.width / 2 -
            stickRadius -
            5;


        const distance =
            Math.sqrt(
                x * x +
                y * y
            );


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
         * VISUAL STICK
         *
         * Cursor right -> stick right
         * Cursor left  -> stick left
         * Cursor up    -> stick up
         * Cursor down  -> stick down
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
                (
                    x /
                    maxDistance
                ) * 100
            );


        const vertical =
            Math.round(
                (
                    -y /
                    maxDistance
                ) * 100
            );


        /*
         * LEFT
         *
         * Vertical = throttle
         * Horizontal = yaw
         */

        if (
            type === "left"
        ) {

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


        /*
         * RIGHT
         *
         * Vertical = pitch
         * Horizontal = roll
         */

        if (
            type === "right"
        ) {

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


        sendJoystickCommand();

    }


    function resetJoystick() {

        stick.style.left =
            "50%";


        stick.style.top =
            "50%";


        if (
            type === "left"
        ) {

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


        if (
            type === "right"
        ) {

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


        sendJoystickCommand(true);

    }


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

function sendJoystickCommand(
    force = false
) {

    const now =
        performance.now();


    if (
        !force &&
        now -
        lastJoystickSend <
        JOYSTICK_INTERVAL
    ) {

        return;

    }


    lastJoystickSend =
        now;


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
   RESET JOYSTICKS
========================================================= */

function resetAllJoystickValues() {

    joystickValues.throttle = 0;
    joystickValues.yaw = 0;
    joystickValues.pitch = 0;
    joystickValues.roll = 0;


    const leftStick =
        document.getElementById(
            "leftJoystickStick"
        );

    const rightStick =
        document.getElementById(
            "rightJoystickStick"
        );


    if (leftStick) {

        leftStick.style.left =
            "50%";

        leftStick.style.top =
            "50%";

    }


    if (rightStick) {

        rightStick.style.left =
            "50%";

        rightStick.style.top =
            "50%";

    }


    updateValue(
        "throttleValue",
        0
    );

    updateValue(
        "yawValue",
        0
    );

    updateValue(
        "pitchValue",
        0
    );

    updateValue(
        "rollValue",
        0
    );

}


/* =========================================================
   UPDATE VALUE
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


        console.log(
            "VAJRA RX:",
            text
        );


        if (
            !text.startsWith(
                "TEL,"
            )
        ) {

            addLog(
                "[RX]",
                text
            );

            return;

        }


        const fields =
            text.split(",");


        /*
         * EXACTLY 18 fields expected.
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
            Number(
                fields[1]
            );


        const pitch =
            Number(
                fields[2]
            );


        const gx =
            Number(
                fields[3]
            );


        const gy =
            Number(
                fields[4]
            );


        const gz =
            Number(
                fields[5]
            );


        updateText(
            "telRoll",
            formatNumber(roll) + "°"
        );


        updateText(
            "telPitch",
            formatNumber(pitch) + "°"
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


    } catch (error) {

        console.error(
            "Telemetry error:",
            error
        );

    }

}


/* =========================================================
   UPDATE TEXT
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

    const clear =
        document.getElementById(
            "clearLogs"
        );


    if (!clear) return;


    clear.addEventListener(
        "click",
        function () {

            const windowElement =
                document.getElementById(
                    "logWindow"
                );


            if (windowElement) {

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
