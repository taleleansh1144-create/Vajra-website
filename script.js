/* =========================================================
   ANSH'S DRONE VAJRA 🚁⚡
   JAVASCRIPT
========================================================= */

// ==========================================================
// LOGIN
// ==========================================================

const VALID_USERNAME = "VAJRA";
const VALID_PASSWORD = "VAJRA";

const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");


// ==========================================================
// BLE UUIDs
// ==========================================================

const SERVICE_UUID =
    "12345678-1234-1234-1234-1234567890ab";

const RX_UUID =
    "12345678-1234-1234-1234-1234567890ac";

const TX_UUID =
    "12345678-1234-1234-1234-1234567890ad";

const VAJRA_DEVICE_NAME =
    "ANSH'S DRONE VAJRA";


// ==========================================================
// BLE VARIABLES
// ==========================================================

let vajraDevice = null;
let vajraServer = null;
let vajraService = null;

let vajraRx = null;
let vajraTx = null;

let bluetoothConnected = false;


// ==========================================================
// BLE WRITE QUEUE
// Prevents "GATT operation already in progress"
// ==========================================================

let writeQueue = Promise.resolve();


// ==========================================================
// LOGGING
// ==========================================================

const logContainer =
    document.getElementById("logContainer");


function addLog(message) {

    if (!logContainer) {
        return;
    }

    const entry =
        document.createElement("div");

    entry.className = "log-entry";

    const time =
        new Date().toLocaleTimeString();

    entry.textContent =
        `[${time}] ${message}`;

    logContainer.appendChild(entry);

    logContainer.scrollTop =
        logContainer.scrollHeight;

    console.log(message);
}


// ==========================================================
// LOGIN
// ==========================================================

loginBtn.addEventListener("click", login);


passwordInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        login();
    }

});


usernameInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        passwordInput.focus();
    }

});


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

        addLog("Login successful");

    } else {

        loginMessage.textContent =
            "Invalid username or password.";

    }

}


// ==========================================================
// PAGE NAVIGATION
// ==========================================================

const navButtons =
    document.querySelectorAll(".nav-btn");

const appPages =
    document.querySelectorAll(".app-page");


navButtons.forEach(button => {

    button.addEventListener("click", () => {

        const pageId =
            button.dataset.page;

        navButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        appPages.forEach(page => {
            page.classList.remove("active-page");
        });

        button.classList.add("active");

        const selectedPage =
            document.getElementById(pageId);

        if (selectedPage) {
            selectedPage.classList.add("active-page");
        }

    });

});


// ==========================================================
// CONNECTION UI
// ==========================================================

const bluetoothBtn =
    document.getElementById("bluetoothBtn");

const settingsBluetoothBtn =
    document.getElementById("settingsBluetoothBtn");

const connectionIndicator =
    document.getElementById("connectionIndicator");

const connectionText =
    document.getElementById("connectionText");


function setConnectionStatus(connected) {

    bluetoothConnected = connected;

    if (connected) {

        connectionIndicator.classList.remove(
            "disconnected"
        );

        connectionIndicator.classList.add(
            "connected"
        );

        connectionText.textContent =
            "CONNECTED";

        bluetoothBtn.textContent =
            "DISCONNECT BLUETOOTH";

    } else {

        connectionIndicator.classList.remove(
            "connected"
        );

        connectionIndicator.classList.add(
            "disconnected"
        );

        connectionText.textContent =
            "DISCONNECTED";

        bluetoothBtn.textContent =
            "CONNECT BLUETOOTH";
    }
}


// ==========================================================
// CONNECT BUTTONS
// ==========================================================

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


// ==========================================================
// CONNECT TO VAJRA
// ==========================================================

