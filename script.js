// ============================================================
// ANSH'S DRONE VAJRA 🚁⚡
// CORRECT WEBSITE JAVASCRIPT
// ============================================================

// ============================================================
// LOGIN
// ============================================================

const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");

const username = document.getElementById("username");
const password = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");


// ============================================================
// LOGIN BUTTON
// ============================================================

if (loginButton) {
    loginButton.addEventListener("click", loginVAJRA);
}


// Enter key
if (password) {
    password.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            loginVAJRA();
        }

    });
}


// ============================================================
// LOGIN FUNCTION
// ============================================================

function loginVAJRA() {

    const user = username.value.trim();
    const pass = password.value;

    if (user === "VAJRA" && pass === "VAJRA") {

        loginError.textContent = "";

        loginPage.classList.add("hidden");
        dashboard.classList.remove("hidden");

        console.log("LOGIN SUCCESS");

    } else {

        loginError.textContent =
            "Invalid username or password.";

    }
}


// ============================================================
// BLE UUIDS
// MUST MATCH MAIN ESP32
// ============================================================

const SERVICE_UUID =
    "12345678-1234-1234-1234-1234567890ab";

const RX_UUID =
    "12345678-1234-1234-1234-1234567890ac";

const TX_UUID =
    "12345678-1234-1234-1234-1234567890ad";


// ============================================================
// BLE VARIABLES
// ============================================================

let bleDevice = null;
let bleServer = null;
let rxCharacteristic = null;
let txCharacteristic = null;

let connected = false;
let armed = false;


// ============================================================
// JOYSTICK VALUES
// ============================================================

let throttle = 0;
let yaw = 0;
let pitch = 0;
let roll = 0;

let joystickTimer = null;


// ============================================================
// PAGE ELEMENTS
// ============================================================

const connectButton =
    document.getElementById("connectButton");

const searchButton =
    document.getElementById("searchButton");

const armButton =
    document.getElementById("armButton");

const stopButton =
    document.getElementById("stopButton");


// ============================================================
// CONNECT BUTTON
// ============================================================

if (connectButton) {

    connectButton.addEventListener(
        "click",
        function () {

            if (connected) {
                disconnectVAJRA();
            } else {
                connectVAJRA();
            }

        }
    );

}


// ============================================================
// SEARCH BLUETOOTH BUTTON
// ============================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        function () {

            if (connected) {
                disconnectVAJRA();
            } else {
                connectVAJRA();
            }

        }
    );

}


// ============================================================
// CONNECT TO VAJRA
// ============================================================

async function connectVAJRA() {

    if (!navigator.bluetooth) {

        alert(
            "Web Bluetooth is not supported.\n\n" +
            "Use Google Chrome or Microsoft Edge."
        );

        return;
    }


    try {

        console.log(
            "Searching for ANSH'S DRONE VAJRA..."
        );


        // IMPORTANT:
        // No namePrefix filter.
        // This allows the exact ESP32 name to appear.

        bleDevice =
            await navigator.bluetooth.requestDevice({

                acceptAllDevices: true,

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        console.log(
            "Selected:",
            bleDevice.name
        );


        bleDevice.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );


        console.log(
            "Connecting..."
        );


        bleServer =
            await bleDevice.gatt.connect();


        console.log(
            "GATT connected"
        );


        // Get VAJRA service
        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        console.log(
            "Service found"
        );


        // Website -> ESP32
        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        console.log(
            "RX ready"
        );


        // ESP32 -> Website
        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        console.log(
            "TX ready"
        );


        // Notifications
        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            receiveFromVAJRA
        );


        connected = true;
        armed = false;


        updateConnectionUI();


        console.log(
            "VAJRA CONNECTED"
        );


        // IMPORTANT:
        // DO NOT SEND START / ARM / STOP HERE.

    }
    catch (error) {

        console.error(
            "BLE ERROR:",
            error
        );


        connected = false;


        updateConnectionUI();


        if (
            error.name !== "NotFoundError"
        ) {

            alert(
                "Bluetooth connection failed:\n\n" +
                error.message
            );

        }

    }

}


// ============================================================
// DISCONNECT
// ============================================================

async function disconnectVAJRA() {

    stopJoystickLoop();


    try {

        if (
            bleDevice &&
            bleDevice.gatt &&
            bleDevice.gatt.connected
        ) {

            bleDevice.gatt.disconnect();

        }

    }
    catch (error) {

        console.log(error);

    }


    bleDevice = null;
    bleServer = null;

    rxCharacteristic = null;
    txCharacteristic = null;

    connected = false;
    armed = false;


    updateConnectionUI();

}


// ============================================================
// HANDLE DISCONNECT
// ============================================================

function handleDisconnect() {

    stopJoystickLoop();

    bleServer = null;
    rxCharacteristic = null;
    txCharacteristic = null;

    connected = false;
    armed = false;


    updateConnectionUI();

}


// ============================================================
// CONNECTION UI
// ============================================================

