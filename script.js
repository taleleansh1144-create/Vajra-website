/* =========================================================
   ANSH'S DRONE VAJRA 🚁⚡
   COMPLETE WEB BLUETOOTH CONTROL
   ========================================================= */

/* =========================================================
   BLE UUIDs
   ========================================================= */

const SERVICE_UUID =
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

const RX_UUID =
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const TX_UUID =
    "6e400003-b5a3-f393-e0a9-e50e24dcca9e";


/* =========================================================
   BLE VARIABLES
   ========================================================= */

let bleDevice = null;
let bleServer = null;
let rxCharacteristic = null;
let txCharacteristic = null;

let isConnected = false;
let isSearching = false;
let isArmed = false;


/* =========================================================
   JOYSTICK VARIABLES
   ========================================================= */

let throttle = 0;
let yaw = 0;
let pitch = 0;
let roll = 0;

let lastJoystickSend = 0;


/* =========================================================
   HTML ELEMENTS
   ========================================================= */

const loginPage =
    document.getElementById("loginPage");

const dashboard =
    document.getElementById("dashboard");

const loginButton =
    document.getElementById("loginButton");

const username =
    document.getElementById("username");

const password =
    document.getElementById("password");

const loginError =
    document.getElementById("loginError");

const connectButton =
    document.getElementById("connectButton");

const searchButton =
    document.getElementById("searchButton");

const disconnectButton =
    document.getElementById("disconnectButton");

const logoutButton =
    document.getElementById("logoutButton");


/* =========================================================
   SAFE ELEMENT HELPER
   ========================================================= */

function el(id) {
    return document.getElementById(id);
}


/* =========================================================
   LOGIN
   ========================================================= */

if (loginButton) {

    loginButton.addEventListener(
        "click",
        login
    );

}

if (password) {

    password.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {
                login();
            }

        }
    );

}


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


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            await disconnectBluetooth();

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


/* =========================================================
   NAVIGATION
   ========================================================= */

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


                    const target =
                        el(
                            button.dataset.page
                        );

                    if (target) {

                        target.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );


/* =========================================================
   CONNECT BUTTONS
   ========================================================= */

if (connectButton) {

    connectButton.addEventListener(
        "click",
        connectionButtonPressed
    );

}

if (searchButton) {

    searchButton.addEventListener(
        "click",
        connectionButtonPressed
    );

}


/* =========================================================
   CONNECT / DISCONNECT BUTTON
   ========================================================= */

async function connectionButtonPressed() {

    if (isSearching) {
        return;
    }

    if (isConnected) {

        await disconnectBluetooth();

    }
    else {

        await connectBluetooth();

    }

}


/* =========================================================
   BLUETOOTH CONNECT
   ========================================================= */