async function connectVAJRA() {

    try {

        if (!navigator.bluetooth) {

            addLog(
                "ERROR: Web Bluetooth is not supported by this browser."
            );

            alert(
                "Web Bluetooth is not supported here. Use Chrome or Edge on HTTPS."
            );

            return;
        }


        addLog(
            "Searching for " +
            VAJRA_DEVICE_NAME +
            "..."
        );


        // ==================================================
        // DEVICE SELECTION
        // ==================================================

        vajraDevice =
            await navigator.bluetooth.requestDevice({

                filters: [
                    {
                        name: VAJRA_DEVICE_NAME
                    }
                ],

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        if (!vajraDevice) {

            addLog(
                "No Bluetooth device selected."
            );

            return;
        }


        addLog(
            "Selected: " +
            (vajraDevice.name || "Unknown")
        );


        vajraDevice.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );


        // ==================================================
        // CONNECT GATT
        // ==================================================

        addLog("Connecting...");

        vajraServer =
            await vajraDevice.gatt.connect();

        addLog("GATT connected");


        // ==================================================
        // SERVICE
        // ==================================================

        vajraService =
            await vajraServer.getPrimaryService(
                SERVICE_UUID
            );

        addLog("Service found");


        // ==================================================
        // RX
        // ==================================================

        vajraRx =
            await vajraService.getCharacteristic(
                RX_UUID
            );

        addLog("RX ready");


        // ==================================================
        // TX
        // ==================================================

        vajraTx =
            await vajraService.getCharacteristic(
                TX_UUID
            );

        addLog("TX ready");


        // ==================================================
        // ENABLE NOTIFICATIONS
        // ==================================================

        await vajraTx.startNotifications();

        vajraTx.addEventListener(
            "characteristicvaluechanged",
            handleTelemetry
        );


        setConnectionStatus(true);

        addLog("VAJRA CONNECTED");

    }
    catch (error) {

        console.error(error);

        addLog(
            "BLE ERROR: " +
            error.message
        );

        setConnectionStatus(false);
    }

}


// ==========================================================
// DISCONNECT
// ==========================================================

function disconnectVAJRA() {

    try {

        if (
            vajraTx &&
            typeof vajraTx.removeEventListener ===
            "function"
        ) {

            vajraTx.removeEventListener(
                "characteristicvaluechanged",
                handleTelemetry
            );
        }


        if (
            vajraDevice &&
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

    setConnectionStatus(false);

    addLog("VAJRA disconnected");
}


// ==========================================================
// GATT DISCONNECTED
// ==========================================================

function handleDisconnect() {

    setConnectionStatus(false);

    addLog(
        "Bluetooth connection lost."
    );
}


// ==========================================================
// SAFE BLE WRITE
// ==========================================================

function sendCommand(command) {

    if (!vajraRx) {

        addLog(
            "Command blocked: Bluetooth not connected."
        );

        return;
    }


    const finalCommand =
        `VAJRA:${command}\n`;


    writeQueue =
        writeQueue
            .then(async () => {

                const encoder =
                    new TextEncoder();

                const data =
                    encoder.encode(
                        finalCommand
                    );


                await vajraRx.writeValueWithResponse(
                    data
                );


                addLog(
                    "BLE TX: " +
                    finalCommand.trim()
                );

            })
            .catch(error => {

                addLog(
                    "BLE WRITE ERROR: " +
                    error.message
                );

            });
}


// ==========================================================
// START / STOP
// ==========================================================

document
    .getElementById("startBtn")
    .addEventListener(
        "click",
        () => {

            sendCommand("START");

        }
    );


document
    .getElementById("stopBtn")
    .addEventListener(
        "click",
        () => {

            sendCommand("STOP");

        }
    );


// ==========================================================
// INDIVIDUAL MOTOR BUTTONS
// ==========================================================

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


// ==========================================================
// TELEMETRY
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
// ==========================================================

function handleTelemetry(event) {

    try {

        const value =
            event.target.value;


        const decoder =
            new TextDecoder();

        const text =
            decoder.decode(value).trim();


        if (!text.startsWith("TEL,")) {

            return;
        }


        const parts =
            text.split(",");


        if (parts.length < 18) {

            addLog(
                "Invalid telemetry packet: " +
                text
            );

            return;
        }


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
            parseInt(parts[6]);

        const m2 =
            parseInt(parts[7]);

        const m3 =
            parseInt(parts[8]);

        const m4 =
            parseInt(parts[9]);

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


        // ==================================================
        // ATTITUDE
        // ==================================================

        setText(
            "telemetryRoll",
            formatNumber(roll, 2)
        );

        setText(
            "telemetryPitch",
            formatNumber(pitch, 2)
        );


        // ==================================================
        // GYRO
        // ==================================================

        setText(
            "telemetryGyroX",
            formatNumber(gx, 1)
        );

        setText(
            "telemetryGyroY",
            formatNumber(gy, 1)
        );

        setText(
            "telemetryGyroZ",
            formatNumber(gz, 1)
        );


        // ==================================================
        // MOTORS
        // ==================================================

        setText(
            "telemetryM1",
            Number.isFinite(m1) ? m1 : 900
        );

        setText(
            "telemetryM2",
            Number.isFinite(m2) ? m2 : 900
        );

        setText(
            "telemetryM3",
            Number.isFinite(m3) ? m3 : 900
        );

        setText(
            "telemetryM4",
            Number.isFinite(m4) ? m4 : 900
        );


        setText(
            "motor1Display",
            `${m1} µs`
        );

        setText(
            "motor2Display",
            `${m2} µs`
        );

        setText(
            "motor3Display",
            `${m3} µs`
        );

        setText(
            "motor4Display",
            `${m4} µs`
        );


        // ==================================================
        // ROLL PID
        // ==================================================

        setText(
            "rollP",
            formatNumber(rollP, 2)
        );

        setText(
            "rollI",
            formatNumber(rollI, 2)
        );

        setText(
            "rollD",
            formatNumber(rollD, 2)
        );

        setText(
            "rollPID",
            formatNumber(rollPID, 2)
        );


        // ==================================================
        // PITCH PID
        // ==================================================

        setText(
            "pitchP",
            formatNumber(pitchP, 2)
        );

        setText(
            "pitchI",
            formatNumber(pitchI, 2)
        );

        setText(
            "pitchD",
            formatNumber(pitchD, 2)
        );

        setText(
            "pitchPID",
            formatNumber(pitchPID, 2)
        );


        // Save most recent telemetry
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

        addLog(
            "Telemetry parsing error: " +
            error.message
        );

    }

}


// ==========================================================
// SET TEXT HELPER
// ==========================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function formatNumber(
    value,
    decimals
) {

    if (!Number.isFinite(value)) {
        return "0.00";
    }

    return value.toFixed(decimals);
}


// ==========================================================
// LEFT JOYSTICK
//
// X = YAW
// Y = THROTTLE
// ==========================================================

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


    if (!joystick || !stick) {
        return;
    }


    let active = false;


    function update(
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


        const maxX =
            rect.width / 2 -
            stick.offsetWidth / 2;

        const maxY =
            rect.height / 2 -
            stick.offsetHeight / 2;


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
                (dx / maxX) * 100
            );

        const y =
            Math.round(
                (-dy / maxY) * 100
            );


        callback(
            Math.max(-100, Math.min(100, x)),
            Math.max(-100, Math.min(100, y))
        );

    }


    function reset() {

        active = false;

        stick.style.left =
            "50%";

        stick.style.top =
            "50%";

        callback(0, 0);

    }


    joystick.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            active = true;

            joystick.setPointerCapture(
                event.pointerId
            );

            update(
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

            update(
                event.clientX,
                event.clientY
            );

        }
    );


    joystick.addEventListener(
        "pointerup",
        event => {

            if (!active) {
                return;
            }

            try {
                joystick.releasePointerCapture(
                    event.pointerId
                );
            } catch (_) {}

            reset();
        }
    );


    joystick.addEventListener(
        "pointercancel",
        reset
    );


    joystick.addEventListener(
        "lostpointercapture",
        () => {

            if (active) {
                reset();
            }

        }
    );

}


