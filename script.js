"use strict";

/* =========================================================
   ANSH'S DRONE VAJRA 🚁⚡
   COMPLETE JAVASCRIPT
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
   JOYSTICK VALUES
========================================================= */

const joystickValues = {
    throttle: 0,
    yaw: 0,
    pitch: 0,
    roll: 0
};


/* =========================================================
   JOYSTICK SEND TIMER
========================================================= */

let lastJoystickSend = 0;

const JOYSTICK_SEND_INTERVAL = 50;


/* =========================================================
   WEBSITE START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "VAJRA JavaScript loaded successfully."
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
        document.getElementById("loginBtn");

    const username =
        document.getElementById("username");

    const password =
        document.getElementById("password");

    const message =
        document.getElementById("loginMessage");


    if (
        !loginBtn ||
        !username ||
        !password
    ) {

        console.error(
            "LOGIN ELEMENTS NOT FOUND."
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


            console.log(
                "LOGIN BUTTON CLICKED"
            );


            if (
                user === "VAJRA" &&
                pass === "VAJRA"
            ) {

                if (message) {

                    message.textContent =
                        "";

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

                loginBtn.click();

            }

        }
    );

}


/* =========================================================
   SHOW LOGIN PAGE
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
            "DASHBOARD ELEMENTS NOT FOUND."
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

                    const pageId =
                        button.getAttribute(
                            "data-page"
                        );


                    showPage(
                        pageId
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


    const page =
        document.getElementById(
            pageId
        );


    if (!page) {

        console.error(
            "PAGE NOT FOUND:",
            pageId
        );

        return;

    }


    page.classList.add(
        "active-page"
    );


    const activeButton =
        document.querySelector(
            '.nav-btn[data-page="' +
            pageId +
            '"]'
        );


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
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

                username.value =
                    "";

            }


            if (password) {

                password.value =
                    "";

            }


            if (message) {

                message.textContent =
                    "";

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


    if (!connectButton) {
        return;
    }


    connectButton.addEventListener(
        "click",
        connectBluetooth
    );

}


/* =========================================================
   CONNECT BLUETOOTH
========================================================= */

