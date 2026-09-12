// ============================================================
// ANSH'S DRONE VAJRA
// WEBSITE CONTROL SCRIPT
//
// LOGIN
// BLE
// MOTOR CONTROL
// JOYSTICKS
// MPU6050 TELEMETRY
// PID TELEMETRY
// ============================================================


// ============================================================
// LOGIN
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


if (loginButton) {

    loginButton.addEventListener(
        "click",
        function () {

            if (
                username.value.trim() === "VAJRA" &&
                password.value === "VAJRA"
            ) {

                loginError.textContent = "";

                loginPage.classList.add(
                    "hidden"
                );

                dashboard.classList.remove(
                    "hidden"
                );

                console.log(
                    "VAJRA LOGIN OK"
                );

            }
            else {

                loginError.textContent =
                    "Invalid username or password.";

            }

        }
    );

}


if (password) {

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


// ============================================================
// BLE UUIDS
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

let device = null;
let server = null;
let rx = null;
let tx = null;

let connected = false;
let armed = false;


// ============================================================
// BLE QUEUE
// ============================================================

let bleQueue =
    Promise.resolve();


// ============================================================
// BUTTONS
// ============================================================

const connectButton =
    document.getElementById(
        "connectButton"
    );

const searchButton =
    document.getElementById(
        "searchButton"
    );

const armButton =
    document.getElementById(
        "armButton"
    );

const stopButton =
    document.getElementById(
        "stopButton"
    );


// ============================================================
// BLE WRITE
// ============================================================

function queueBLEWrite(data) {

    bleQueue =
        bleQueue.then(
            async function () {

                if (
                    !rx
                ) {

                    throw new Error(
                        "RX characteristic unavailable"
                    );

                }


                if (
                    !device ||
                    !device.gatt ||
                    !device.gatt.connected
                ) {

                    throw new Error(
                        "GATT server disconnected"
                    );

                }


                if (
                    typeof rx.writeValueWithoutResponse ===
                    "function"
                ) {

                    await rx.writeValueWithoutResponse(
                        data
                    );

                }
                else {

                    await rx.writeValue(
                        data
                    );

                }


                await new Promise(
                    function (resolve) {

                        setTimeout(
                            resolve,
                            10
                        );

                    }
                );

            }
        )
        .catch(
            function (error) {

                console.error(
                    "BLE QUEUE ERROR:",
                    error
                );

            }
        );


    return bleQueue;

}


// ============================================================
// CONNECT BUTTON
// ============================================================

if (connectButton) {

    connectButton.addEventListener(
        "click",
        async function () {

            if (
                connected
            ) {

                disconnectVAJRA();

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
        async function () {

            if (
                connected
            ) {

                disconnectVAJRA();

            }
            else {

                await connectVAJRA();

            }

        }
    );

}


// ============================================================
// CONNECT
// ============================================================

async function connectVAJRA() {

    try {

        console.log(
            "Searching for ANSH'S DRONE VAJRA..."
        );


        device =
            await navigator.bluetooth.requestDevice({

                acceptAllDevices:
                    true,

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        console.log(
            "Selected:",
            device.name
        );


        device.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );


        console.log(
            "Connecting..."
        );


        server =
            await device.gatt.connect();


        console.log(
            "GATT connected"
        );


        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        console.log(
            "Service found"
        );


        rx =
            await service.getCharacteristic(
                RX_UUID
            );


        console.log(
            "RX ready"
        );


        tx =
            await service.getCharacteristic(
                TX_UUID
            );


        console.log(
            "TX ready"
        );


        // ----------------------------------------------------
        // Enable telemetry notifications
        // ----------------------------------------------------

        try {

            await tx.startNotifications();

            tx.addEventListener(
                "characteristicvaluechanged",
                handleTelemetry
            );

            console.log(
                "Telemetry notifications enabled"
            );

        }
        catch (error) {

            console.warn(
                "Telemetry notification error:",
                error
            );

        }


        connected = true;
        armed = false;


        updateConnection();


        console.log(
            "VAJRA CONNECTED"
        );

    }
    catch (error) {

        console.error(
            "BLE ERROR:",
            error
        );


        connected = false;
        armed = false;


        updateConnection();

    }

}


// ============================================================
// DISCONNECT EVENT
// ============================================================

function handleDisconnect() {

    console.log(
        "VAJRA DISCONNECTED"
    );


    connected = false;
    armed = false;


    rx = null;
    tx = null;
    server = null;


    stopJoystick();


    updateConnection();

}


// ============================================================
// DISCONNECT
// ============================================================

function disconnectVAJRA() {

    stopJoystick();


    try {

        if (
            device &&
            device.gatt &&
            device.gatt.connected
        ) {

            device.gatt.disconnect();

        }

    }
    catch (error) {

        console.log(
            "DISCONNECT ERROR:",
            error
        );

    }


    device = null;
    server = null;
    rx = null;
    tx = null;


    connected = false;
    armed = false;


    updateConnection();

}


// ============================================================
// CONNECTION DISPLAY
// ============================================================

function updateConnection() {

    const text =
        document.getElementById(
            "connectionText"
        );

    const dot =
        document.getElementById(
            "connectionDot"
        );

    const largeText =
        document.getElementById(
            "largeConnectionText"
        );

    const largeDot =
        document.getElementById(
            "largeConnectionDot"
        );

    const deviceText =
        document.getElementById(
            "deviceText"
        );

    const status =
        document.getElementById(
            "remoteStatus"
        );

    const ble =
        document.getElementById(
            "telemetryBLE"
        );


    if (
        connected
    ) {

        if (text)
            text.textContent =
                "CONNECTED";


        if (dot)
            dot.classList.add(
                "connected"
            );


        if (largeDot)
            largeDot.classList.add(
                "connected"
            );


        if (largeText)
            largeText.textContent =
                "DRONE CONNECTED";


        if (deviceText)
            deviceText.textContent =
                device && device.name
                    ? device.name
                    : "ANSH'S DRONE VAJRA";


        if (connectButton)
            connectButton.textContent =
                "DISCONNECT";


        if (searchButton)
            searchButton.textContent =
                "DISCONNECT VAJRA";


        if (status)
            status.textContent =
                armed
                    ? "ARMED"
                    : "CONNECTED";


        if (ble)
            ble.textContent =
                "ONLINE";

    }
    else {

        if (text)
            text.textContent =
                "DISCONNECTED";


        if (dot)
            dot.classList.remove(
                "connected"
            );


        if (largeDot)
            largeDot.classList.remove(
                "connected"
            );


        if (largeText)
            largeText.textContent =
                "DRONE NOT CONNECTED";


        if (deviceText)
            deviceText.textContent =
                "Press SEARCH FOR BLUETOOTH";


        if (connectButton)
            connectButton.textContent =
                "CONNECT";


        if (searchButton)
            searchButton.textContent =
                "SEARCH BLUETOOTH";


        if (status)
            status.textContent =
                "DISCONNECTED";


        if (ble)
            ble.textContent =
                "OFFLINE";

    }

}


// ============================================================
// SEND COMMAND
//
// Example:
// sendCommand("START")
//
// Actual BLE message:
//
// VAJRA:START\n
// ============================================================

async function sendCommand(command) {

    if (
        !connected ||
        !rx
    ) {

        console.error(
            "VAJRA NOT CONNECTED"
        );

        return false;

    }


    const fullCommand =
        "VAJRA:" +
        command +
        "\n";


    try {

        const data =
            new TextEncoder().encode(
                fullCommand
            );


        await queueBLEWrite(
            data
        );


        console.log(
            "VAJRA COMMAND SENT:",
            "VAJRA:" + command
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
// ARM
// ============================================================

if (armButton) {

    armButton.addEventListener(
        "click",
        async function () {

            if (
                !connected
            ) {

                alert(
                    "Connect VAJRA first."
                );

                return;

            }


            if (
                !armed
            ) {

                const success =
                    await sendCommand(
                        "ARM"
                    );


                if (
                    success
                ) {

                    armed = true;


                    armButton.textContent =
                        "ARMED";


                    armButton.classList.add(
                        "armed"
                    );


                    startJoystick();


                    updateConnection();

                }

            }
            else {

                await stopAll();

            }

        }
    );

}


// ============================================================
// STOP ALL
// ============================================================

if (stopButton) {

    stopButton.addEventListener(
        "click",
        stopAll
    );

}


async function stopAll() {

    armed = false;


    stopJoystick();


    await sendCommand(
        "STOP"
    );


    if (armButton) {

        armButton.textContent =
            "ARM";


        armButton.classList.remove(
            "armed"
        );

    }


    updateConnection();

}


// ============================================================
// INDIVIDUAL MOTOR START
// ============================================================

document
    .querySelectorAll(
        ".motor-start"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    if (
                        !connected
                    ) {

                        alert(
                            "Connect VAJRA first."
                        );

                        return;

                    }


                    const motor =
                        button.dataset.motor;


                    const success =
                        await sendCommand(
                            motor +
                            " START"
                        );


                    if (
                        !success
                    )
                        return;


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


                    const motorStatus =
                        document.getElementById(
                            "m" +
                            number +
                            "Status"
                        );


                    if (speed)
                        speed.textContent =
                            "2000 µs";


                    if (motorStatus)
                        motorStatus.textContent =
                            "ON";

                }
            );

        }
    );


// ============================================================
// INDIVIDUAL MOTOR STOP
// ============================================================

document
    .querySelectorAll(
        ".motor-stop"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    if (
                        !connected
                    )
                        return;


                    const motor =
                        button.dataset.motor;


                    const success =
                        await sendCommand(
                            motor +
                            " STOP"
                        );


                    if (
                        !success
                    )
                        return;


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


                    const motorStatus =
                        document.getElementById(
                            "m" +
                            number +
                            "Status"
                        );


                    if (speed)
                        speed.textContent =
                            "900 µs";


                    if (motorStatus)
                        motorStatus.textContent =
                            "OFF";

                }
            );

        }
    );


// ============================================================
// JOYSTICK VALUES
// ============================================================

let throttle = 0;
let yaw = 0;
let pitch = 0;
let roll = 0;

let joystickTimer = null;


// ============================================================
// CREATE JOYSTICK
// ============================================================

function createJoystick(
    area,
    stick,
    callback
) {

    if (
        !area ||
        !stick
    ) {

        return;

    }


    let active = false;


    area.style.touchAction =
        "none";


    area.addEventListener(
        "pointerdown",
        function (event) {

            active = true;


            area.setPointerCapture(
                event.pointerId
            );


            move(event);

        }
    );


    area.addEventListener(
        "pointermove",
        function (event) {

            if (
                !active
            )
                return;


            move(event);

        }
    );


    function releaseJoystick() {

        active = false;


        stick.style.transform =
            "translate(-50%, -50%)";


        callback(
            0,
            0
        );

    }


    area.addEventListener(
        "pointerup",
        releaseJoystick
    );


    area.addEventListener(
        "pointercancel",
        releaseJoystick
    );


    area.addEventListener(
        "lostpointercapture",
        releaseJoystick
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


        if (
            radius <= 0
        )
            return;


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


        stick.style.transform =
            "translate(calc(-50% + " +
            x +
            "px), calc(-50% + " +
            y +
            "px))";


        callback(
            x / radius,
            y / radius
        );

    }

}


// ============================================================
// LEFT JOYSTICK
// THROTTLE + YAW
// ============================================================

createJoystick(

    document.getElementById(
        "leftJoystick"
    ),

    document.getElementById(
        "leftStick"
    ),

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

    }

);


