/* =====================================================
   ANSH'S DRONE VAJRA 🚁⚡
   REAL WEB BLUETOOTH

   Browser:
   Google Chrome / Microsoft Edge

   IMPORTANT:
   This version uses acceptAllDevices:true
   so Chrome can show BLE devices available
   to the browser's Bluetooth chooser.
===================================================== */


/* =====================================================
   BLE UUIDs
===================================================== */

const SERVICE_UUID =
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

const RX_UUID =
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const TX_UUID =
    "6e400003-b5a3-f393-e0a9-e50e24dcca9e";


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
   ELEMENTS
===================================================== */

const loginPage =
    document.getElementById(
        "loginPage"
    );

const dashboard =
    document.getElementById(
        "dashboard"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const username =
    document.getElementById(
        "username"
    );

const password =
    document.getElementById(
        "password"
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
   CONNECT BUTTONS
===================================================== */

connectButton.addEventListener(
    "click",
    connectionButtonPressed
);


searchButton.addEventListener(
    "click",
    connectionButtonPressed
);


async function connectionButtonPressed() {

    if (isSearching) {

        return;

    }


    if (isConnected) {

        disconnectBluetooth();

    }
    else {

        await connectBluetooth();

    }

}


/* =====================================================
   CONNECT BLUETOOTH
===================================================== */

async function connectBluetooth() {

    /*
       Web Bluetooth support check.
    */

    if (
        !("bluetooth" in navigator)
    ) {

        alert(
            "Web Bluetooth is not available.\n\nUse Google Chrome or Microsoft Edge."
        );

        addLog(
            "BLE ERROR",
            "Web Bluetooth is unavailable."
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
        "Opening Bluetooth device chooser..."
    );


    try {

        /*
           IMPORTANT:

           acceptAllDevices:true

           Chrome will display the Bluetooth
           devices that can be selected by Web
           Bluetooth.

           We are NOT silently scanning Bluetooth.
        */

        bleDevice =
            await navigator.bluetooth.requestDevice(
                {
                    acceptAllDevices: true,

                    optionalServices: [
                        SERVICE_UUID
                    ]
                }
            );


        addLog(
            "BLE",
            "Selected: " +
            (
                bleDevice.name ||
                "Unknown device"
            )
        );


        bleDevice.addEventListener(
            "gattserverdisconnected",
            handleBluetoothDisconnect
        );


        document
            .getElementById(
                "largeConnectionText"
            )
            .textContent =
            "CONNECTING";


        document
            .getElementById(
                "deviceText"
            )
            .textContent =
            "Connecting to " +
            (
                bleDevice.name ||
                "selected device"
            ) +
            "...";


        /*
           Connect to GATT.
        */

        bleServer =
            await bleDevice.gatt.connect();


        addLog(
            "BLE",
            "GATT server connected."
        );


        /*
           Find the VAJRA BLE service.
        */

        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        /*
           Browser -> ESP32
        */

        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        /*
           ESP32 -> Browser
        */

        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        /*
           Enable telemetry notifications.
        */

        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            receiveTelemetry
        );


        isConnected = true;

        isSearching = false;


        updateConnectionUI();


        addLog(
            "BLE",
            "VAJRA connected successfully."
        );


        /*
           Safe initial command.
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

        bleServer = null;

        rxCharacteristic = null;

        txCharacteristic = null;


        if (
            error.name ===
            "NotFoundError"
        ) {

            addLog(
                "BLE",
                "No Bluetooth device selected."
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
            "SEARCHING BLUETOOTH";


        document
            .getElementById(
                "deviceText"
            )
            .textContent =
            "Choose a BLE device from Chrome's Bluetooth window.";

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

    const text =
        document.getElementById(
            "connectionText"
        );

    const topButton =
        document.getElementById(
            "connectButton"
        );

    const searchButtonElement =
        document.getElementById(
            "searchButton"
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


        text.textContent =
            "CONNECTED";


        topButton.textContent =
            "DISCONNECT";


        searchButtonElement.textContent =
            "DISCONNECT VAJRA";


        largeText.textContent =
            "DRONE CONNECTED";


        deviceText.textContent =
            bleDevice?.name ||
            "Bluetooth device connected";


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


        text.textContent =
            "DISCONNECTED";


        topButton.textContent =
            "CONNECT";


        searchButtonElement.textContent =
            "🔎 SEARCH BLUETOOTH";


        largeText.textContent =
            "DRONE NOT CONNECTED";


        deviceText.textContent =
            "Press SEARCH FOR BLUETOOTH";


        remoteStatus.textContent =
            "DISCONNECTED";


        telemetryBLE.textContent =
            "OFFLINE";

    }

}


/* =====================================================
   DISCONNECT
===================================================== */

async function disconnectBluetooth() {

    /*
       Stop command before disconnect.
    */

    if (
        rxCharacteristic
    ) {

        await sendCommand(
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


    resetArmUI();

    updateConnectionUI();


    addLog(
        "BLE",
        "VAJRA disconnected."
    );

}


/* =====================================================
   GATT DISCONNECTED
===================================================== */

function handleBluetoothDisconnect() {

    bleServer = null;

    rxCharacteristic = null;

    txCharacteristic = null;

    isConnected = false;

    isArmed = false;


    resetArmUI();

    updateConnectionUI();


    addLog(
        "BLE",
        "VAJRA connection lost."
    );

}


/* =====================================================
   SEND COMMAND
===================================================== */

async function sendCommand(
    command
) {

    if (
        !rxCharacteristic
    ) {

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


        /*
           writeValueWithResponse is supported
           by many BLE UART implementations.
        */

        if (
            rxCharacteristic.writeValueWithResponse
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


        addLog(
            "TX",
            command
        );


        return true;

    }
    catch(error) {

        console.error(error);


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

function receiveTelemetry(
    event
) {

    const data =
        new TextDecoder()
            .decode(
                event.target.value
            )
            .trim();


    console.log(
        "VAJRA RX:",
        data
    );


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


    if (
        rollMatch
    ) {

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


    if (
        pitchMatch
    ) {

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


                resetArmUI();

            }

        }
    );


/* =====================================================
   ARM RESET
===================================================== */

function resetArmUI() {

    const button =
        document.getElementById(
            "armButton"
        );


    button.textContent =
        "ARM";


    button.classList.remove(
        "armed"
    );


    const status =
        document.getElementById(
            "remoteStatus"
        );


    status.classList.remove(
        "armed"
    );


    status.textContent =
        isConnected
            ? "CONNECTED"
            : "DISCONNECTED";

}


/* =====================================================
   STOP
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


    /*
       Flight controller should interpret
       STOP as 900 us on all four motors.
    */

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


    resetArmUI();


    addLog(
        "STOP",
        "STOP sent — all motors = 900 µs"
    );

}


/* =====================================================
   MOTOR BUTTONS
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

                    motorOn(
                        button.dataset.motor
                    );

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

                    motorOff(
                        button.dataset.motor
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
        motor +
        " ON"
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
        motor +
        " OFF"
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
   JOYSTICK DATA
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
            `translate(
                calc(-50% + ${x}px),
                calc(-50% + ${y}px)
            )`;


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
            "translate(-50%,-50%)";


        this.callback(
            0,
            0
        );

    }

}


/* =====================================================
   LEFT JOYSTICK
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
   SEND JOYSTICK COMMAND
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
   LOG
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
   ESCAPE LOG TEXT
===================================================== */

function escapeHTML(
    text
) {

    return String(text)
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
   INITIAL STATE
===================================================== */

updateConnectionUI();

addLog(
    "SYSTEM",
    "VAJRA ready — Bluetooth disconnected."
);