async function connectBluetooth() {

    console.log(
        "CONNECT BLE BUTTON CLICKED"
    );


    if (
        !navigator.bluetooth
    ) {

        alert(
            "Web Bluetooth is not supported by this browser. Use Google Chrome or Microsoft Edge."
        );

        return;

    }


    try {

        addLog(
            "[BLE]",
            "Opening Bluetooth device search..."
        );


        /*
         * IMPORTANT
         *
         * We are NOT filtering by name here.
         *
         * This avoids the problem where the browser
         * says "No compatible device found" because the
         * advertised name is different or hidden.
         */

        bleDevice =
            await navigator.bluetooth.requestDevice({

                acceptAllDevices: true,

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        const selectedName =
            bleDevice.name ||
            "Unknown BLE device";


        addLog(
            "[BLE]",
            "Selected: " +
            selectedName
        );


        console.log(
            "Selected BLE device:",
            bleDevice
        );


        if (!bleDevice.gatt) {

            throw new Error(
                "This device does not provide Bluetooth GATT."
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


        console.log(
            "GATT connected."
        );


        /*
         * Get VAJRA service.
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
         * RX = website -> ESP32
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
         * TX = ESP32 -> website
         */

        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        addLog(
            "[BLE]",
            "TX FOUND"
        );


        /*
         * Enable telemetry notifications.
         */

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
         * Send initial heartbeat/test.
         */

        sendCommand(
            "VAJRA:STATUS"
        );


    } catch (error) {

        console.error(
            "BLUETOOTH ERROR:",
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
   BLUETOOTH DISCONNECT
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
   BLUETOOTH DISCONNECTED EVENT
========================================================= */

function onBluetoothDisconnected() {

    console.log(
        "VAJRA BLE DISCONNECTED"
    );


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


    /*
       Always show command in logs.
    */

    addLog(
        "[TX]",
        command
    );


    /*
       Website can be tested even when BLE
       is not connected.
    */

    if (!rxCharacteristic) {

        console.log(
            "BLE not connected. Command not sent."
        );

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
            "BLE WRITE ERROR:",
            error
        );


        addLog(
            "[TX]",
            "Write failed: " +
            error.message
        );


        return false;

    }

}


/* =========================================================
   START / STOP
========================================================= */

function setupMotorControls() {

    const startButton =
        document.getElementById(
            "startBtn"
        );

    const stopButton =
        document.getElementById(
            "stopBtn"
        );

    const allStopButton =
        document.getElementById(
            "allMotorStop"
        );


    if (startButton) {

        startButton.addEventListener(
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


    if (stopButton) {

        stopButton.addEventListener(
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


    if (allStopButton) {

        allStopButton.addEventListener(
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
   SINGLE MOTOR
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


    if (!slider) {
        return;
    }


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
                Number(
                    slider.value
                );


            sendCommand(
                "VAJRA:" +
                motorName +
                " " +
                pulse +
                "us"
            );

        }
    );


    const motorButton =
        document.querySelector(
            '.motor-start[data-motor="' +
            motorName +
            '"]'
        );


    if (motorButton) {

        motorButton.addEventListener(
            "click",
            function () {

                const pulse =
                    Number(
                        slider.value
                    );


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
    ) {

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
   JOYSTICK
========================================================= */

function setupJoystick(
    joystickId,
    stickId,
    joystickType
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


    let dragging = false;


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
         * Position relative to joystick centre.
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
         * MOVE STICK TOWARD CURSOR
         *
         * This is the important fix.
         */

        stick.style.left =
            "calc(50% + " +
            x +
            "px)";


        stick.style.top =
            "calc(50% + " +
            y +
            "px)";


        /*
         * Convert to -100 ... +100
         */

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
         * LEFT JOYSTICK
         *
         * UP    = throttle increases
         * DOWN  = throttle decreases
         * LEFT  = yaw -
         * RIGHT = yaw +
         */

        if (
            joystickType === "left"
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
         * RIGHT JOYSTICK
         *
         * UP    = pitch +
         * DOWN  = pitch -
         * LEFT  = roll -
         * RIGHT = roll +
         */

        if (
            joystickType === "right"
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


        /*
         * Send control at a limited rate.
         */

        sendJoystickCommand();

    }


    function resetJoystick() {

        stick.style.left =
            "50%";


        stick.style.top =
            "50%";


        if (
            joystickType === "left"
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
            joystickType === "right"
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


        sendJoystickCommand(
            true
        );

    }


    /*
     * POINTER DOWN
     */

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


    /*
     * POINTER MOVE
     */

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


    /*
     * POINTER UP
     */

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


    /*
     * POINTER CANCEL
     */

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
   SEND JOYSTICK COMMAND
========================================================= */

function sendJoystickCommand(
    force = false
) {

    const now =
        performance.now();


    /*
     * Prevent hundreds of BLE writes per second.
     */

    if (
        !force &&
        now -
        lastJoystickSend <
        JOYSTICK_SEND_INTERVAL
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
   UPDATE JOYSTICK DISPLAY
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


        /*
         * Status responses
         */

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
         * Expected 18 fields.
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


        /*
         * Attitude
         */

        updateText(
            "telRoll",
            formatNumber(roll) +
            "°"
        );


        updateText(
            "telPitch",
            formatNumber(pitch) +
            "°"
        );


        updateText(
            "rollTelemetry",
            formatNumber(roll) +
            "°"
        );


        updateText(
            "pitchTelemetry",
            formatNumber(pitch) +
            "°"
        );


        /*
         * Gyroscope
         */

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


        /*
         * Motors
         */

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


        /*
         * PID
         */

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
   NUMBER FORMAT
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
   LOG SETUP
========================================================= */

function setupLogs() {

    const clearButton =
        document.getElementById(
            "clearLogs"
        );


    if (!clearButton) {
        return;
    }


    clearButton.addEventListener(
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
