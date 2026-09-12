// ============================================================
// ANSH'S DRONE VAJRA 🚁⚡
// COMPLETE SCRIPT.JS
// ============================================================

// ============================================================
// BLE UUIDS
// MUST MATCH MAIN ESP32 CODE
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
// JOYSTICK VARIABLES
// ============================================================

let throttle = 0;
let yaw = 0;
let pitch = 0;
let roll = 0;

let lastJoystickSend = 0;


// ============================================================
// HELPER
// ============================================================

function $(id) {
    return document.getElementById(id);
}


// ============================================================
// PAGE ELEMENTS
// ============================================================

const connectBtn =
    $("connectBtn");

const disconnectBtn =
    $("disconnectBtn");

const connectionText =
    $("connectionText");

const connectionDot =
    $("connectionDot");

const largeConnectionText =
    $("largeConnectionText");

const deviceText =
    $("deviceText");

const logs =
    $("logs");


// ============================================================
// LOG
// ============================================================

function addLog(message) {

    console.log("[VAJRA]", message);

    if (!logs) {
        return;
    }

    const item =
        document.createElement("div");

    item.className =
        "log-entry";

    item.textContent =
        new Date().toLocaleTimeString() +
        "  " +
        message;

    logs.prepend(item);
}


// ============================================================
// CONNECTION UI
// ============================================================

function setConnectedUI() {

    connected = true;

    if (connectionText) {
        connectionText.textContent =
            "CONNECTED";
    }

    if (connectionDot) {
        connectionDot.classList.add(
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

    if (connectBtn) {
        connectBtn.textContent =
            "DISCONNECT";
    }

    addLog(
        "Bluetooth connected to " +
        (
            bleDevice.name ||
            "VAJRA"
        )
    );
}


function setDisconnectedUI() {

    connected = false;
    armed = false;

    rxCharacteristic = null;
    txCharacteristic = null;
    bleServer = null;

    if (connectionText) {
        connectionText.textContent =
            "DISCONNECTED";
    }

    if (connectionDot) {
        connectionDot.classList.remove(
            "connected"
        );
    }

    if (largeConnectionText) {
        largeConnectionText.textContent =
            "DRONE NOT CONNECTED";
    }

    if (deviceText) {
        deviceText.textContent =
            "No drone connected";
    }

    if (connectBtn) {
        connectBtn.textContent =
            "CONNECT";
    }

    resetArmButton();

}


// ============================================================
// BLUETOOTH CONNECT
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

        addLog(
            "Opening Bluetooth chooser..."
        );


        // ====================================================
        // FIND ESP32
        // ====================================================

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
                "Bluetooth device"
            )
        );


        // ====================================================
        // DISCONNECT EVENT
        // ====================================================

        bleDevice.addEventListener(
            "gattserverdisconnected",
            onDisconnected
        );


        // ====================================================
        // CONNECT GATT
        // ====================================================

        addLog(
            "Connecting to GATT..."
        );


        bleServer =
            await bleDevice.gatt.connect();


        addLog(
            "GATT connected."
        );


        // ====================================================
        // GET SERVICE
        // ====================================================

        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        addLog(
            "VAJRA service found."
        );


        // ====================================================
        // GET RX
        // WEBSITE -> ESP32
        // ====================================================

        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        addLog(
            "RX characteristic ready."
        );


        // ====================================================
        // GET TX
        // ESP32 -> WEBSITE
        // ====================================================

        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        addLog(
            "TX characteristic ready."
        );


        // ====================================================
        // NOTIFICATIONS
        // ====================================================

        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            receiveData
        );


        // ====================================================
        // SUCCESS
        // ====================================================

        setConnectedUI();


        // Safety:
        // Always stop motors after connection
        await sendCommand("STOP");


    }
    catch(error) {

        console.error(
            "Bluetooth error:",
            error
        );

        addLog(
            "BLE ERROR: " +
            error.name +
            " - " +
            error.message
        );

        setDisconnectedUI();


        alert(
            "VAJRA connection failed:\n\n" +
            error.message
        );
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


    setDisconnectedUI();

    addLog(
        "VAJRA disconnected."
    );
}


