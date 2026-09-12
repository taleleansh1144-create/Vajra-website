// ============================================================
// ANSH'S DRONE VAJRA 🚁⚡
// COMPLETE SCRIPT.JS
// ============================================================

// ============================================================
// BLE UUIDS
// MUST MATCH MAIN ESP32-C3
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

let lastJoystickSend = 0;


// ============================================================
// HTML ELEMENTS
// ============================================================

const loginPage =
    document.getElementById("loginPage");

const dashboard =
    document.getElementById("dashboard");

const username =
    document.getElementById("username");

const password =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const loginError =
    document.getElementById("loginError");

const connectButton =
    document.getElementById("connectButton");

const searchButton =
    document.getElementById("searchButton");

const logoutButton =
    document.getElementById("logoutButton");

const armButton =
    document.getElementById("armButton");

const stopButton =
    document.getElementById("stopButton");

const emergencyButton =
    document.getElementById("emergencyButton");


// ============================================================
// LOG SYSTEM
// ============================================================

function addLog(message) {

    console.log("[VAJRA]", message);

    const logs =
        document.getElementById("logs");

    if (!logs) {
        return;
    }

    const entry =
        document.createElement("div");

    entry.className =
        "log-entry";

    entry.textContent =
        new Date().toLocaleTimeString() +
        "  " +
        message;

    logs.prepend(entry);
}


// ============================================================
// LOGIN
// ============================================================

if (loginButton) {

    loginButton.addEventListener(
        "click",
        loginVAJRA
    );

}


if (password) {

    password.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                loginVAJRA();

            }

        }
    );

}


function loginVAJRA() {

    const user =
        username.value.trim();

    const pass =
        password.value;


    if (
        user === "VAJRA" &&
        pass === "VAJRA"
    ) {

        loginError.textContent = "";

        loginPage.classList.add(
            "hidden"
        );

        dashboard.classList.remove(
            "hidden"
        );

        addLog(
            "Login successful."
        );

    }
    else {

        loginError.textContent =
            "Wrong username or password.";

    }

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            await stopMotors();

            await disconnectVAJRA();

            dashboard.classList.add(
                "hidden"
            );

            loginPage.classList.remove(
                "hidden"
            );

            username.value = "";
            password.value = "";

        }
    );

}


// ============================================================
// NAVIGATION
// ============================================================

document
    .querySelectorAll(".nav-button")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                document
                    .querySelectorAll(".nav-button")
                    .forEach(function(btn) {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(".page")
                    .forEach(function(page) {

                        page.classList.remove(
                            "active"
                        );

                    });


                const page =
                    document.getElementById(
                        button.dataset.page
                    );


                if (page) {

                    page.classList.add(
                        "active"
                    );

                }

            }
        );

    });


// ============================================================
// CONNECT BUTTON
// ============================================================

if (connectButton) {

    connectButton.addEventListener(
        "click",
        async function() {

            if (connected) {

                await disconnectVAJRA();

            }
            else {

                await connectVAJRA();

            }

        }
    );

}


// ============================================================
// SEARCH BUTTON
// ============================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        async function() {

            if (connected) {

                await disconnectVAJRA();

            }
            else {

                await connectVAJRA();

            }

        }
    );

}


// ============================================================
// CONNECT BLUETOOTH
// ============================================================

