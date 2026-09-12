// ============================================================
// ANSH'S DRONE VAJRA
// WEBSITE CONTROL SCRIPT
// ============================================================

// ===============================
// LOGIN
// ===============================

const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");

const username = document.getElementById("username");
const password = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");

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

password.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        loginButton.click();
    }

});


// ===============================
// BLE UUIDS
// ===============================

const SERVICE_UUID =
    "12345678-1234-1234-1234-1234567890ab";

const RX_UUID =
    "12345678-1234-1234-1234-1234567890ac";

const TX_UUID =
    "12345678-1234-1234-1234-1234567890ad";


// ===============================
// BLE VARIABLES
// ===============================

let device = null;
let server = null;
let rx = null;
let tx = null;

let connected = false;
let armed = false;


// ===============================
// BUTTONS
// ===============================

const connectButton =
    document.getElementById("connectButton");

const searchButton =
    document.getElementById("searchButton");

const armButton =
    document.getElementById("armButton");

const stopButton =
    document.getElementById("stopButton");


// ===============================
// CONNECT
// ===============================

connectButton.addEventListener(
    "click",
    async function () {

        if (connected) {

            disconnectVAJRA();

        } else {

            connectVAJRA();

        }

    }
);


searchButton.addEventListener(
    "click",
    async function () {

        if (connected) {

            disconnectVAJRA();

        } else {

            connectVAJRA();

        }

    }
);


// ===============================
// CONNECT VAJRA
// ===============================

async function connectVAJRA() {

    try {

        console.log("Searching Bluetooth...");


        device =
            await navigator.bluetooth.requestDevice({

                acceptAllDevices: true,

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        console.log(
            "FOUND:",
            device.name
        );


        device.addEventListener(
            "gattserverdisconnected",
            function () {

                connected = false;

                updateConnection();

                console.log(
                    "VAJRA DISCONNECTED"
                );

            }
        );


        server =
            await device.gatt.connect();


        console.log(
            "GATT CONNECTED"
        );


        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        rx =
            await service.getCharacteristic(
                RX_UUID
            );


        tx =
            await service.getCharacteristic(
                TX_UUID
            );


        connected = true;
        armed = false;


        updateConnection();


        console.log(
            "VAJRA CONNECTED SUCCESSFULLY"
        );

    }
    catch (error) {

        console.error(
            "BLE ERROR:",
            error
        );

        connected = false;

        updateConnection();

    }

}


// ===============================
// DISCONNECT
// ===============================

function disconnectVAJRA() {

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

        console.log(error);

    }


    device = null;
    server = null;
    rx = null;
    tx = null;

    connected = false;
    armed = false;


    updateConnection();

}


// ===============================
// CONNECTION DISPLAY
// ===============================

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


    if (connected) {

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
                device.name ||
                "ANSH'S DRONE VAJRA";

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


// ===============================
// SEND COMMAND
// ===============================

async function sendCommand(command) {

    if (!rx) {

        console.log(
            "NOT CONNECTED"
        );

        return false;

    }


    try {

        const data =
            new TextEncoder().encode(
                command + "\n"
            );


        if (
            typeof rx.writeValueWithoutResponse ===
            "function"
        ) {

            await rx.writeValueWithoutResponse(
                data
            );

        }
        else {

            await rx.writeValue(data);

        }


        console.log(
            "TX:",
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


// ===============================
// ARM
// ===============================

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

            updateConnection();

        }
        else {

            await stopAll();

        }

    }
);


// ===============================
// STOP
// ===============================

stopButton.addEventListener(
    "click",
    stopAll
);


async function stopAll() {

    armed = false;

    await sendCommand(
        "STOP"
    );

    armButton.textContent =
        "ARM";

    armButton.classList.remove(
        "armed"
    );

    updateConnection();

}


// ===============================
// MOTOR START BUTTONS
// ===============================

document
    .querySelectorAll(
        ".motor-start"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const motor =
                        button.dataset.motor;


                    if (!connected) {

                        alert(
                            "Connect VAJRA first."
                        );

                        return;

                    }


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

        }
    );


// ===============================
// MOTOR STOP BUTTONS
// ===============================

document
    .querySelectorAll(
        ".motor-stop"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const motor =
                        button.dataset.motor;


                    if (!connected) {

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
                            "900 µs";


                    if (status)
                        status.textContent =
                            "OFF";

                }
            );

        }
    );


// ===============================
// JOYSTICK VALUES
// ===============================

let throttle = 0;
let yaw = 0;
let pitch = 0;
let roll = 0;

let joystickTimer = null;


// ===============================
// JOYSTICK FUNCTION
// ===============================

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


    area.addEventListener(
        "pointerup",
        function () {

            active = false;

            stick.style.transform =
                "translate(-50%, -50%)";

            callback(
                0,
                0
            );

        }
    );


    area.addEventListener(
        "pointercancel",
        function () {

            active = false;

            stick.style.transform =
                "translate(-50%, -50%)";

            callback(
                0,
                0
            );

        }
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


// ===============================
// LEFT JOYSTICK
// ===============================

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


// ===============================
// RIGHT JOYSTICK
// ===============================

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


// ===============================
// JOYSTICK LOOP
// ===============================

function startJoystick() {

    if (joystickTimer !== null)
        return;


    joystickTimer =
        setInterval(
            function () {

                if (
                    connected &&
                    armed
                ) {

                    sendCommand(
                        "JOY," +
                        throttle +
                        "," +
                        yaw +
                        "," +
                        pitch +
                        "," +
                        roll
                    );

                }

            },
            20
        );

}


function stopJoystick() {

    if (joystickTimer !== null) {

        clearInterval(
            joystickTimer
        );

        joystickTimer = null;

    }

}


// Start joystick loop
// only after ARM

armButton.addEventListener(
    "click",
    function () {

        if (armed) {
            startJoystick();
        }
        else {
            stopJoystick();
        }

    }
);


// ===============================
// INITIAL STATE
// ===============================

updateConnection();

console.log(
    "VAJRA JavaScript loaded successfully."
);
