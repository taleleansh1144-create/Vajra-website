/* =========================================================
   ANSH'S DRONE VAJRA 🚁⚡
   VAJRA WEBSITE - FULL CORRECTED SCRIPT
========================================================= */

"use strict";

// =========================================================
// LOGIN
// =========================================================

const VALID_USERNAME = "VAJRA";
const VALID_PASSWORD = "VAJRA";

const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");


// =========================================================
// BLE UUIDs
// =========================================================

const SERVICE_UUID =
    "12345678-1234-1234-1234-1234567890ab";

const RX_UUID =
    "12345678-1234-1234-1234-1234567890ac";

const TX_UUID =
    "12345678-1234-1234-1234-1234567890ad";

const VAJRA_DEVICE_NAME =
    "ANSH'S DRONE VAJRA";


// =========================================================
// BLE VARIABLES
// =========================================================

let vajraDevice = null;
let vajraServer = null;
let vajraService = null;

let vajraRx = null;
let vajraTx = null;

let bluetoothConnected = false;


// =========================================================
// BLE WRITE QUEUE
// =========================================================

let writeQueue = Promise.resolve();


// =========================================================
// LOGGING
// =========================================================

const logContainer =
    document.getElementById("logContainer");

function addLog(message) {

    console.log(message);

    if (!logContainer) {
        return;
    }

    const entry =
        document.createElement("div");

    entry.className = "log-entry";

    entry.textContent =
        `[${new Date().toLocaleTimeString()}] ${message}`;

    logContainer.appendChild(entry);

    logContainer.scrollTop =
        logContainer.scrollHeight;
}


// =========================================================
// LOGIN
// =========================================================

function login() {

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    if (
        username === VALID_USERNAME &&
        password === VALID_PASSWORD
    ) {

        loginMessage.textContent = "";

        loginPage.classList.add("hidden");
        dashboard.classList.remove("hidden");

        addLog("VAJRA login successful");

    } else {

        loginMessage.textContent =
            "Invalid username or password.";

    }
}

loginBtn.addEventListener(
    "click",
    login
);

passwordInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            login();
        }

    }
);

usernameInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            passwordInput.focus();
        }

    }
);


// =========================================================
// PAGE NAVIGATION
// =========================================================

const navButtons =
    document.querySelectorAll(".nav-btn");

const appPages =
    document.querySelectorAll(".app-page");

navButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const pageId =
                button.dataset.page;

            navButtons.forEach(
                btn =>
                    btn.classList.remove("active")
            );

            appPages.forEach(
                page =>
                    page.classList.remove(
                        "active-page"
                    )
            );

            button.classList.add("active");

            const selectedPage =
                document.getElementById(pageId);

            if (selectedPage) {

                selectedPage.classList.add(
                    "active-page"
                );

            }

        }
    );

});


// =========================================================
// CONNECTION UI
// =========================================================

const bluetoothBtn =
    document.getElementById(
        "bluetoothBtn"
    );

const settingsBluetoothBtn =
    document.getElementById(
        "settingsBluetoothBtn"
    );

const connectionIndicator =
    document.getElementById(
        "connectionIndicator"
    );

const connectionText =
    document.getElementById(
        "connectionText"
    );


function setConnectionStatus(
    connected
) {

    bluetoothConnected =
        connected;

    if (connected) {

        connectionIndicator.classList
            .remove("disconnected");

        connectionIndicator.classList
            .add("connected");

        connectionText.textContent =
            "CONNECTED";

        bluetoothBtn.textContent =
            "DISCONNECT BLUETOOTH";

        if (settingsBluetoothBtn) {

            settingsBluetoothBtn.textContent =
                "DISCONNECT BLUETOOTH";
        }

    } else {

        connectionIndicator.classList
            .remove("connected");

        connectionIndicator.classList
            .add("disconnected");

        connectionText.textContent =
            "DISCONNECTED";

        bluetoothBtn.textContent =
            "CONNECT BLUETOOTH";

        if (settingsBluetoothBtn) {

            settingsBluetoothBtn.textContent =
                "CONNECT BLUETOOTH";
        }
    }
}


// =========================================================
// CONNECT BUTTON
// =========================================================

bluetoothBtn.addEventListener(
    "click",
    async () => {

        if (bluetoothConnected) {

            disconnectVAJRA();

        } else {

            await connectVAJRA();

        }

    }
);


if (settingsBluetoothBtn) {

    settingsBluetoothBtn.addEventListener(
        "click",
        async () => {

            if (bluetoothConnected) {

                disconnectVAJRA();

            } else {

                await connectVAJRA();

            }

        }
    );

}


// =========================================================
// CONNECT VAJRA
// =========================================================

