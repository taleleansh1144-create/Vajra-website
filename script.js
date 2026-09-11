/* =====================================================
   ANSH'S DRONE VAJRA 🚁⚡

   REAL WEB BLUETOOTH CONTROL

   ESP32-C3 BLE UUIDS

   SERVICE:
   6e400001-b5a3-f393-e0a9-e50e24dcca9e

   RX:
   6e400002-b5a3-f393-e0a9-e50e24dcca9e

   TX:
   6e400003-b5a3-f393-e0a9-e50e24dcca9e
===================================================== */


/* =====================================================
   BLE CONFIGURATION
===================================================== */

const SERVICE_UUID =
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

const RX_UUID =
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const TX_UUID =
    "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

const DEVICE_NAME =
    "ANSH'S DRONE VAJRA";


/* =====================================================
   BLE VARIABLES
===================================================== */

let bleDevice = null;

let bleServer = null;

let rxCharacteristic = null;

let txCharacteristic = null;

let isConnected = false;

let isSearching = false;

let isArmed = false;


/* =====================================================
   GET ELEMENTS
===================================================== */

const loginPage =
    document.getElementById(
        "loginPage"
    );

const dashboard =
    document.getElementById(
        "dashboard"
    );

const username =
    document.getElementById(
        "username"
    );

const password =
    document.getElementById(
        "password"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const loginError =
    document.getElementById(
        "loginError"
    );


const connectButton =
    document.getElementById(
        "connectButton"
    );

const searchButton =
    document.getElementById(
        "searchButton"
    );


/* =====================================================
   LOGIN
===================================================== */

loginButton.addEventListener(
    "click",
    login
);


password.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            login();

        }

    }
);


function login() {

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
            "SYSTEM",
            "VAJRA dashboard opened"
        );

    }
    else {

        loginError.textContent =
            "Invalid username or password.";

    }

}


/* =====================================================
   NAVIGATION
===================================================== */

document
    .querySelectorAll(".nav-button")
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    document
                        .querySelectorAll(
                            ".nav-button"
                        )
                        .forEach(
                            function(btn) {

                                btn.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    document
                        .querySelectorAll(
                            ".page"
                        )
                        .forEach(
                            function(page) {

                                page.classList.remove(
                                    "active"
                                );

                            }
                        );


                    document
                        .getElementById(
                            button.dataset.page
                        )
                        .classList.add(
                            "active"
                        );

                }
            );

        }
    );


/* =====================================================
   CONNECT BUTTON
===================================================== */

connectButton.addEventListener(
    "click",
    handleConnectionButton
);


searchButton.addEventListener(
    "click",
    handleConnectionButton
);


async function handleConnectionButton() {

    if (isSearching) {

        return;

    }


    if (isConnected) {

        disconnectBLE();

    }
    else {

        await connectBLE();

    }

}


/* =====================================================
   REAL BLE SEARCH
===================================================== */

async function connectBLE() {

    /*
       Check Web Bluetooth.
    */

    if (
        !navigator.bluetooth
    ) {

        alert(
            "Web Bluetooth is not available in this browser.\n\nUse Google Chrome or Microsoft Edge."
        );

        addLog(
            "BLE ERROR",
            "Web Bluetooth unavailable"
        );

        return;

    }


    if (isSearching) {

        return;

    }


    isSearching = true;

    setSearchingUI(
        true
    );


    addLog(
        "BLE",
        "Searching for " +
        DEVICE_NAME
    );


    try {

        /*
           IMPORTANT:

           This opens Chrome's REAL
           Bluetooth device chooser.
        */

        bleDevice =
            await navigator.bluetooth.requestDevice(
                {
                    filters: [
                        {
                            name: DEVICE_NAME
                        }
                    ],

                    optionalServices: [
                        SERVICE_UUID
                    ]
                }
            );


        addLog(
            "BLE",
            "Device selected: " +
            (
                bleDevice.name ||
                DEVICE_NAME
            )
        );


        /*
           Detect disconnect.
        */

        bleDevice.addEventListener(
            "gattserverdisconnected",
            handleBLEDisconnect
        );


        /*
           Connect GATT.
        */

        bleServer =
            await bleDevice.gatt.connect();


        addLog(
            "BLE",
            "GATT server connected"
        );


        /*
           Get service.
        */

        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        /*
           Get RX characteristic.
        */

        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        /*
           Get TX characteristic.
        */

        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        /*
           Subscribe to telemetry.
        */

        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            handleTelemetry
        );


        isConnected = true;

        isSearching = false;


        updateConnectionUI();


        addLog(
            "BLE",
            "VAJRA CONNECTED"
        );


        /*
           SAFE INITIAL COMMAND
        */

        await sendCommand(
            "STOP"
        );

    }
    catch(error) {

        console.error(
            "Bluetooth error:",
            error
        );


        isConnected = false;

        isSearching = false;

        rxCharacteristic = null;

        txCharacteristic = null;


        if (
            error.name ===
            "NotFoundError"
        ) {

            addLog(
                "BLE",
                "Bluetooth search cancelled"
            );

        }
        else {

            addLog(
                "BLE ERROR",
                error.message
            );


            alert(
                "Bluetooth connection failed:\n\n" +
                error.message
            );

        }

    }


    setSearchingUI(
        false
    );

    updateConnectionUI();

}


