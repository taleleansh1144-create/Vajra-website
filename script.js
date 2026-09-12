// ============================================================
// ANSH'S DRONE VAJRA
// WEBSITE CONTROL SCRIPT
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


// Login
if (loginButton) {

    loginButton.addEventListener("click", function () {

        if (
            username.value.trim() === "VAJRA" &&
            password.value === "VAJRA"
        ) {

            loginError.textContent = "";

            loginPage.classList.add("hidden");
            dashboard.classList.remove("hidden");

            console.log("VAJRA LOGIN OK");

        } else {

            loginError.textContent =
                "Invalid username or password.";

        }

    });

}


// Enter key for password
if (password) {

    password.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            loginButton.click();

        }

    });

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
// BLE WRITE QUEUE
// ============================================================

let bleWriteQueue = Promise.resolve();


// ============================================================
// BUTTON REFERENCES
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

    connectButton.addEventListener("click", async function () {

        if (connected) {

            disconnectVAJRA();

        } else {

            await connectVAJRA();

        }

    });

}


// ============================================================
// SEARCH BUTTON
// ============================================================

if (searchButton) {

    searchButton.addEventListener("click", async function () {

        if (connected) {

            disconnectVAJRA();

        } else {

            await connectVAJRA();

        }

    });

}


// ============================================================
// CONNECT VAJRA
// ============================================================

async function connectVAJRA() {

    try {

        console.log(
            "Searching for ANSH'S DRONE VAJRA..."
        );


        device =
            await navigator.bluetooth.requestDevice({

                acceptAllDevices: true,

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


        // Find service
        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        console.log(
            "Service found"
        );


        // Find RX
        rx =
            await service.getCharacteristic(
                RX_UUID
            );


        console.log(
            "RX ready"
        );


        // Find TX
        tx =
            await service.getCharacteristic(
                TX_UUID
            );


        console.log(
            "TX ready"
        );


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
// BLE DISCONNECT EVENT
// ============================================================

function handleDisconnect() {

    console.log(
        "VAJRA DISCONNECTED"
    );


    connected = false;
    armed = false;


    server = null;
    rx = null;
    tx = null;


    stopJoystick();


    updateConnection();

}


// ============================================================
// MANUAL DISCONNECT
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

    const connectionText =
        document.getElementById(
            "connectionText"
        );


    const connectionDot =
        document.getElementById(
            "connectionDot"
        );


    const largeConnectionText =
        document.getElementById(
            "largeConnectionText"
        );


    const largeConnectionDot =
        document.getElementById(
            "largeConnectionDot"
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
                device && device.name
                    ? device.name
                    : "ANSH'S DRONE VAJRA";


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
                "Press SEARCH FOR BLUETOOTH";


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
// LOW-LEVEL BLE WRITE
// ============================================================

function writeBLE(data) {

    bleWriteQueue =
        bleWriteQueue.then(async function () {

            if (!rx) {

                throw new Error(
                    "RX characteristic is not available."
                );

            }


            if (!device ||
                !device.gatt ||
                !device.gatt.connected) {

                throw new Error(
                    "GATT server is disconnected."
                );

            }


            // Prefer write without response
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


            // Prevent BLE operations from colliding
            await new Promise(function (resolve) {

                setTimeout(resolve, 10);

            });

        });


    return bleWriteQueue;

}


// ============================================================
// SEND VAJRA COMMAND
//
// Example:
// sendCommand("START")
//
// Actual BLE data:
// VAJRA:START\n
// ============================================================

async function sendCommand(command) {

    if (!connected || !rx) {

        console.error(
            "VAJRA NOT CONNECTED"
        );

        return false;

    }


    const fullCommand =
        "VAJRA:" + command + "\n";


    try {

        const data =
            new TextEncoder().encode(
                fullCommand
            );


        await writeBLE(
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
            "BLE SEND ERROR:",
            error
        );


        return false;

    }

}


// ============================================================
// ARM BUTTON
// ============================================================

if (armButton) {

    armButton.addEventListener("click", async function () {

        if (!connected) {

            alert(
                "Connect VAJRA first."
            );

            return;

        }


        if (!armed) {

            const success =
                await sendCommand(
                    "ARM"
                );


            if (success) {

                armed = true;


                armButton.textContent =
                    "ARMED";


                armButton.classList.add(
                    "armed"
                );


                updateConnection();


                startJoystick();

            }

        }
        else {

            await stopAll();

        }

    });

}


// ============================================================
// STOP BUTTON
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
// MOTOR START BUTTONS
// ============================================================

document
    .querySelectorAll(".motor-start")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            async function () {

                if (!connected) {

                    alert(
                        "Connect VAJRA first."
                    );

                    return;

                }


                const motor =
                    button.dataset.motor;


                const success =
                    await sendCommand(
                        motor + " START"
                    );


                if (!success)
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
// MOTOR STOP BUTTONS
// ============================================================

document
    .querySelectorAll(".motor-stop")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            async function () {

                if (!connected)
                    return;


                const motor =
                    button.dataset.motor;


                const success =
                    await sendCommand(
                        motor + " STOP"
                    );


                if (!success)
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


                const status =
                    document.getElementById(
                        "m" +
                        number +
                        "Status"
                    );


                if (speed)
                    speed.textContent =
                        "900 µs";


                if (status)
                    status.textContent =
                        "OFF";

            }
        );

    });


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

    if (!area || !stick)
        return;


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

            if (!active)
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


        const distance =
            Math.sqrt(
                x * x +
                y * y
            );


        if (radius <= 0)
            return;


        if (distance > radius) {

            const scale =
                radius / distance;


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
                ((-y + 1) / 2) * 100
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
// JOYSTICK TRANSMISSION
// ============================================================

function startJoystick() {

    if (joystickTimer !== null)
        return;


    joystickTimer =
        setInterval(function () {

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

        }, 80);

}


// ============================================================
// STOP JOYSTICK
// ============================================================

function stopJoystick() {

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

updateConnection();


console.log(
    "VAJRA JavaScript loaded successfully."
);
