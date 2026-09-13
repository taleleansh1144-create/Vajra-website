/* =========================================================
   ANSH'S DRONE VAJRA
   MAIN WEBSITE JAVASCRIPT
   ========================================================= */

"use strict";


/* =========================================================
   BLE SETTINGS
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
   PAGE START
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("VAJRA website JavaScript loaded.");

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

    const message =
        document.getElementById("loginMessage");


    if (!loginBtn || !username || !password) {

        console.error(
            "Login elements not found."
        );

        return;
    }


    loginBtn.addEventListener("click", function () {

        const user =
            username.value.trim();

        const pass =
            password.value;


        console.log(
            "Login button clicked:",
            user
        );


        if (user === "VAJRA" && pass === "VAJRA") {

            message.textContent = "";

            console.log(
                "Login successful."
            );

            showDashboard();

            addLog(
                "[LOGIN]",
                "VAJRA login successful."
            );

        } else {

            message.textContent =
                "Wrong username or password.";

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
   SHOW LOGIN
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
   SHOW DASHBOARD
========================================================= */

function showDashboard() {

    const loginScreen =
        document.getElementById("loginScreen");

    const dashboard =
        document.getElementById("dashboard");


    if (!loginScreen || !dashboard) {

        console.error(
            "Login screen or dashboard missing."
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

    const navButtons =
        document.querySelectorAll(".nav-btn");


    navButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const pageId =
                button.getAttribute("data-page");

            showPage(pageId);

        });

    });

}


/* =========================================================
   SHOW PAGE
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

        button.classList.remove("active");

    });


    const selectedPage =
        document.getElementById(pageId);


    if (selectedPage) {

        selectedPage.classList.add(
            "active-page"
        );

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
        document.getElementById("logoutBtn");


    if (!logoutBtn) return;


    logoutBtn.addEventListener("click", function () {

        disconnectBluetooth();

        const username =
            document.getElementById("username");

        const password =
            document.getElementById("password");

        const message =
            document.getElementById("loginMessage");


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

    });

}


/* =========================================================
   BLUETOOTH
========================================================= */

function setupBluetooth() {

    const connectBtn =
        document.getElementById(
            "bleConnectBtn"
        );


    if (!connectBtn) return;


    connectBtn.addEventListener(
        "click",
        connectBluetooth
    );

}


/* =========================================================
   CONNECT BLE
========================================================= */