// ============================================================
// DISCONNECTED EVENT
// ============================================================

function onDisconnected() {

    addLog(
        "Bluetooth connection lost."
    );

    setDisconnectedUI();
}


// ============================================================
// RECEIVE FROM ESP32
// ============================================================

function receiveData(event) {

    const data =
        new TextDecoder().decode(
            event.target.value
        );

    console.log(
        "VAJRA RX:",
        data
    );

    addLog(
        "RX: " + data
    );
}


// ============================================================
// SEND COMMAND TO ESP32
// ============================================================

async function sendCommand(command) {

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


        // Write with response
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
            "TX:",
            command
        );

        addLog(
            "TX: " + command
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
// CONNECT BUTTON
// ============================================================

if (connectBtn) {

    connectBtn.addEventListener(
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
// DISCONNECT BUTTON
// ============================================================

if (disconnectBtn) {

    disconnectBtn.addEventListener(
        "click",
        disconnectVAJRA
    );
}


// ============================================================
// START ALL
// ============================================================

async function startAllMotors() {

    if (!connected) {

        alert(
            "Connect VAJRA first."
        );

        return;
    }


    await sendCommand(
        "START"
    );


    armed = true;

    updateArmButton();


    addLog(
        "START -> ALL MOTORS 2000us"
    );
}


// ============================================================
// STOP ALL
// ============================================================

async function stopAllMotors() {

    armed = false;

    await sendCommand(
        "STOP"
    );


    resetMotorDisplays();

    resetArmButton();


    addLog(
        "STOP -> ALL MOTORS 900us"
    );
}


// ============================================================
// ARM
// ============================================================

async function armVAJRA() {

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
            "VAJRA ARM"
        );

    }
    else {

        await stopAllMotors();

    }
}


// ============================================================
// ARM BUTTON
// ============================================================

const armButton =
    $("armButton");

if (armButton) {

    armButton.addEventListener(
        "click",
        armVAJRA
    );
}


// ============================================================
// STOP BUTTON
// ============================================================

const stopButton =
    $("stopButton");

if (stopButton) {

    stopButton.addEventListener(
        "click",
        stopAllMotors
    );
}


// ============================================================
// UPDATE ARM BUTTON
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
// INDIVIDUAL MOTOR START
// ============================================================

async function startMotor(
    motorNumber
) {

    if (!connected) {

        alert(
            "Connect VAJRA first."
        );

        return;
    }


    await sendCommand(
        "M" +
        motorNumber +
        " START"
    );


    updateMotor(
        motorNumber,
        2000,
        true
    );


    addLog(
        "M" +
        motorNumber +
        " START -> 2000us"
    );
}


// ============================================================
// INDIVIDUAL MOTOR STOP
// ============================================================

async function stopMotor(
    motorNumber
) {

    if (!connected) {

        alert(
            "Connect VAJRA first."
        );

        return;
    }


    await sendCommand(
        "M" +
        motorNumber +
        " STOP"
    );


    updateMotor(
        motorNumber,
        900,
        false
    );


    addLog(
        "M" +
        motorNumber +
        " STOP -> 900us"
    );
}


// ============================================================
// M1-M4 BUTTONS
// ============================================================

document
    .querySelectorAll(
        ".motor-start"
    )
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const motor =
                        button.dataset.motor ||
                        button.dataset.id ||
                        button.id;

                    const number =
                        String(motor)
                            .replace(
                                /[^0-9]/g,
                                ""
                            );

                    if (number) {

                        startMotor(
                            number
                        );

                    }

                }
            );
        }
    );


document
    .querySelectorAll(
        ".motor-stop"
    )
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const motor =
                        button.dataset.motor ||
                        button.dataset.id ||
                        button.id;

                    const number =
                        String(motor)
                            .replace(
                                /[^0-9]/g,
                                ""
                            );

                    if (number) {

                        stopMotor(
                            number
                        );

                    }

                }
            );
        }
    );


// ============================================================
// UPDATE MOTOR DISPLAY
// ============================================================