function updateConnectionUI() {

    const connectionText =
        document.getElementById("connectionText");

    const connectionDot =
        document.getElementById("connectionDot");

    const largeConnectionText =
        document.getElementById("largeConnectionText");

    const largeConnectionDot =
        document.getElementById("largeConnectionDot");

    const deviceText =
        document.getElementById("deviceText");

    const remoteStatus =
        document.getElementById("remoteStatus");

    const telemetryBLE =
        document.getElementById("telemetryBLE");


    if (connected) {

        if (connectionText)
            connectionText.textContent =
                "CONNECTED";


        if (connectionDot)
            connectionDot.classList.add(
                "connected"
            );


        if (largeConnectionDot)
            largeConnectionDot.classList.add(
                "connected"
            );


        if (largeConnectionText)
            largeConnectionText.textContent =
                "DRONE CONNECTED";


        if (deviceText)
            deviceText.textContent =
                bleDevice?.name ||
                "ANSH'S DRONE VAJRA";


        if (connectButton)
            connectButton.textContent =
                "DISCONNECT";


        if (searchButton)
            searchButton.textContent =
                "DISCONNECT VAJRA";


        if (remoteStatus)
            remoteStatus.textContent =
                armed
                    ? "ARMED"
                    : "CONNECTED";


        if (telemetryBLE)
            telemetryBLE.textContent =
                "ONLINE";

    }
    else {

        if (connectionText)
            connectionText.textContent =
                "DISCONNECTED";


        if (connectionDot)
            connectionDot.classList.remove(
                "connected"
            );


        if (largeConnectionDot)
            largeConnectionDot.classList.remove(
                "connected"
            );


        if (largeConnectionText)
            largeConnectionText.textContent =
                "DRONE NOT CONNECTED";


        if (deviceText)
            deviceText.textContent =
                "No drone connected";


        if (connectButton)
            connectButton.textContent =
                "CONNECT";


        if (searchButton)
            searchButton.textContent =
                "SEARCH BLUETOOTH";


        if (remoteStatus)
            remoteStatus.textContent =
                "DISCONNECTED";


        if (telemetryBLE)
            telemetryBLE.textContent =
                "OFFLINE";

    }

}


// ============================================================
// SEND BLE COMMAND
// ============================================================

async function sendCommand(command) {

    if (!rxCharacteristic) {

        console.log(
            "VAJRA NOT CONNECTED:",
            command
        );

        return false;
    }


    try {

        const data =
            new TextEncoder().encode(
                command + "\n"
            );


        // Fast write
        if (
            typeof rxCharacteristic.writeValueWithoutResponse ===
            "function"
        ) {

            await rxCharacteristic.writeValueWithoutResponse(
                data
            );

        }
        else {

            await rxCharacteristic.writeValue(
                data
            );

        }


        console.log(
            "VAJRA TX:",
            command
        );


        return true;

    }
    catch (error) {

        console.error(
            "SEND ERROR:",
            error
        );

        return false;

    }

}


// ============================================================
// RECEIVE FROM ESP32
// ============================================================

function receiveFromVAJRA(event) {

    const message =
        new TextDecoder().decode(
            event.target.value
        ).trim();


    if (!message)
        return;


    console.log(
        "VAJRA RX:",
        message
    );

}


// ============================================================
// ARM
// ============================================================

if (armButton) {

    armButton.addEventListener(
        "click",
        async function () {

            if (!connected) {

                alert(
                    "Connect VAJRA first."
                );

                return;
            }


            if (!armed) {

                await sendCommand(
                    "ARM"
                );


                armed = true;


                armButton.textContent =
                    "ARMED";


                armButton.classList.add(
                    "armed"
                );


                const remoteStatus =
                    document.getElementById(
                        "remoteStatus"
                    );


                if (remoteStatus) {

                    remoteStatus.textContent =
                        "ARMED";

                }


                startJoystickLoop();

            }
            else {

                await stopMotors();

            }

        }
    );

}


// ============================================================
// STOP
// ============================================================

if (stopButton) {

    stopButton.addEventListener(
        "click",
        stopMotors
    );

}


async function stopMotors() {

    armed = false;

    stopJoystickLoop();


    if (connected) {

        await sendCommand(
            "STOP"
        );

    }


    if (armButton) {

        armButton.textContent =
            "ARM";

        armButton.classList.remove(
            "armed"
        );

    }


    console.log(
        "STOP SENT"
    );

}


// ============================================================
// M1-M4 START BUTTONS
// ============================================================

document
    .querySelectorAll(".motor-start")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            async function () {

                const motor =
                    button.dataset.motor;

                if (!motor)
                    return;


                if (!connected) {

                    alert(
                        "Connect VAJRA first."
                    );

                    return;
                }


                // DIRECT COMMAND
                await sendCommand(
                    motor + " START"
                );


                const number =
                    motor.replace(
                        "M",
                        ""
                    );


                const speed =
                    document.getElementById(
                        "m" +
                        number +
                        "Speed"
                    );

                const status =
                    document.getElementById(
                        "m" +
                        number +
                        "Status"
                    );


                if (speed)
                    speed.textContent =
                        "2000 µs";


                if (status)
                    status.textContent =
                        "ON";

            }
        );

    });