/* =====================================================
   SEARCHING UI
===================================================== */

function setSearchingUI(
    searching
) {

    if (searching) {

        connectButton.disabled =
            true;

        searchButton.disabled =
            true;


        connectButton.textContent =
            "SEARCHING...";


        searchButton.textContent =
            "🔎 SEARCHING...";


        document
            .getElementById(
                "connectionText"
            )
            .textContent =
            "SEARCHING...";


        document
            .getElementById(
                "largeConnectionText"
            )
            .textContent =
            "SEARCHING FOR VAJRA";


        document
            .getElementById(
                "deviceText"
            )
            .textContent =
            "Select ANSH'S DRONE VAJRA in the Bluetooth window.";

    }
    else {

        connectButton.disabled =
            false;

        searchButton.disabled =
            false;

    }

}


/* =====================================================
   CONNECTION UI
===================================================== */

function updateConnectionUI() {

    const topDot =
        document.getElementById(
            "connectionDot"
        );


    const largeDot =
        document.getElementById(
            "largeConnectionDot"
        );


    const connectionText =
        document.getElementById(
            "connectionText"
        );


    const largeText =
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


    if (isConnected) {

        topDot.classList.add(
            "connected"
        );


        largeDot.classList.add(
            "connected"
        );


        connectionText.textContent =
            "CONNECTED";


        connectButton.textContent =
            "DISCONNECT";


        searchButton.textContent =
            "DISCONNECT VAJRA";


        largeText.textContent =
            "DRONE CONNECTED";


        deviceText.textContent =
            bleDevice?.name ||
            DEVICE_NAME;


        remoteStatus.textContent =
            "CONNECTED";


        telemetryBLE.textContent =
            "ONLINE";

    }
    else {

        topDot.classList.remove(
            "connected"
        );


        largeDot.classList.remove(
            "connected"
        );


        connectionText.textContent =
            "DISCONNECTED";


        connectButton.textContent =
            "CONNECT";


        searchButton.textContent =
            "🔎 SEARCH FOR VAJRA";


        largeText.textContent =
            "DRONE NOT CONNECTED";


        deviceText.textContent =
            "Press CONNECT to search for " +
            DEVICE_NAME;


        remoteStatus.textContent =
            "DISCONNECTED";


        telemetryBLE.textContent =
            "OFFLINE";

    }

}


/* =====================================================
   DISCONNECT
===================================================== */