async function connectVAJRA() {

    if (!navigator.bluetooth) {

        alert(
            "Web Bluetooth is not supported.\n\n" +
            "Please use Google Chrome or Microsoft Edge."
        );

        return;

    }


    try {

        addLog(
            "Opening Bluetooth chooser..."
        );


        bleDevice =
            await navigator.bluetooth.requestDevice({

                acceptAllDevices: true,

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        addLog(
            "Selected: " +
            (
                bleDevice.name ||
                "Unknown device"
            )
        );


        bleDevice.addEventListener(
            "gattserverdisconnected",
            bluetoothDisconnected
        );


        addLog(
            "Connecting to GATT..."
        );


        bleServer =
            await bleDevice.gatt.connect();


        addLog(
            "GATT connected."
        );


        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        addLog(
            "VAJRA service found."
        );


        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        addLog(
            "RX channel ready."
        );


        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        addLog(
            "TX channel ready."
        );


        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            receiveFromDrone
        );


        connected = true;


        updateConnectionUI();


        addLog(
            "VAJRA CONNECTED"
        );


        // Safety stop immediately after connection
        await sendCommand(
            "STOP"
        );

    }
    catch(error) {

        console.error(
            "BLE ERROR:",
            error
        );


        connected = false;


        updateConnectionUI();


        addLog(
            "BLE ERROR: " +
            error.name +
            " - " +
            error.message
        );


        if (
            error.name !==
            "NotFoundError"
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

    try {

        if (
            rxCharacteristic &&
            connected
        ) {

            await sendCommand(
                "STOP"
            );

        }

    }
    catch(error) {

        console.log(error);

    }


    try {

        if (
            bleDevice &&
            bleDevice.gatt &&
            bleDevice.gatt.connected
        ) {

            bleDevice.gatt.disconnect();

        }

    }
    catch(error) {

        console.log(error);

    }


    bleDevice = null;
    bleServer = null;
    rxCharacteristic = null;
    txCharacteristic = null;

    connected = false;
    armed = false;


    updateConnectionUI();

    resetArmButton();

    resetMotorDisplays();


    addLog(
        "VAJRA disconnected."
    );

}


// ============================================================
// DISCONNECTED EVENT
// ============================================================

function bluetoothDisconnected() {

    bleServer = null;
    rxCharacteristic = null;
    txCharacteristic = null;

    connected = false;
    armed = false;


    updateConnectionUI();

    resetArmButton();

    resetMotorDisplays();


    addLog(
        "Bluetooth connection lost."
    );

}


// ============================================================
// CONNECTION UI
// ============================================================

function updateConnectionUI() {

    const connectionText =
        document.getElementById(
            "connectionText"
        );

    const connectionDot =
        document.getElementById(
            "connectionDot"
        );

    const largeConnectionDot =
        document.getElementById(
            "largeConnectionDot"
        );

    const largeConnectionText =
        document.getElementById(
            "largeConnectionText"
        );

    const deviceText =
        document.getElementById(
            "deviceText"
        );

    const remoteStatus =
        document.getElementById(
            "remoteStatus"
        );

    const telemetryBLE =
        document.getElementById(
            "telemetryBLE"
        );


    if (connected) {

        if (connectionText) {

            connectionText.textContent =
                "CONNECTED";

        }


        if (connectionDot) {

            connectionDot.classList.add(
                "connected"
            );

        }


        if (largeConnectionDot) {

            largeConnectionDot.classList.add(
                "connected"
            );

        }


        if (largeConnectionText) {

            largeConnectionText.textContent =
                "DRONE CONNECTED";

        }


        if (deviceText) {

            deviceText.textContent =
                bleDevice.name ||
                "ANSH'S DRONE VAJRA";

        }


        if (connectButton) {

            connectButton.textContent =
                "DISCONNECT";

        }


        if (searchButton) {

            searchButton.textContent =
                "DISCONNECT VAJRA";

        }


        if (remoteStatus) {

            remoteStatus.textContent =
                armed
                    ? "ARMED"
                    : "CONNECTED";

        }


        if (telemetryBLE) {

            telemetryBLE.textContent =
                "ONLINE";

        }

    }
    else {

        if (connectionText) {

            connectionText.textContent =
                "DISCONNECTED";

        }


        if (connectionDot) {

            connectionDot.classList.remove(
                "connected"
            );

        }


        if (largeConnectionDot) {

            largeConnectionDot.classList.remove(
                "connected"
            );

        }


        if (largeConnectionText) {

            largeConnectionText.textContent =
                "DRONE NOT CONNECTED";

        }


        if (deviceText) {

            deviceText.textContent =
                "Press SEARCH FOR BLUETOOTH";

        }


        if (connectButton) {

            connectButton.textContent =
                "CONNECT";

        }


        if (searchButton) {

            searchButton.textContent =
                "SEARCH BLUETOOTH";

        }


        if (remoteStatus) {

            remoteStatus.textContent =
                "DISCONNECTED";

        }


        if (telemetryBLE) {

            telemetryBLE.textContent =
                "OFFLINE";

        }

    }

}


// ============================================================
// SEND BLE COMMAND
// ============================================================

async function sendCommand(
    command
) {

    if (!rxCharacteristic) {

        addLog(
            "NOT CONNECTED: " +
            command
        );

        return false;

    }


    try {

        const data =
            new TextEncoder().encode(
                command + "\n"
            );


        if (
            typeof rxCharacteristic
                .writeValueWithResponse ===
            "function"
        ) {

            await rxCharacteristic
                .writeValueWithResponse(
                    data
                );

        }
        else {

            await rxCharacteristic
                .writeValue(
                    data
                );

        }


        console.log(
            "VAJRA TX:",
            command
        );


        addLog(
            "TX: " +
            command
        );


        return true;

    }
    catch(error) {

        console.error(
            "TX ERROR:",
            error
        );


        addLog(
            "TX ERROR: " +
            error.message
        );


        return false;

    }

}


// ============================================================
// RECEIVE FROM DRONE
// ============================================================

function receiveFromDrone(
    event
) {

    const message =
        new TextDecoder().decode(
            event.target.value
        ).trim();


    if (!message) {

        return;

    }


    console.log(
        "VAJRA RX:",
        message
    );


    addLog(
        "RX: " +
        message
    );

}


// ============================================================
// START ALL MOTORS
// ============================================================

async function startAllMotors() {

    if (!connected) {

        alert(
            "Connect VAJRA first."
        );

        return;

    }


    const success =
        await sendCommand(
            "START"
        );


    if (!success) {

        return;

    }


    armed = true;


    updateArmButton();


    addLog(
        "ALL MOTORS -> 2000us"
    );

}


// ============================================================
// STOP ALL MOTORS
// ============================================================

async function stopMotors() {

    armed = false;


    if (rxCharacteristic) {

        await sendCommand(
            "STOP"
        );

    }


    resetArmButton();

    resetMotorDisplays();


    addLog(
        "ALL MOTORS -> 900us"
    );

}


// ============================================================
// ARM BUTTON
// ============================================================

if (armButton) {

    armButton.addEventListener(
        "click",
        async function() {

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


                updateArmButton();


                addLog(
                    "VAJRA ARMED"
                );

            }
            else {

                await stopMotors();

            }

        }
    );

}


// ============================================================
// STOP BUTTON
// ============================================================

if (stopButton) {

    stopButton.addEventListener(
        "click",
        stopMotors
    );

}


// ============================================================
// EMERGENCY STOP
// ============================================================

if (emergencyButton) {

    emergencyButton.addEventListener(
        "click",
        async function() {

            armed = false;


            await sendCommand(
                "EMERGENCY"
            );


            resetArmButton();

            resetMotorDisplays();


            addLog(
                "EMERGENCY STOP -> 900us"
            );

        }
    );

}


// ============================================================
// ARM UI
// ============================================================

function updateArmButton() {

    if (!armButton) {

        return;

    }


    if (armed) {

        armButton.textContent =
            "ARMED";

        armButton.classList.add(
            "armed"
        );

    }
    else {

        armButton.textContent =
            "ARM";

        armButton.classList.remove(
            "armed"
        );

    }

}


function resetArmButton() {

    armed = false;


    if (armButton) {

        armButton.textContent =
            "ARM";

        armButton.classList.remove(
            "armed"
        );

    }

}


// ============================================================
// MOTOR START BUTTONS
// ============================================================

document
    .querySelectorAll(".motor-start")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                const motor =
                    button.dataset.motor;

                if (motor) {

                    startMotor(
                        motor
                    );

                }

            }
        );

    });