// ==========================================================
// LEFT JOYSTICK
// X = YAW
// Y = THROTTLE
// ==========================================================

let throttle = 0;
let yaw = 0;

setupJoystick(
    "leftJoystick",
    "leftStick",
    (x, y) => {

        yaw = x;
        throttle = y;

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


// ==========================================================
// RIGHT JOYSTICK
// X = ROLL
// Y = PITCH
// ==========================================================

let pitch = 0;
let roll = 0;

setupJoystick(
    "rightJoystick",
    "rightStick",
    (x, y) => {

        roll = x;
        pitch = y;

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


// ==========================================================
// SEND JOYSTICK DATA
//
// Sends every 80 ms while a joystick is moved.
// ==========================================================

let joystickMoving = false;

let lastJoystickSend = 0;


setInterval(
    () => {

        const moving =
            throttle !== 0 ||
            yaw !== 0 ||
            pitch !== 0 ||
            roll !== 0;


        if (!moving) {
            joystickMoving = false;
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


        joystickMoving = true;


        sendCommand(
            `JOY,${throttle},${yaw},${pitch},${roll}`
        );

    },
    20
);


// ==========================================================
// CLEAR LOGS
// ==========================================================

document
    .getElementById("clearLogsBtn")
    .addEventListener(
        "click",
        () => {

            logContainer.innerHTML = "";

            addLog(
                "Logs cleared"
            );

        }
    );


// ==========================================================
// INITIAL STATUS
// ==========================================================

setConnectionStatus(false);

addLog(
    "VAJRA website initialized"
);

addLog(
    "Bluetooth is disconnected"
);