async function connectVAJRA() {

    try {

        // -----------------------------------------------------
        // Browser support
        // -----------------------------------------------------

        if (!navigator.bluetooth) {

            addLog(
                "Web Bluetooth is not supported."
            );

            alert(
                "Please use Google Chrome or Microsoft Edge."
            );

            return;
        }


        addLog(
            "Opening Bluetooth device picker..."
        );


        // -----------------------------------------------------
        // IMPORTANT:
        // Accept ANY BLE device.
        // This avoids problems with the device-name filter.
        // We still request the VAJRA service.
        // -----------------------------------------------------

        vajraDevice =
            await navigator.bluetooth.requestDevice({

                acceptAllDevices: true,

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        if (!vajraDevice) {

            addLog(
                "No device selected."
            );

            return;
        }


        addLog(
            "Selected device: " +
            (
                vajraDevice.name ||
                "Unnamed BLE device"
            )
        );


        // -----------------------------------------------------
        // Disconnect listener
        // -----------------------------------------------------

        vajraDevice.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );


        // -----------------------------------------------------
        // GATT CONNECT
        // -----------------------------------------------------

        addLog(
            "Connecting to GATT..."
        );

        vajraServer =
            await vajraDevice.gatt.connect();

        addLog(
            "GATT CONNECTED"
        );


        // -----------------------------------------------------
        // SERVICE
        // -----------------------------------------------------

        addLog(
            "Looking for VAJRA service..."
        );

        vajraService =
            await vajraServer.getPrimaryService(
                SERVICE_UUID
            );

        addLog(
            "SERVICE FOUND"
        );


        // -----------------------------------------------------
        // RX
        // -----------------------------------------------------

        vajraRx =
            await vajraService.getCharacteristic(
                RX_UUID
            );

        addLog(
            "RX FOUND"
        );


        // -----------------------------------------------------
        // TX
        // -----------------------------------------------------

        vajraTx =
            await vajraService.getCharacteristic(
                TX_UUID
            );

        addLog(
            "TX FOUND"
        );


        // -----------------------------------------------------
        // Notifications
        // -----------------------------------------------------

        await vajraTx.startNotifications();

        vajraTx.addEventListener(
            "characteristicvaluechanged",
            handleTelemetry
        );

        addLog(
            "TELEMETRY NOTIFICATIONS ENABLED"
        );


        // -----------------------------------------------------
        // Connected
        // -----------------------------------------------------

        setConnectionStatus(
            true
        );

        addLog(
            "VAJRA CONNECTED"
        );

    }
    catch (error) {

        console.error(
            "BLE connection error:",
            error
        );

        addLog(
            "BLE ERROR: " +
            error.message
        );

        setConnectionStatus(
            false
        );

    }
}


// =========================================================
// DISCONNECT
// =========================================================

function disconnectVAJRA() {

    try {

        if (vajraTx) {

            vajraTx.removeEventListener(
                "characteristicvaluechanged",
                handleTelemetry
            );

        }


        if (
            vajraDevice &&
            vajraDevice.gatt &&
            vajraDevice.gatt.connected
        ) {

            vajraDevice.gatt.disconnect();

        }

    }
    catch (error) {

        console.error(error);

    }


    vajraRx = null;
    vajraTx = null;
    vajraService = null;
    vajraServer = null;
    vajraDevice = null;

    setConnectionStatus(
        false
    );

    addLog(
        "VAJRA DISCONNECTED"
    );
}


// =========================================================
// GATT DISCONNECT CALLBACK
// =========================================================

function handleDisconnect() {

    vajraRx = null;
    vajraTx = null;
    vajraService = null;
    vajraServer = null;

    setConnectionStatus(
        false
    );

    addLog(
        "Bluetooth connection lost"
    );
}


// =========================================================
// SEND COMMAND
// =========================================================

function sendCommand(
    command
) {

    if (!vajraRx) {

        addLog(
            "Command blocked: BLE not connected"
        );

        return;
    }


    const finalCommand =
        `VAJRA:${command}\n`;


    writeQueue =
        writeQueue.then(
            async () => {

                try {

                    const data =
                        new TextEncoder()
                            .encode(
                                finalCommand
                            );


                    await vajraRx
                        .writeValueWithResponse(
                            data
                        );


                    addLog(
                        "COMMAND SENT: " +
                        finalCommand.trim()
                    );

                }
                catch (error) {

                    addLog(
                        "BLE WRITE ERROR: " +
                        error.message
                    );

                }

            }
        );

}


// =========================================================
// START
// =========================================================

document
    .getElementById("startBtn")
    .addEventListener(
        "click",
        () => {

            sendCommand(
                "START"
            );

        }
    );


// =========================================================
// STOP
// =========================================================

document
    .getElementById("stopBtn")
    .addEventListener(
        "click",
        () => {

            sendCommand(
                "STOP"
            );

        }
    );


// =========================================================
// INDIVIDUAL MOTOR BUTTONS
// =========================================================

document
    .querySelectorAll(".motor-start")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const motor =
                    button.dataset.motor;

                sendCommand(
                    `${motor} START`
                );

            }
        );

    });