// ============================================================
// MOTOR STOP BUTTONS
// ============================================================

document
    .querySelectorAll(".motor-stop")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                const motor =
                    button.dataset.motor;

                if (motor) {

                    stopMotor(
                        motor
                    );

                }

            }
        );

    });


// ============================================================
// START INDIVIDUAL MOTOR
// ============================================================

async function startMotor(
    motor
) {

    if (!connected) {

        alert(
            "Connect VAJRA first."
        );

        return;

    }


    const success =
        await sendCommand(
            motor + " START"
        );


    if (!success) {

        return;

    }


    const number =
        motor.replace(
            "M",
            ""
        );


    updateMotor(
        number,
        2000,
        true
    );


    addLog(
        motor +
        " START -> 2000us"
    );

}


// ============================================================
// STOP INDIVIDUAL MOTOR
// ============================================================

async function stopMotor(
    motor
) {

    if (!connected) {

        alert(
            "Connect VAJRA first."
        );

        return;

    }


    const success =
        await sendCommand(
            motor + " STOP"
        );


    if (!success) {

        return;

    }


    const number =
        motor.replace(
            "M",
            ""
        );


    updateMotor(
        number,
        900,
        false
    );


    addLog(
        motor +
        " STOP -> 900us"
    );

}


// ============================================================
// MOTOR DISPLAY
// ============================================================