// ============================================================
// M1-M4 STOP BUTTONS
// ============================================================

document
    .querySelectorAll(".motor-stop")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            async function () {

                const motor =
                    button.dataset.motor;

                if (!motor)
                    return;


                if (!connected) {

                    alert(
                        "Connect VAJRA first."
                    );

                    return;
                }


                await sendCommand(
                    motor + " STOP"
                );


                const number =
                    motor.replace(
                        "M",
                        ""
                    );


                const speed =
                    document.getElementById(
                        "m" +
                        number +
                        "Speed"
                    );

                const status =
                    document.getElementById(
                        "m" +
                        number +
                        "Status"
                    );


                if (speed)
                    speed.textContent =
                        "1000 µs";


                if (status)
                    status.textContent =
                        "OFF";

            }
        );

    });


// ============================================================
// JOYSTICK SETUP
// ============================================================

function setupJoystick(
    area,
    stick,
    callback
) {

    if (!area || !stick)
        return;


    let active = false;
    let pointerId = null;


    area.style.touchAction =
        "none";


    area.addEventListener(
        "pointerdown",
        function (event) {

            active = true;

            pointerId =
                event.pointerId;


            area.setPointerCapture(
                event.pointerId
            );


            move(event);

        }
    );


    area.addEventListener(
        "pointermove",
        function (event) {

            if (!active)
                return;


            if (
                event.pointerId !==
                pointerId
            )
                return;


            move(event);

        }
    );


    area.addEventListener(
        "pointerup",
        release
    );


    area.addEventListener(
        "pointercancel",
        release
    );


    function move(event) {

        const rect =
            area.getBoundingClientRect();


        let x =
            event.clientX -
            (
                rect.left +
                rect.width / 2
            );


        let y =
            event.clientY -
            (
                rect.top +
                rect.height / 2
            );


        const radius =
            Math.min(
                rect.width,
                rect.height
            ) / 2 - 35;


        const distance =
            Math.sqrt(
                x * x +
                y * y
            );


        if (
            distance > radius
        ) {

            const scale =
                radius / distance;

            x *= scale;
            y *= scale;

        }


        const nx =
            x / radius;


        const ny =
            y / radius;


        stick.style.transform =
            "translate(calc(-50% + " +
            x +
            "px), calc(-50% + " +
            y +
            "px))";


        callback(
            nx,
            ny
        );

    }


    function release() {

        active = false;
        pointerId = null;


        stick.style.transform =
            "translate(-50%, -50%)";


        callback(
            0,
            0
        );

    }

}


// ============================================================
// LEFT JOYSTICK
// THROTTLE + YAW
// ============================================================

const leftJoystick =
    document.getElementById(
        "leftJoystick"
    );

const leftStick =
    document.getElementById(
        "leftStick"
    );


setupJoystick(
    leftJoystick,
    leftStick,
    function (x, y) {

        throttle =
            Math.round(
                ((-y + 1) / 2) *
                100
            );


        yaw =
            Math.round(
                x * 100
            );


        updateJoystickValues();

    }
);


// ============================================================
// RIGHT JOYSTICK
// PITCH + ROLL
// ============================================================

const rightJoystick =
    document.getElementById(
        "rightJoystick"
    );

const rightStick =
    document.getElementById(
        "rightStick"
    );


setupJoystick(
    rightJoystick,
    rightStick,
    function (x, y) {

        roll =
            Math.round(
                x * 100
            );


        pitch =
            Math.round(
                -y * 100
            );


        updateJoystickValues();

    }
);


// ============================================================
// JOYSTICK VALUES
// ============================================================

function updateJoystickValues() {

    const t =
        document.getElementById(
            "throttleValue"
        );

    const y =
        document.getElementById(
            "yawValue"
        );

    const p =
        document.getElementById(
            "pitchValue"
        );

    const r =
        document.getElementById(
            "rollValue"
        );


    if (t)
        t.textContent =
            throttle;


    if (y)
        y.textContent =
            yaw;


    if (p)
        p.textContent =
            pitch;


    if (r)
        r.textContent =
            roll;

}


// ============================================================
// JOYSTICK LOOP
// ============================================================

function startJoystickLoop() {

    if (joystickTimer !== null)
        return;


    joystickTimer =
        setInterval(
            function () {

                if (
                    connected &&
                    armed
                ) {

                    const command =
                        "JOY," +
                        throttle +
                        "," +
                        yaw +
                        "," +
                        pitch +
                        "," +
                        roll;


                    sendCommand(
                        command
                    );

                }

            },
            20
        );

}


// ============================================================
// STOP JOYSTICK LOOP
// ============================================================

function stopJoystickLoop() {

    if (joystickTimer !== null) {

        clearInterval(
            joystickTimer
        );

        joystickTimer = null;

    }

}


// ============================================================
// INITIAL STATE
// ============================================================

connected = false;
armed = false;

updateConnectionUI();

updateJoystickValues();