document
    .querySelectorAll(".motor-stop")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const motor =
                    button.dataset.motor;

                sendCommand(
                    `${motor} STOP`
                );

            }
        );

    });


// =========================================================
// TELEMETRY
// =========================================================
//
// Expected:
//
// TEL,
// roll,
// pitch,
// gx,
// gy,
// gz,
// m1,
// m2,
// m3,
// m4,
// rollP,
// rollI,
// rollD,
// rollPID,
// pitchP,
// pitchI,
// pitchD,
// pitchPID
//
// Total = 18 fields including TEL
// =========================================================

function handleTelemetry(
    event
) {

    try {

        const value =
            event.target.value;

        const decoder =
            new TextDecoder();

        const text =
            decoder
                .decode(value)
                .trim();


        if (!text) {
            return;
        }


        console.log(
            "BLE TELEMETRY:",
            text
        );


        if (
            !text.startsWith("TEL,")
        ) {
            return;
        }


        const parts =
            text.split(",");


        if (
            parts.length < 18
        ) {

            addLog(
                "Telemetry packet too short: " +
                text
            );

            return;
        }


        // -----------------------------------------------------
        // PARSE
        // -----------------------------------------------------

        const roll =
            parseFloat(parts[1]);

        const pitch =
            parseFloat(parts[2]);

        const gx =
            parseFloat(parts[3]);

        const gy =
            parseFloat(parts[4]);

        const gz =
            parseFloat(parts[5]);

        const m1 =
            parseInt(parts[6], 10);

        const m2 =
            parseInt(parts[7], 10);

        const m3 =
            parseInt(parts[8], 10);

        const m4 =
            parseInt(parts[9], 10);

        const rollP =
            parseFloat(parts[10]);

        const rollI =
            parseFloat(parts[11]);

        const rollD =
            parseFloat(parts[12]);

        const rollPID =
            parseFloat(parts[13]);

        const pitchP =
            parseFloat(parts[14]);

        const pitchI =
            parseFloat(parts[15]);

        const pitchD =
            parseFloat(parts[16]);

        const pitchPID =
            parseFloat(parts[17]);


        // -----------------------------------------------------
        // ATTITUDE
        // -----------------------------------------------------

        setText(
            "telemetryRoll",
            safeFixed(roll, 2)
        );

        setText(
            "telemetryPitch",
            safeFixed(pitch, 2)
        );


        // -----------------------------------------------------
        // GYRO
        // -----------------------------------------------------

        setText(
            "telemetryGyroX",
            safeFixed(gx, 1)
        );

        setText(
            "telemetryGyroY",
            safeFixed(gy, 1)
        );

        setText(
            "telemetryGyroZ",
            safeFixed(gz, 1)
        );


        // -----------------------------------------------------
        // MOTOR OUTPUT
        // -----------------------------------------------------

        setText(
            "telemetryM1",
            safeInteger(m1)
        );

        setText(
            "telemetryM2",
            safeInteger(m2)
        );

        setText(
            "telemetryM3",
            safeInteger(m3)
        );

        setText(
            "telemetryM4",
            safeInteger(m4)
        );


        setText(
            "motor1Display",
            safeInteger(m1) + " µs"
        );

        setText(
            "motor2Display",
            safeInteger(m2) + " µs"
        );

        setText(
            "motor3Display",
            safeInteger(m3) + " µs"
        );

        setText(
            "motor4Display",
            safeInteger(m4) + " µs"
        );


        // -----------------------------------------------------
        // ROLL PID
        // -----------------------------------------------------

        setText(
            "rollP",
            safeFixed(rollP, 2)
        );

        setText(
            "rollI",
            safeFixed(rollI, 2)
        );

        setText(
            "rollD",
            safeFixed(rollD, 2)
        );

        setText(
            "rollPID",
            safeFixed(rollPID, 2)
        );


        // -----------------------------------------------------
        // PITCH PID
        // -----------------------------------------------------

        setText(
            "pitchP",
            safeFixed(pitchP, 2)
        );

        setText(
            "pitchI",
            safeFixed(pitchI, 2)
        );

        setText(
            "pitchD",
            safeFixed(pitchD, 2)
        );

        setText(
            "pitchPID",
            safeFixed(pitchPID, 2)
        );


        // -----------------------------------------------------
        // SAVE DATA
        // -----------------------------------------------------

        window.latestTelemetry = {

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

        };

    }
    catch (error) {

        console.error(
            "Telemetry error:",
            error
        );

        addLog(
            "Telemetry parsing error: " +
            error.message
        );

    }

}