function disconnectBLE() {

    /*
       Send STOP before disconnecting.
    */

    if (rxCharacteristic) {

        sendCommand(
            "STOP"
        );

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


    bleServer = null;

    rxCharacteristic = null;

    txCharacteristic = null;

    isConnected = false;

    isArmed = false;


    updateConnectionUI();


    resetARM();


    addLog(
        "BLE",
        "VAJRA disconnected"
    );

}


/* =====================================================
   BLE DISCONNECT EVENT
===================================================== */

function handleBLEDisconnect() {

    bleServer = null;

    rxCharacteristic = null;

    txCharacteristic = null;

    isConnected = false;

    isArmed = false;


    updateConnectionUI();

    resetARM();


    addLog(
        "BLE",
        "VAJRA connection lost"
    );

}


/* =====================================================
   SEND BLE COMMAND
===================================================== */

async function sendCommand(
    command
) {

    command =
        String(command)
            .trim()
            .toUpperCase();


    if (!rxCharacteristic) {

        addLog(
            "TX",
            command +
            " — NOT CONNECTED"
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


        addLog(
            "TX",
            command
        );


        return true;

    }
    catch(error) {

        addLog(
            "TX ERROR",
            error.message
        );

        return false;

    }

}


/* =====================================================
   TELEMETRY
===================================================== */

function handleTelemetry(
    event
) {

    const data =
        new TextDecoder()
            .decode(
                event.target.value
            )
            .trim();


    addLog(
        "RX",
        data
    );


    const rollMatch =
        data.match(
            /ROLL\s*[=:]\s*(-?\d+(?:\.\d+)?)/i
        );


    const pitchMatch =
        data.match(
            /PITCH\s*[=:]\s*(-?\d+(?:\.\d+)?)/i
        );


    if (rollMatch) {

        document
            .getElementById(
                "telemetryRoll"
            )
            .textContent =
            Number(
                rollMatch[1]
            ).toFixed(2) +
            "°";

    }


    if (pitchMatch) {

        document
            .getElementById(
                "telemetryPitch"
            )
            .textContent =
            Number(
                pitchMatch[1]
            ).toFixed(2) +
            "°";

    }

}


/* =====================================================
   ARM
===================================================== */

document
    .getElementById(
        "armButton"
    )
    .addEventListener(
        "click",
        async function() {

            if (!isConnected) {

                alert(
                    "Connect VAJRA first."
                );

                return;

            }


            isArmed =
                !isArmed;


            if (isArmed) {

                await sendCommand(
                    "ARM"
                );


                this.textContent =
                    "ARMED";


                this.classList.add(
                    "armed"
                );


                document
                    .getElementById(
                        "remoteStatus"
                    )
                    .textContent =
                    "ARMED";


                document
                    .getElementById(
                        "remoteStatus"
                    )
                    .classList.add(
                        "armed"
                    );

            }
            else {

                await sendCommand(
                    "STOP"
                );


                resetARM();

            }

        }
    );


/* =====================================================
   RESET ARM
===================================================== */

function resetARM() {

    const button =
        document.getElementById(
            "armButton"
        );


    button.textContent =
        "ARM";


    button.classList.remove(
        "armed"
    );


    const remoteStatus =
        document.getElementById(
            "remoteStatus"
        );


    remoteStatus.classList.remove(
        "armed"
    );


    remoteStatus.textContent =
        isConnected
            ? "CONNECTED"
            : "DISCONNECTED";

}


/* =====================================================
   STOP BUTTON
===================================================== */

document
    .getElementById(
        "stopButton"
    )
    .addEventListener(
        "click",
        stopAll
    );


async function stopAll() {

    isArmed = false;


    await sendCommand(
        "STOP"
    );


    for (
        let i = 1;
        i <= 4;
        i++
    ) {

        updateMotorUI(
            "M" + i,
            false,
            900
        );

    }


    resetARM();


    addLog(
        "STOP",
        "STOP sent - all motors = 900 µs"
    );

}


/* =====================================================
   MOTOR START
===================================================== */

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
                        button.dataset.motor;

                    motorOn(
                        motor
                    );

                }
            );

        }
    );


/* =====================================================
   MOTOR STOP
===================================================== */

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
                        button.dataset.motor;

                    motorOff(
                        motor
                    );

                }
            );

        }
    );


/* =====================================================
   MOTOR ON
===================================================== */

async function motorOn(
    motor
) {

    if (!isConnected) {

        alert(
            "Connect VAJRA first."
        );

        return;

    }


    await sendCommand(
        "SPEED 1100"
    );


    await sendCommand(
        motor + " ON"
    );


    updateMotorUI(
        motor,
        true,
        1100
    );

}


/* =====================================================
   MOTOR OFF
===================================================== */

async function motorOff(
    motor
) {

    await sendCommand(
        motor + " OFF"
    );


    updateMotorUI(
        motor,
        false,
        900
    );

}


/* =====================================================
   MOTOR UI
===================================================== */

function updateMotorUI(
    motor,
    running,
    speed
) {

    const number =
        motor.substring(1);


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


    if (running) {

        status.textContent =
            "ON";

        status.className =
            "motor-on";

        speedElement.textContent =
            speed +
            " µs";

    }
    else {

        status.textContent =
            "OFF";

        status.className =
            "motor-off";

        speedElement.textContent =
            "900 µs";

    }

}


/* =====================================================
   JOYSTICK VARIABLES
===================================================== */

let throttle = 0;

let yaw = 0;