function updateMotor(
    number,
    speed,
    running
) {

    const status =
        $("m" + number + "Status");

    const speedElement =
        $("m" + number + "Speed");


    if (status) {

        status.textContent =
            running
                ? "ON"
                : "OFF";

    }


    if (speedElement) {

        speedElement.textContent =
            speed + " µs";

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

        this.area = area;
        this.stick = stick;
        this.callback = callback;

        this.active = false;
        this.pointerId = null;


        area.addEventListener(
            "pointerdown",
            (event) => {

                this.active = true;
                this.pointerId =
                    event.pointerId;

                area.setPointerCapture(
                    event.pointerId
                );

                this.move(event);

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


                this.move(event);

            }
        );


        area.addEventListener(
            "pointerup",
            (event) => {

                if (
                    event.pointerId ===
                    this.pointerId
                ) {

                    this.release();

                }

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
                radius / distance;

            x *= scale;
            y *= scale;

        }


        const normalizedX =
            x / radius;

        const normalizedY =
            y / radius;


        // Move visual stick
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

        this.active = false;
        this.pointerId = null;


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
    $("leftJoystick");

const leftStick =
    $("leftStick");


if (
    leftJoystick &&
    leftStick
) {

    new VAJRAJoystick(
        leftJoystick,
        leftStick,

        function(x, y) {

            // Up = throttle
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

            sendJoystickCommand();

        }
    );

}


// ============================================================
// RIGHT JOYSTICK
// PITCH + ROLL
// ============================================================

const rightJoystick =
    $("rightJoystick");

const rightStick =
    $("rightStick");


if (
    rightJoystick &&
    rightStick
) {

    new VAJRAJoystick(
        rightJoystick,
        rightStick,

        function(x, y) {

            roll =
                Math.round(
                    x * 100
                );


            pitch =
                Math.round(
                    -y * 100
                );


            updateJoystickDisplay();

            sendJoystickCommand();

        }
    );

}


// ============================================================
// JOYSTICK DISPLAY
// ============================================================

function updateJoystickDisplay() {

    const throttleElement =
        $("throttleValue");

    const yawElement =
        $("yawValue");

    const pitchElement =
        $("pitchValue");

    const rollElement =
        $("rollValue");


    if (throttleElement) {

        throttleElement.textContent =
            throttle;

    }

    if (yawElement) {

        yawElement.textContent =
            yaw;

    }

    if (pitchElement) {

        pitchElement.textContent =
            pitch;

    }

    if (rollElement) {

        rollElement.textContent =
            roll;

    }
}


// ============================================================
// SEND JOYSTICK COMMAND
//
// Flight Controller expects:
//
// JOY,THROTTLE,YAW,PITCH,ROLL
// ============================================================

function sendJoystickCommand() {

    if (!connected) {
        return;
    }


    if (!armed) {
        return;
    }


    const now =
        Date.now();


    // Limit BLE traffic
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
// EMERGENCY STOP
// ============================================================

const emergencyButton =
    $("emergencyButton");

if (emergencyButton) {

    emergencyButton.addEventListener(
        "click",
        async function() {

            armed = false;

            await sendCommand(
                "EMERGENCY"
            );

            resetMotorDisplays();

            resetArmButton();

            addLog(
                "EMERGENCY STOP -> 900us"
            );

        }
    );
}


// ============================================================
// TAKEOFF
// ============================================================

const takeoffButton =
    $("takeoffButton");

if (takeoffButton) {

    takeoffButton.addEventListener(
        "click",
        async function() {

            if (!connected) {

                alert(
                    "Connect VAJRA first."
                );

                return;

            }


            await sendCommand(
                "TAKEOFF"
            );


            armed = true;

            updateArmButton();


            addLog(
                "TAKEOFF command sent"
            );

        }
    );
}


// ============================================================
// LAND
// ============================================================

const landButton =
    $("landButton");

if (landButton) {

    landButton.addEventListener(
        "click",
        async function() {

            await sendCommand(
                "LAND"
            );


            armed = false;

            resetArmButton();

            resetMotorDisplays();


            addLog(
                "LAND -> STOP"
            );

        }
    );
}


// ============================================================
// PAGE STARTUP
// ============================================================

setDisconnectedUI();

addLog(
    "VAJRA website ready."
);

addLog(
    "Bluetooth: DISCONNECTED"
);