// =========================================================
// TEXT HELPERS
// =========================================================

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


function safeFixed(
    value,
    decimals
) {

    if (
        typeof value !== "number" ||
        !Number.isFinite(value)
    ) {

        return "0.00";

    }

    return value.toFixed(
        decimals
    );

}


function safeInteger(
    value
) {

    if (
        typeof value !== "number" ||
        !Number.isFinite(value)
    ) {

        return "900";

    }

    return String(
        Math.round(value)
    );

}


// =========================================================
// JOYSTICK SETUP
// =========================================================

function setupJoystick(
    joystickId,
    stickId,
    callback
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
            "Joystick not found:",
            joystickId
        );

        return;
    }


    let active =
        false;


    function moveStick(
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


        const stickRadius =
            stick.offsetWidth / 2;


        const maxX =
            rect.width / 2 -
            stickRadius;

        const maxY =
            rect.height / 2 -
            stickRadius;


        let dx =
            clientX -
            centerX;

        let dy =
            clientY -
            centerY;


        dx =
            Math.max(
                -maxX,
                Math.min(
                    maxX,
                    dx
                )
            );


        dy =
            Math.max(
                -maxY,
                Math.min(
                    maxY,
                    dy
                )
            );


        stick.style.left =
            `calc(50% + ${dx}px)`;

        stick.style.top =
            `calc(50% + ${dy}px)`;


        const x =
            Math.round(
                (dx / maxX) *
                100
            );

        const y =
            Math.round(
                (-dy / maxY) *
                100
            );


        callback(
            Math.max(
                -100,
                Math.min(
                    100,
                    x
                )
            ),

            Math.max(
                -100,
                Math.min(
                    100,
                    y
                )
            )
        );

    }


    function reset() {

        active =
            false;

        stick.style.left =
            "50%";

        stick.style.top =
            "50%";

        callback(
            0,
            0
        );

    }


    joystick.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            active =
                true;

            joystick.setPointerCapture(
                event.pointerId
            );

            moveStick(
                event.clientX,
                event.clientY
            );

        }
    );


    joystick.addEventListener(
        "pointermove",
        event => {

            if (!active) {
                return;
            }

            event.preventDefault();

            moveStick(
                event.clientX,
                event.clientY
            );

        }
    );


    joystick.addEventListener(
        "pointerup",
        event => {

            event.preventDefault();

            try {

                joystick.releasePointerCapture(
                    event.pointerId
                );

            }
            catch (_) {}


            reset();

        }
    );


    joystick.addEventListener(
        "pointercancel",
        reset
    );


    joystick.addEventListener(
        "lostpointercapture",
        reset
    );

}


// =========================================================
// JOYSTICK VALUES
// =========================================================

let throttle = 0;
let yaw = 0;

let pitch = 0;
let roll = 0;


// =========================================================
// LEFT JOYSTICK
//
// X = YAW
// Y = THROTTLE
// =========================================================

setupJoystick(
    "leftJoystick",
    "leftStick",
    (x, y) => {

        yaw =
            x;

        throttle =
            y;


        setText(
            "throttleValue",
            throttle
        );

        setText(
            "yawValue",
            yaw
        );

    }
);


// =========================================================
// RIGHT JOYSTICK
//
// X = ROLL
// Y = PITCH
// =========================================================

setupJoystick(
    "rightJoystick",
    "rightStick",
    (x, y) => {

        roll =
            x;

        pitch =
            y;


        setText(
            "pitchValue",
            pitch
        );

        setText(
            "rollValue",
            roll
        );

    }
);


// =========================================================
// JOYSTICK TRANSMISSION
// =========================================================

let lastJoystickSend =
    0;


setInterval(
    () => {

        const moving =
            throttle !== 0 ||
            yaw !== 0 ||
            pitch !== 0 ||
            roll !== 0;


        if (!moving) {
            return;
        }


        const now =
            Date.now();


        if (
            now -
            lastJoystickSend <
            80
        ) {

            return;
        }


        lastJoystickSend =
            now;


        sendCommand(
            `JOY,${throttle},${yaw},${pitch},${roll}`
        );

    },
    20
);


// =========================================================
// CLEAR LOGS
// =========================================================

const clearLogsBtn =
    document.getElementById(
        "clearLogsBtn"
    );


if (clearLogsBtn) {

    clearLogsBtn.addEventListener(
        "click",
        () => {

            logContainer.innerHTML = "";

            addLog(
                "Logs cleared"
            );

        }
    );

}


// =========================================================
// INITIAL STATE
// =========================================================

setConnectionStatus(
    false
);

addLog(
    "VAJRA website ready"
);

addLog(
    "Bluetooth disconnected"
);