async function connectBluetooth() {

    if (
        !navigator.bluetooth
    ) {

        alert(
            "Bluetooth is not supported in this browser. Use Chrome or Edge with a secure HTTPS page."
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
            "Device found: " +
            bleDevice.name
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


        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        addLog(
            "[BLE]",
            "RX/TX characteristics found."
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

        console.error(error);

        addLog(
            "[BLE]",
            "Connection failed: " +
            error.message
        );

        setBleConnected(false);

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
   BLE STATUS UI
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
        "VAJRA COMMAND:",
        command
    );


    addLog(
        "[TX]",
        command
    );


    if (!rxCharacteristic) {

        addLog(
            "[TX]",
            "Not connected - command not sent."
        );

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

        console.error(error);

        addLog(
            "[TX]",
            "Send error: " +
            error.message
        );

    }

}


/* =========================================================
   START / STOP
========================================================= */

function setupMotorControls() {

    const startBtn =
        document.getElementById("startBtn");

    const stopBtn =
        document.getElementById("stopBtn");

    const allStop =
        document.getElementById("allMotorStop");


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


    if (allStop) {

        allStop.addEventListener(
            "click",
            function () {

                sendCommand(
                    "VAJRA:STOP"
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


    if (!slider) return;


    slider.addEventListener(
        "input",
        function () {

            const pulse =
                Number(slider.value);


            if (value) {

                value.textContent =
                    pulse;

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


    const button =
        document.querySelector(
            '.motor-start[data-motor="' +
            motorName +
            '"]'
        );


    if (button) {

        button.addEventListener(
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
   JOYSTICK
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
            "Joystick elements missing."
        );

        return;

    }


    let dragging = false;

    let joystickRadius = 0;

    let maxDistance = 0;


    function calculateSize() {

        joystickRadius =
            joystick.clientWidth / 2;

        maxDistance =
            joystickRadius - 38;

    }


    calculateSize();

    window.addEventListener(
        "resize",
        calculateSize
    );


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


        let x =
            clientX - centerX;


        let y =
            clientY - centerY;


        const distance =
            Math.sqrt(
                x * x +
                y * y
            );


        if (distance > maxDistance) {

            x =
                (x / distance) *
                maxDistance;

            y =
                (y / distance) *
                maxDistance;

        }


        stick.style.left =
            "calc(50% + " +
            x +
            "px)";


        stick.style.top =
            "calc(50% + " +
            y +
            "px)";


        const roll =
            Math.round(
                (x / maxDistance) *
                100
            );


        const pitch =
            Math.round(
                (-y / maxDistance) *
                100
            );


        updateJoystickDisplay(
            0,
            0,
            pitch,
            roll
        );


        sendCommand(
            "VAJRA:JOY,0,0," +
            pitch +
            "," +
            roll
        );

    }


    function resetJoystick() {

        stick.style.left = "50%";

        stick.style.top = "50%";


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


    stick.addEventListener(
        "pointerdown",
        function (event) {

            dragging = true;

            stick.setPointerCapture(
                event.pointerId
            );

            moveJoystick(
                event.clientX,
                event.clientY
            );

        }
    );


    stick.addEventListener(
        "pointermove",
        function (event) {

            if (!dragging) return;

            moveJoystick(
                event.clientX,
                event.clientY
            );

        }
    );


    stick.addEventListener(
        "pointerup",
        function (event) {

            dragging = false;

            try {

                stick.releasePointerCapture(
                    event.pointerId
                );

            } catch (e) {}

            resetJoystick();

        }
    );


    stick.addEventListener(
        "pointercancel",
        function () {

            dragging = false;

            resetJoystick();

        }
    );


    joystick.addEventListener(
        "pointerdown",
        function (event) {

            if (
                event.target !== stick
            ) {

                moveJoystick(
                    event.clientX,
                    event.clientY
                );

            }

        }
    );

}


/* =========================================================
   JOYSTICK DISPLAY
========================================================= */

function updateJoystickDisplay(
    throttle,
    yaw,
    pitch,
    roll
) {

    const throttleEl =
        document.getElementById(
            "throttleValue"
        );

    const yawEl =
        document.getElementById(
            "yawValue"
        );

    const pitchEl =
        document.getElementById(
            "pitchValue"
        );

    const rollEl =
        document.getElementById(
            "rollValue"
        );


    if (throttleEl)
        throttleEl.textContent =
            throttle;


    if (yawEl)
        yawEl.textContent =
            yaw;


    if (pitchEl)
        pitchEl.textContent =
            pitch;


    if (rollEl)
        rollEl.textContent =
            roll;

}


/* =========================================================
   TELEMETRY
========================================================= */

function handleTelemetry(event) {

    try {

        const data =
            new TextDecoder().decode(
                event.target.value
            ).trim();


        console.log(
            "TELEMETRY:",
            data
        );


        addLog(
            "[RX]",
            data
        );


        if (
            !data.startsWith("TEL,")
        ) {

            return;

        }


        const fields =
            data.split(",");


        /*
          Expected format:

          TEL,
          roll,
          pitch,
          gx,
          gy,
          gz,
          m1,
          m2,
          m3,
          m4,
          rollP,
          rollI,
          rollD,
          rollPID,
          pitchP,
          pitchI,
          pitchD,
          pitchPID

          Total = 18 fields
        */

        if (fields.length < 18) {

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
   HELPER
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


function formatNumber(value) {

    if (
        Number.isNaN(value)
    ) {

        return "0.00";

    }


    return Number(value)
        .toFixed(2);

}


/* =========================================================
   LOGS
========================================================= */

function setupLogs() {

    const clearButton =
        document.getElementById(
            "clearLogs"
        );


    if (!clearButton) return;


    clearButton.addEventListener(
        "click",
        function () {

            const windowEl =
                document.getElementById(
                    "logWindow"
                );


            if (windowEl) {

                windowEl.innerHTML = "";

                addLog(
                    "[SYSTEM]",
                    "Logs cleared."
                );

            }

        }
    );

}


function addLog(
    tag,
    message
) {

    const logWindow =
        document.getElementById(
            "logWindow"
        );


    if (!logWindow) return;


    const line =
        document.createElement(
            "div"
        );


    line.className =
        "log-entry";


    const safeTag =
        document.createElement(
            "span"
        );


    safeTag.textContent =
        tag;


    line.appendChild(
        safeTag
    );


    line.appendChild(
        document.createTextNode(
            " " + message
        )
    );


    logWindow.appendChild(
        line
    );


    logWindow.scrollTop =
        logWindow.scrollHeight;

}