function updateMotor(
    number,
    speed,
    running
) {

    const status =
        document.getElementById(
            "m" +
            number +
            "Status"
        );

    const speedElement =
        document.getElementById(
            "m" +
            number +
            "Speed"
        );


    if (status) {

        status.textContent =
            running
                ? "ON"
                : "OFF";

    }


    if (speedElement) {

        speedElement.textContent =
            speed +
            " µs";

    }

}


function resetMotorDisplays() {

    for (
        let i = 1;
        i <= 4;
        i++
    ) {

        updateMotor(
            i,
            900,
            false
        );

    }

}


// ============================================================
// JOYSTICK CLASS
// ============================================================

class VAJRAJoystick {

    constructor(
        area,
        stick,
        callback
    ) {

        this.area =
            area;

        this.stick =
            stick;

        this.callback =
            callback;

        this.active =
            false;

        this.pointerId =
            null;


        area.addEventListener(
            "pointerdown",
            (event) => {

                this.active =
                    true;

                this.pointerId =
                    event.pointerId;


                area.setPointerCapture(
                    event.pointerId
                );


                this.move(
                    event
                );

            }
        );


        area.addEventListener(
            "pointermove",
            (event) => {

                if (
                    !this.active ||
                    event.pointerId !==
                    this.pointerId
                ) {

                    return;

                }


                this.move(
                    event
                );

            }
        );


        area.addEventListener(
            "pointerup",
            () => {

                this.release();

            }
        );


        area.addEventListener(
            "pointercancel",
            () => {

                this.release();

            }
        );

    }


    move(event) {

        const rect =
            this.area.getBoundingClientRect();


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
                radius /
                distance;


            x *= scale;
            y *= scale;

        }


        const normalizedX =
            x / radius;


        const normalizedY =
            y / radius;


        this.stick.style.transform =
            "translate(calc(-50% + " +
            x +
            "px), calc(-50% + " +
            y +
            "px))";


        this.callback(
            normalizedX,
            normalizedY
        );

    }


    release() {

        this.active =
            false;

        this.pointerId =
            null;


        this.stick.style.transform =
            "translate(-50%, -50%)";


        this.callback(
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


if (
    leftJoystick &&
    leftStick
) {

    new VAJRAJoystick(
        leftJoystick,
        leftStick,

        function(x, y) {

            // Up = throttle 0..100
            throttle =
                Math.round(
                    ((-y + 1) / 2) *
                    100
                );


            // Left/right = yaw
            yaw =
                Math.round(
                    x * 100
                );


            updateJoystickDisplay();

            sendJoystick();

        }
    );

}


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


if (
    rightJoystick &&
    rightStick
) {

    new VAJRAJoystick(
        rightJoystick,
        rightStick,

        function(x, y) {

            // Left/right = roll
            roll =
                Math.round(
                    x * 100
                );


            // Up/down = pitch
            pitch =
                Math.round(
                    -y * 100
                );


            updateJoystickDisplay();

            sendJoystick();

        }
    );

}


// ============================================================
// JOYSTICK DISPLAY
// ============================================================

function updateJoystickDisplay() {

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


// ============================================================
// SEND JOYSTICK COMMAND
//
// FORMAT:
//
// JOY,THROTTLE,YAW,PITCH,ROLL
// ============================================================

function sendJoystick() {

    if (!connected) {

        return;

    }


    if (!armed) {

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


// ============================================================
// INITIAL STATE
// ============================================================

updateConnectionUI();

resetMotorDisplays();

updateJoystickDisplay();

addLog(
    "VAJRA website ready."
);

addLog(
    "Bluetooth disconnected."
);