let pitch = 0;

let roll = 0;

let lastJoystickSend = 0;


/* =====================================================
   JOYSTICK CLASS
===================================================== */

class VirtualJoystick {

    constructor(
        area,
        stick,
        callback
    ) {

        this.area = area;

        this.stick = stick;

        this.callback = callback;

        this.active = false;

        this.radius =
            area.clientWidth / 2 - 36;


        area.addEventListener(
            "pointerdown",
            (event) => {

                this.active = true;


                try {

                    area.setPointerCapture(
                        event.pointerId
                    );

                }
                catch(error) {

                    console.log(error);

                }


                this.move(
                    event
                );

            }
        );


        area.addEventListener(
            "pointermove",
            (event) => {

                if (
                    this.active
                ) {

                    this.move(
                        event
                    );

                }

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


        const distance =
            Math.sqrt(
                x * x +
                y * y
            );


        if (
            distance >
            this.radius
        ) {

            const scale =
                this.radius /
                distance;

            x *= scale;

            y *= scale;

        }


        const normalizedX =
            x /
            this.radius;


        const normalizedY =
            y /
            this.radius;


        this.stick.style.transform =
            "translate(" +
            "calc(-50% + " +
            x +
            "px), " +
            "calc(-50% + " +
            y +
            "px))";


        this.callback(
            normalizedX,
            normalizedY
        );

    }


    release() {

        if (!this.active) {

            return;

        }


        this.active = false;


        this.stick.style.transform =
            "translate(-50%, -50%)";


        this.callback(
            0,
            0
        );

    }

}


/* =====================================================
   LEFT JOYSTICK

   Y = THROTTLE
   X = YAW
===================================================== */

new VirtualJoystick(

    document.getElementById(
        "leftJoystick"
    ),

    document.getElementById(
        "leftStick"
    ),

    function(
        x,
        y
    ) {

        /*
           Center = throttle 50 in
           this UI representation.

           Later the flight firmware
           should map this to its safe
           throttle range.
        */

        throttle =
            Math.round(
                ((-y + 1) / 2) *
                100
            );


        yaw =
            Math.round(
                x * 100
            );


        document
            .getElementById(
                "throttleValue"
            )
            .textContent =
            throttle;


        document
            .getElementById(
                "yawValue"
            )
            .textContent =
            yaw;


        sendJoystick();

    }

);


/* =====================================================
   RIGHT JOYSTICK

   Y = PITCH
   X = ROLL
===================================================== */

new VirtualJoystick(

    document.getElementById(
        "rightJoystick"
    ),

    document.getElementById(
        "rightStick"
    ),

    function(
        x,
        y
    ) {

        roll =
            Math.round(
                x * 100
            );


        pitch =
            Math.round(
                -y * 100
            );


        document
            .getElementById(
                "rollValue"
            )
            .textContent =
            roll;


        document
            .getElementById(
                "pitchValue"
            )
            .textContent =
            pitch;


        sendJoystick();

    }

);


/* =====================================================
   SEND JOYSTICK DATA
===================================================== */

function sendJoystick() {

    if (!isConnected) {

        return;

    }


    if (!isArmed) {

        return;

    }


    const now =
        Date.now();


    /*
       12.5 packets/second maximum.
    */

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
        "JOYSTICK " +
        throttle +
        " " +
        yaw +
        " " +
        pitch +
        " " +
        roll;


    sendCommand(
        command
    );

}


/* =====================================================
   LOGGING
===================================================== */

function addLog(
    type,
    message
) {

    const logs =
        document.getElementById(
            "logs"
        );


    if (!logs) {

        return;

    }


    const entry =
        document.createElement(
            "div"
        );


    entry.className =
        "log-entry";


    const time =
        new Date()
            .toLocaleTimeString();


    entry.innerHTML =
        `
        <span>${time}</span>
        <strong>${type}</strong>
        ${escapeHTML(message)}
        `;


    logs.prepend(
        entry
    );

}


/* =====================================================
   SIMPLE HTML ESCAPE
===================================================== */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        async function() {

            await stopAll();

            disconnectBLE();


            dashboard.classList.add(
                "hidden"
            );


            loginPage.classList.remove(
                "hidden"
            );


            password.value = "";

        }
    );


/* =====================================================
   INITIAL STATE
===================================================== */

updateConnectionUI();

addLog(
    "SYSTEM",
    "VAJRA ready - disconnected"
);