async function connectBluetooth() {

    if (
        !navigator.bluetooth
    ) {

        alert(
            "Web Bluetooth is not available.\n\n" +
            "Use Google Chrome or Microsoft Edge."
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

    setSearchingUI(true);


    addLog(
        "BLE",
        "Opening Bluetooth device chooser..."
    );


    try {

        /* ---------------------------------------------
           IMPORTANT:
           We use acceptAllDevices because the ESP32
           name is ANSH'S DRONE VAJRA.
           --------------------------------------------- */

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


        if (el("largeConnectionText")) {

            el(
                "largeConnectionText"
            ).textContent =
                "CONNECTING";

        }


        if (el("deviceText")) {

            el(
                "deviceText"
            ).textContent =
                "Connecting to " +
                (
                    bleDevice.name ||
                    "selected device"
                ) +
                "...";

        }


        /* ---------------------------------------------
           CONNECT TO GATT
           --------------------------------------------- */

        bleServer =
            await bleDevice.gatt.connect();


        addLog(
            "BLE",
            "GATT server connected."
        );


        /* ---------------------------------------------
           GET SERVICE
           --------------------------------------------- */

        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        addLog(
            "BLE",
            "VAJRA service found."
        );


        /* ---------------------------------------------
           RX
           WEBSITE -> ESP32
           --------------------------------------------- */

        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        addLog(
            "BLE",
            "Command channel ready."
        );


        /* ---------------------------------------------
           TX
           ESP32 -> WEBSITE
           --------------------------------------------- */

        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        /* ---------------------------------------------
           ENABLE NOTIFICATIONS
           --------------------------------------------- */

        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            receiveTelemetry
        );


        /* ---------------------------------------------
           CONNECTED
           --------------------------------------------- */

        isConnected = true;
        isSearching = false;

        updateConnectionUI();


        addLog(
            "BLE",
            "VAJRA connected successfully."
        );


        /* ---------------------------------------------
           SAFE INITIAL STOP
           --------------------------------------------- */

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


    setSearchingUI(false);

    updateConnectionUI();

}


/* =========================================================
   SEARCHING UI
   ========================================================= */

function setSearchingUI(
    searching
) {

    if (!connectButton) {
        return;
    }


    if (searching) {

        connectButton.disabled =
            true;

        if (searchButton) {
            searchButton.disabled =
                true;
        }


        connectButton.textContent =
            "SEARCHING...";


        if (searchButton) {

            searchButton.textContent =
                "🔎 SEARCHING...";

        }


        if (el("connectionText")) {

            el(
                "connectionText"
            ).textContent =
                "SEARCHING...";

        }


        if (el("largeConnectionText")) {

            el(
                "largeConnectionText"
            ).textContent =
                "SEARCHING BLUETOOTH";

        }


        if (el("deviceText")) {

            el(
                "deviceText"
            ).textContent =
                "Choose VAJRA from Chrome's Bluetooth window.";

        }

    }
    else {

        connectButton.disabled =
            false;

        if (searchButton) {

            searchButton.disabled =
                false;

        }

    }

}


/* =========================================================
   CONNECTION UI
   ========================================================= */

function updateConnectionUI() {

    const topDot =
        el("connectionDot");

    const largeDot =
        el("largeConnectionDot");

    const text =
        el("connectionText");

    const topButton =
        el("connectButton");

    const search =
        el("searchButton");

    const largeText =
        el("largeConnectionText");

    const deviceText =
        el("deviceText");

    const remoteStatus =
        el("remoteStatus");

    const telemetryBLE =
        el("telemetryBLE");


    if (isConnected) {

        if (topDot) {
            topDot.classList.add(
                "connected"
            );
        }

        if (largeDot) {
            largeDot.classList.add(
                "connected"
            );
        }


        if (text) {
            text.textContent =
                "CONNECTED";
        }


        if (topButton) {
            topButton.textContent =
                "DISCONNECT";
        }


        if (search) {
            search.textContent =
                "DISCONNECT VAJRA";
        }


        if (largeText) {
            largeText.textContent =
                "DRONE CONNECTED";
        }


        if (deviceText) {

            deviceText.textContent =
                bleDevice?.name ||
                "Bluetooth device connected";

        }


        if (remoteStatus) {

            remoteStatus.textContent =
                isArmed
                    ? "ARMED"
                    : "CONNECTED";

        }


        if (telemetryBLE) {

            telemetryBLE.textContent =
                "ONLINE";

        }

    }
    else {

        if (topDot) {
            topDot.classList.remove(
                "connected"
            );
        }

        if (largeDot) {
            largeDot.classList.remove(
                "connected"
            );
        }


        if (text) {

            text.textContent =
                "DISCONNECTED";

        }


        if (topButton) {

            topButton.textContent =
                "CONNECT";

        }


        if (search) {

            search.textContent =
                "🔎 SEARCH BLUETOOTH";

        }


        if (largeText) {

            largeText.textContent =
                "DRONE NOT CONNECTED";

        }


        if (deviceText) {

            deviceText.textContent =
                "Press SEARCH FOR BLUETOOTH";

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


/* =========================================================
   DISCONNECT
   ========================================================= */

async function disconnectBluetooth() {

    /* ---------------------------------------------
       Send STOP before disconnecting
       --------------------------------------------- */

    if (rxCharacteristic) {

        try {

            await sendCommand(
                "STOP"
            );

        }
        catch(error) {

            console.log(error);

        }

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


/* =========================================================
   GATT DISCONNECTED
   ========================================================= */

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


/* =========================================================
   SEND COMMAND
   ========================================================= */

async function sendCommand(
    command
) {

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


        console.log(
            "VAJRA TX:",
            command
        );


        addLog(
            "TX",
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
            "TX ERROR",
            error.message
        );


        return false;

    }

}


/* =========================================================
   TELEMETRY
   ========================================================= */

function receiveTelemetry(
    event
) {

    const data =
        new TextDecoder()
            .decode(
                event.target.value
            )
            .trim();


    if (!data) {
        return;
    }


    console.log(
        "VAJRA RX:",
        data
    );


    addLog(
        "RX",
        data
    );


    /* ---------------------------------------------
       ROLL
       --------------------------------------------- */

    const rollMatch =
        data.match(
            /ROLL\s*[=:]\s*(-?\d+(?:\.\d+)?)/i
        );


    if (rollMatch) {

        const value =
            Number(
                rollMatch[1]
            );


        if (el("telemetryRoll")) {

            el(
                "telemetryRoll"
            ).textContent =
                value.toFixed(2) +
                "°";

        }

    }


    /* ---------------------------------------------
       PITCH
       --------------------------------------------- */

    const pitchMatch =
        data.match(
            /PITCH\s*[=:]\s*(-?\d+(?:\.\d+)?)/i
        );


    if (pitchMatch) {

        const value =
            Number(
                pitchMatch[1]
            );


        if (el("telemetryPitch")) {

            el(
                "telemetryPitch"
            ).textContent =
                value.toFixed(2) +
                "°";

        }

    }

}


/* =========================================================
   ARM BUTTON
   ========================================================= */

if (el("armButton")) {

    el(
        "armButton"
    ).addEventListener(
        "click",
        async function() {

            if (!isConnected) {

                alert(
                    "Connect VAJRA first."
                );

                return;

            }


            if (!isArmed) {

                /*
                   ARM is only the software arm state.
                   Flight controller receives ARM.
                */

                const success =
                    await sendCommand(
                        "ARM"
                    );


                if (!success) {
                    return;
                }


                isArmed = true;


                this.textContent =
                    "ARMED";

                this.classList.add(
                    "armed"
                );


                if (el("remoteStatus")) {

                    el(
                        "remoteStatus"
                    ).textContent =
                        "ARMED";

                    el(
                        "remoteStatus"
                    ).classList.add(
                        "armed"
                    );

                }


                addLog(
                    "ARM",
                    "VAJRA armed"
                );

            }
            else {

                await stopAll();

            }

        }
    );

}


/* =========================================================
   RESET ARM UI
   ========================================================= */

function resetArmUI() {

    const button =
        el("armButton");

    if (button) {

        button.textContent =
            "ARM";

        button.classList.remove(
            "armed"
        );

    }


    const status =
        el("remoteStatus");

    if (status) {

        status.classList.remove(
            "armed"
        );

        status.textContent =
            isConnected
                ? "CONNECTED"
                : "DISCONNECTED";

    }

}


/* =========================================================
   STOP BUTTON
   ========================================================= */

if (el("stopButton")) {

    el(
        "stopButton"
    ).addEventListener(
        "click",
        stopAll
    );

}


/* =========================================================
   STOP ALL MOTORS
   ========================================================= */

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


    resetArmUI();


    addLog(
        "STOP",
        "STOP sent — all motors = 900 µs"
    );

}


/* =========================================================
   MOTOR START BUTTONS
   ========================================================= */

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


/* =========================================================
   MOTOR STOP BUTTONS
   ========================================================= */

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


/* =========================================================
   MOTOR START
   ========================================================= */

async function motorOn(
    motor
) {

    if (!isConnected) {

        alert(
            "Connect VAJRA first."
        );

        return;

    }


    /*
       IMPORTANT:
       Send only the motor command.

       M1 START
       M2 START
       M3 START
       M4 START
    */

    const success =
        await sendCommand(
            motor + " START"
        );


    if (!success) {
        return;
    }


    updateMotorUI(
        motor,
        true,
        2000
    );


    addLog(
        "MOTOR",
        motor +
        " START → 2000 µs"
    );

}


/* =========================================================
   MOTOR STOP
   ========================================================= */

async function motorOff(
    motor
) {

    if (!isConnected) {

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


    updateMotorUI(
        motor,
        false,
        900
    );


    addLog(
        "MOTOR",
        motor +
        " STOP → 900 µs"
    );

}


/* =========================================================
   MOTOR UI
   ========================================================= */

function updateMotorUI(
    motor,
    running,
    speed
) {

    const number =
        motor.substring(1);


    const status =
        el(
            "m" +
            number +
            "Status"
        );


    const speedElement =
        el(
            "m" +
            number +
            "Speed"
        );


    if (!status || !speedElement) {
        return;
    }


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


/* =========================================================
   JOYSTICK VARIABLES
   ========================================================= */

throttle = 0;
yaw = 0;
pitch = 0;
roll = 0;


/* =========================================================
   VIRTUAL JOYSTICK
   ========================================================= */

class VirtualJoystick {

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

        this.radius =
            Math.max(
                20,
                area.clientWidth / 2 - 36
            );


        /* -----------------------------------------
           POINTER DOWN
           ----------------------------------------- */

        area.addEventListener(
            "pointerdown",
            (event) => {

                this.active =
                    true;

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


        /* -----------------------------------------
           POINTER MOVE
           ----------------------------------------- */

        area.addEventListener(
            "pointermove",
            (event) => {

                if (!this.active) {
                    return;
                }

                this.move(
                    event
                );

            }
        );


        /* -----------------------------------------
           POINTER UP
           ----------------------------------------- */

        area.addEventListener(
            "pointerup",
            () => {

                this.release();

            }
        );


        /* -----------------------------------------
           POINTER CANCEL
           ----------------------------------------- */

        area.addEventListener(
            "pointercancel",
            () => {

                this.release();

            }
        );


        area.addEventListener(
            "lostpointercapture",
            () => {

                this.release();

            }
        );

    }


    /* =============================================
       MOVE
       ============================================= */

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


        /* -----------------------------------------
           MOVE VISUAL STICK
           ----------------------------------------- */

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


    /* =============================================
       RELEASE
       ============================================= */

    release() {

        if (!this.active) {
            return;
        }


        this.active =
            false;


        this.stick.style.transform =
            "translate(-50%,-50%)";


        /*
           Center joystick sends zero yaw/pitch/roll.
           Throttle returns to zero.
        */

        this.callback(
            0,
            0
        );

    }

}


/* =========================================================
   LEFT JOYSTICK
   THROTTLE + YAW
   ========================================================= */

const leftJoystick =
    el("leftJoystick");

const leftStick =
    el("leftStick");


if (
    leftJoystick &&
    leftStick
) {

    new VirtualJoystick(
        leftJoystick,
        leftStick,

        function(
            x,
            y
        ) {

            /*
               Up = higher throttle
               Down = lower throttle
            */

            throttle =
                Math.round(
                    ((-y + 1) / 2) *
                    100
                );


            /*
               Left / right = yaw
            */

            yaw =
                Math.round(
                    x * 100
                );


            if (el("throttleValue")) {

                el(
                    "throttleValue"
                ).textContent =
                    throttle;

            }


            if (el("yawValue")) {

                el(
                    "yawValue"
                ).textContent =
                    yaw;

            }


            sendJoystick();

        }
    );

}


/* =========================================================
   RIGHT JOYSTICK
   PITCH + ROLL
   ========================================================= */

const rightJoystick =
    el("rightJoystick");

const rightStick =
    el("rightStick");


if (
    rightJoystick &&
    rightStick
) {

    new VirtualJoystick(
        rightJoystick,
        rightStick,

        function(
            x,
            y
        ) {

            /*
               Left / right = roll
            */

            roll =
                Math.round(
                    x * 100
                );


            /*
               Up / down = pitch
            */

            pitch =
                Math.round(
                    -y * 100
                );


            if (el("rollValue")) {

                el(
                    "rollValue"
                ).textContent =
                    roll;

            }


            if (el("pitchValue")) {

                el(
                    "pitchValue"
                ).textContent =
                    pitch;

            }


            sendJoystick();

        }
    );

}


/* =========================================================
   SEND JOYSTICK
   ========================================================= */

function sendJoystick() {

    if (!isConnected) {
        return;
    }


    /*
       IMPORTANT:
       Joystick is allowed only when ARM is active.
    */

    if (!isArmed) {
        return;
    }


    const now =
        Date.now();


    /*
       Send approximately every 80 ms.
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


    /*
       THIS MUST MATCH FLIGHT CONTROLLER:

       JOY,THROTTLE,YAW,PITCH,ROLL
    */

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


/* =========================================================
   LOG
   ========================================================= */

function addLog(
    type,
    message
) {

    const logs =
        el("logs");


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
        <strong>${escapeHTML(type)}</strong>
        ${escapeHTML(message)}
        `;


    logs.prepend(
        entry
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

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


/* =========================================================
   INITIAL STATE
   ========================================================= */

updateConnectionUI();

addLog(
    "SYSTEM",
    "VAJRA ready — Bluetooth disconnected."
);