// ============================================================
// RIGHT JOYSTICK
// PITCH + ROLL
// ============================================================

createJoystick(

    document.getElementById(
        "rightJoystick"
    ),

    document.getElementById(
        "rightStick"
    ),

    function (x, y) {

        roll =
            Math.round(
                x * 100
            );


        pitch =
            Math.round(
                -y * 100
            );

    }

);


// ============================================================
// JOYSTICK LOOP
// ============================================================

function startJoystick() {

    if (
        joystickTimer !== null
    )
        return;


    joystickTimer =
        setInterval(
            function () {

                if (
                    connected &&
                    armed &&
                    rx
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
            80
        );

}


// ============================================================
// STOP JOYSTICK LOOP
// ============================================================

function stopJoystick() {

    if (
        joystickTimer !== null
    ) {

        clearInterval(
            joystickTimer
        );


        joystickTimer = null;

    }

}


// ============================================================
// TELEMETRY
// ============================================================

function handleTelemetry(event) {

    try {

        const decoder =
            new TextDecoder();


        const message =
            decoder.decode(
                event.target.value
            ).trim();


        console.log(
            "TELEMETRY:",
            message
        );


        if (
            !message.startsWith(
                "TEL,"
            )
        ) {

            return;

        }


        const parts =
            message.split(",");


        if (
            parts.length < 18
        ) {

            console.warn(
                "Incomplete telemetry:",
                message
            );

            return;

        }


        const rollAngle =
            Number(parts[1]);

        const pitchAngle =
            Number(parts[2]);


        const gyroX =
            Number(parts[3]);

        const gyroY =
            Number(parts[4]);

        const gyroZ =
            Number(parts[5]);


        const m1 =
            Number(parts[6]);

        const m2 =
            Number(parts[7]);

        const m3 =
            Number(parts[8]);

        const m4 =
            Number(parts[9]);


        const rollP =
            Number(parts[10]);

        const rollI =
            Number(parts[11]);

        const rollD =
            Number(parts[12]);

        const rollPID =
            Number(parts[13]);


        const pitchP =
            Number(parts[14]);

        const pitchI =
            Number(parts[15]);

        const pitchD =
            Number(parts[16]);

        const pitchPID =
            Number(parts[17]);


        updateTelemetryDisplay(
            rollAngle,
            pitchAngle,
            gyroX,
            gyroY,
            gyroZ,
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
        );

    }
    catch (error) {

        console.error(
            "TELEMETRY ERROR:",
            error
        );

    }

}


// ============================================================
// UPDATE TELEMETRY DISPLAY
// ============================================================

function updateTelemetryDisplay(

    rollAngle,
    pitchAngle,

    gyroX,
    gyroY,
    gyroZ,

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

) {


    // --------------------------------------------------------
    // ATTITUDE
    // --------------------------------------------------------

    setTelemetry(
        "telemetryRoll",
        rollAngle.toFixed(2) +
        "°"
    );


    setTelemetry(
        "telemetryPitch",
        pitchAngle.toFixed(2) +
        "°"
    );


    // --------------------------------------------------------
    // GYROSCOPE
    // --------------------------------------------------------

    setTelemetry(
        "telemetryGyroX",
        gyroX.toFixed(1)
    );


    setTelemetry(
        "telemetryGyroY",
        gyroY.toFixed(1)
    );


    setTelemetry(
        "telemetryGyroZ",
        gyroZ.toFixed(1)
    );


    // --------------------------------------------------------
    // MOTORS
    // --------------------------------------------------------

    setTelemetry(
        "telemetryM1",
        m1 + " µs"
    );


    setTelemetry(
        "telemetryM2",
        m2 + " µs"
    );


    setTelemetry(
        "telemetryM3",
        m3 + " µs"
    );


    setTelemetry(
        "telemetryM4",
        m4 + " µs"
    );


    // --------------------------------------------------------
    // ROLL PID
    // --------------------------------------------------------

    setTelemetry(
        "rollP",
        rollP.toFixed(2)
    );


    setTelemetry(
        "rollI",
        rollI.toFixed(2)
    );


    setTelemetry(
        "rollD",
        rollD.toFixed(2)
    );


    setTelemetry(
        "rollPID",
        rollPID.toFixed(2)
    );


    // --------------------------------------------------------
    // PITCH PID
    // --------------------------------------------------------

    setTelemetry(
        "pitchP",
        pitchP.toFixed(2)
    );


    setTelemetry(
        "pitchI",
        pitchI.toFixed(2)
    );


    setTelemetry(
        "pitchD",
        pitchD.toFixed(2)
    );


    setTelemetry(
        "pitchPID",
        pitchPID.toFixed(2)
    );

}


// ============================================================
// TELEMETRY HELPER
// ============================================================

function setTelemetry(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.textContent =
            value;

    }

}


// ============================================================
// INITIAL STATE
// ============================================================

updateConnection();


console.log(
    "VAJRA JavaScript loaded successfully."
);
