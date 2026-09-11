/* =====================================================
   ANSH'S DRONE VAJRA 🚁⚡
   REAL WEB BLUETOOTH CONTROL

   ESP32-C3 BLE UART

   SERVICE:
   6E400001-B5A3-F393-E0A9-E50E24DCCA9E

   RX:
   6E400002-B5A3-F393-E0A9-E50E24DCCA9E

   TX:
   6E400003-B5A3-F393-E0A9-E50E24DCCA9E
===================================================== */


/* =====================================================
   BLE UUIDS
===================================================== */

const SERVICE_UUID =
    "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";

const RX_UUID =
    "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";

const TX_UUID =
    "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";

const VAJRA_NAME =
    "ANSH'S DRONE VAJRA";


/* =====================================================
   BLE VARIABLES
===================================================== */

let bleDevice = null;
let rxCharacteristic = null;
let txCharacteristic = null;
let bleConnected = false;
let searching = false;


/* =====================================================
   LOGIN
===================================================== */

const loginPage =
    document.getElementById("loginPage");

const dashboard =
    document.getElementById("dashboard");

const loginBtn =
    document.getElementById("loginBtn");

const username =
    document.getElementById("username");

const password =
    document.getElementById("password");

const loginError =
    document.getElementById("loginError");


loginBtn.addEventListener(
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

    } else {

        loginError.textContent =
            "Invalid username or password.";

    }

}


/* =====================================================
   NAVIGATION
===================================================== */

document
    .querySelectorAll(".nav-button")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                document
                    .querySelectorAll(
                        ".nav-button"
                    )
                    .forEach(function(btn) {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(
                        ".content-page"
                    )
                    .forEach(function(page) {

                        page.classList.remove(
                            "active"
                        );

                    });


                const page =
                    button.getAttribute(
                        "data-page"
                    );


                document
                    .getElementById(page)
                    .classList.add(
                        "active"
                    );

            }
        );

    });


/* =====================================================
   CONNECT BUTTONS
===================================================== */

/*
   BOTH buttons call the SAME real BLE function.

   Top button:
   #connectBtn

   Big search button:
   #connectMainBtn
*/

document
    .getElementById("connectBtn")
    .addEventListener(
        "click",
        function() {

            if (bleConnected) {

                disconnectBLE();

            } else {

                connectBLE();

            }

        }
    );


document
    .getElementById("connectMainBtn")
    .addEventListener(
        "click",
        function() {

            if (bleConnected) {

                disconnectBLE();

            } else {

                connectBLE();

            }

        }
    );


/* =====================================================
   REAL BLE SEARCH + CONNECTION
===================================================== */

async function connectBLE() {

    if (searching) {
        return;
    }


    if (bleConnected) {
        return;
    }


    /*
       Check browser support.
    */

    if (!navigator.bluetooth) {

        alert(
            "Web Bluetooth is not available here.\n\nUse Google Chrome or Microsoft Edge and open the website over HTTPS or localhost."
        );

        addLog(
            "BLE ERROR",
            "Web Bluetooth is not supported."
        );

        return;
    }


    searching = true;

    setSearchingUI(true);


    addLog(
        "BLE",
        "Searching for ANSH'S DRONE VAJRA..."
    );


    try {

        /*
           REAL Bluetooth chooser.

           The browser should show a device
           selection window.
        */

        bleDevice =
            await navigator.bluetooth.requestDevice({

                filters: [

                    {
                        name: VAJRA_NAME
                    }

                ],

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        addLog(
            "BLE",
            "Device selected: " +
            bleDevice.name
        );


        /*
           Listen for disconnection.
        */

        bleDevice.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );


        /*
           Connect to GATT.
        */

        const server =
            await bleDevice.gatt.connect();


        addLog(
            "BLE",
            "Connecting to VAJRA..."
        );


        /*
           Find VAJRA service.
        */

        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        /*
           Find RX characteristic.
        */

        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        /*
           Find TX characteristic.
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
            handleTelemetry
        );


        bleConnected = true;

        searching = false;


        setSearchingUI(false);

        updateConnectionUI();


        addLog(
            "BLE",
            "VAJRA CONNECTED successfully"
        );


        /*
           Send safe STOP immediately.
        */

        await sendCommand(
            "STOP"
        );

    }

    catch (error) {

        console.error(
            "BLE ERROR:",
            error
        );


        searching = false;

        bleConnected = false;


        setSearchingUI(false);

        updateConnectionUI();


        /*
           User cancelled chooser.
        */

        if (
            error.name ===
            "NotFoundError"
        ) {

            addLog(
                "BLE",
                "Device search cancelled."
            );

        } else {

            addLog(
                "BLE ERROR",
                error.message
            );

        }

    }

}


/* =====================================================
   SEARCHING UI
===================================================== */

function setSearchingUI(isSearching) {

    const topButton =
        document.getElementById(
            "connectBtn"
        );

    const mainButton =
        document.getElementById(
            "connectMainBtn"
        );

    const bigText =
        document.getElementById(
            "bigConnectionText"
        );

    const deviceName =
        document.getElementById(
            "deviceName"
        );


    if (isSearching) {

        topButton.textContent =
            "SEARCHING...";

        topButton.classList.add(
            "searching"
        );

        topButton.disabled = true;


        mainButton.textContent =
            "🔎 SEARCHING FOR VAJRA...";

        mainButton.classList.add(
            "searching"
        );

        mainButton.disabled = true;


        bigText.textContent =
            "SEARCHING FOR VAJRA";


        deviceName.textContent =
            "Choose ANSH'S DRONE VAJRA from the Bluetooth window.";

    } else {

        topButton.disabled = false;

        mainButton.disabled = false;

        topButton.classList.remove(
            "searching"
        );

        mainButton.classList.remove(
            "searching"
        );

    }

}


/* =====================================================
   CONNECTION UI
===================================================== */

function updateConnectionUI() {

    const dot =
        document.getElementById(
            "connectionDot"
        );

    const text =
        document.getElementById(
            "connectionText"
        );

    const topButton =
        document.getElementById(
            "connectBtn"
        );

    const mainButton =
        document.getElementById(
            "connectMainBtn"
        );

    const bigDot =
        document.getElementById(
            "bigConnectionDot"
        );

    const bigText =
        document.getElementById(
            "bigConnectionText"
        );

    const deviceName =
        document.getElementById(
            "deviceName"
        );

    const remoteStatus =
        document.getElementById(
            "remoteStatus"
        );

    const telemetryLink =
        document.getElementById(
            "telemetryLink"
        );


    if (bleConnected) {

        dot.classList.add(
            "connected"
        );

        text.textContent =
            "CONNECTED";

        topButton.textContent =
            "DISCONNECT";


        bigDot.classList.add(
            "connected"
        );

        bigText.textContent =
            "DRONE CONNECTED";

        deviceName.textContent =
            bleDevice?.name ||
            VAJRA_NAME;


        mainButton.textContent =
            "DISCONNECT VAJRA";


        remoteStatus.textContent =
            "CONNECTED";


        telemetryLink.textContent =
            "ONLINE";

    } else {

        dot.classList.remove(
            "connected"
        );

        text.textContent =
            "DISCONNECTED";


        topButton.textContent =
            "CONNECT";


        bigDot.classList.remove(
            "connected"
        );

        bigText.textContent =
            "DRONE NOT CONNECTED";


        deviceName.textContent =
            "Press CONNECT to search for VAJRA";


        mainButton.textContent =
            "🔎 SEARCH FOR VAJRA";


        remoteStatus.textContent =
            "DISCONNECTED";


        telemetryLink.textContent =
            "OFFLINE";

    }

}


/* =====================================================
   DISCONNECT
===================================================== */

function disconnectBLE() {

    try {

        /*
           Safety command before disconnect.
        */

        if (rxCharacteristic) {

            sendCommand(
                "STOP"
            );

        }

    }

    catch (error) {

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

    catch (error) {

        console.log(error);

    }


    rxCharacteristic = null;

    txCharacteristic = null;

    bleConnected = false;

    searching = false;


    updateConnectionUI();

    addLog(
        "BLE",
        "VAJRA disconnected"
    );

}


/* =====================================================
   HANDLE DISCONNECT
===================================================== */

function handleDisconnect() {

    rxCharacteristic = null;

    txCharacteristic = null;

    bleConnected = false;


    updateConnectionUI();


    addLog(
        "BLE",
        "VAJRA connection lost"
    );

}


/* =====================================================
   SEND BLE COMMAND
===================================================== */

async function sendCommand(command) {

    command =
        String(command)
            .trim()
            .toUpperCase();


    if (!rxCharacteristic) {

        addLog(
            "COMMAND",
            command + " — not connected"
        );

        return false;
    }


    try {

        const encoder =
            new TextEncoder();


        const data =
            encoder.encode(
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

    catch (error) {

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

function handleTelemetry(event) {

    const decoder =
        new TextDecoder();


    const data =
        decoder.decode(
            event.target.value
        ).trim();


    console.log(
        "VAJRA RX:",
        data
    );


    /*
       Example:

       ROLL=2.30 PITCH=-1.20
    */

    const rollMatch =
        data.match(
            /ROLL\s*[=:]\s*(-?\d+(?:\.\d+)?)/i
        );


    const pitchMatch =
        data.match(
            /PITCH\s*[=:]\s*(-?\d+(?:\.\d+)?)/i
        );


    if (rollMatch) {

        const roll =
            Number(
                rollMatch[1]
            );


        document
            .getElementById(
                "telemetryRoll"
            )
            .textContent =
            roll.toFixed(2) + "°";

    }


    if (pitchMatch) {

        const pitch =
            Number(
                pitchMatch[1]
            );


        document
            .getElementById(
                "telemetryPitch"
            )
            .textContent =
            pitch.toFixed(2) + "°";

    }


    addLog(
        "RX",
        data
    );

}


/* =====================================================
   MOTOR STATE
===================================================== */

const motorState = {

    M1: false,
    M2: false,
    M3: false,
    M4: false

};


const MOTOR_SPEED = 1100;


/* =====================================================
   MOTOR ON
===================================================== */

async function motorOn(motor) {

    if (!bleConnected) {

        alert(
            "Connect ANSH'S DRONE VAJRA first."
        );

        return;

    }


    await sendCommand(
        "SPEED " + MOTOR_SPEED
    );


    await sendCommand(
        motor + " ON"
    );


    motorState[motor] = true;


    updateMotorUI(
        motor,
        true,
        MOTOR_SPEED
    );

}


/* =====================================================
   MOTOR OFF
===================================================== */

async function motorOff(motor) {

    await sendCommand(
        motor + " OFF"
    );


    motorState[motor] = false;


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
    isOn,
    speed
) {

    const number =
        motor.replace(
            "M",
            ""
        );


    const status =
        document.getElementById(
            "m" + number + "Status"
        );


    const speedElement =
        document.getElementById(
            "m" + number + "Speed"
        );


    if (isOn) {

        status.textContent =
            "ON";

        status.className =
            "motor-on";

        speedElement.textContent =
            speed + " µs";

    } else {

        status.textContent =
            "OFF";

        status.className =
            "motor-off";

        speedElement.textContent =
            "900 µs";

    }

}


/* =====================================================
   ARM
===================================================== */

let armed = false;


document
    .getElementById("armBtn")
    .addEventListener(
        "click",
        async function() {

            if (!bleConnected) {

                alert(
                    "Connect ANSH'S DRONE VAJRA first."
                );

                return;

            }


            armed = !armed;


            if (armed) {

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

            } else {

                await sendCommand(
                    "STOP"
                );


                this.textContent =
                    "ARM";

                this.classList.remove(
                    "armed"
                );


                document
                    .getElementById(
                        "remoteStatus"
                    )
                    .textContent =
                    "CONNECTED";


                document
                    .getElementById(
                        "remoteStatus"
                    )
                    .classList.remove(
                        "armed"
                    );

            }

        }
    );


/* =====================================================
   STOP
===================================================== */

document
    .getElementById("stopBtn")
    .addEventListener(
        "click",
        stopEverything
    );


async function stopEverything() {

    armed = false;


    /*
       STOP = 900 us on Flight controller.
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

        motorState[
            "M" + i
        ] = false;

    }


    document
        .getElementById(
            "armBtn"
        )
        .textContent =
        "ARM";


    document
        .getElementById(
            "armBtn"
        )
        .classList.remove(
            "armed"
        );


    if (bleConnected) {

        document
            .getElementById(
                "remoteStatus"
            )
            .textContent =
            "CONNECTED";

    } else {

        document
            .getElementById(
                "remoteStatus"
            )
            .textContent =
            "DISCONNECTED";

    }


    document
        .getElementById(
            "remoteStatus"
        )
        .classList.remove(
            "armed"
        );


    addLog(
        "STOP",
        "STOP sent — all motors = 900 µs"
    );

}


/* =====================================================
   DUAL JOYSTICK
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

        this.x = 0;

        this.y = 0;

        this.radius =
            area.clientWidth / 2 - 36;


        area.addEventListener(
            "pointerdown",
            this.start.bind(this)
        );


        window.addEventListener(
            "pointermove",
            this.move.bind(this)
        );


        window.addEventListener(
            "pointerup",
            this.end.bind(this)
        );

    }


    start(event) {

        this.active = true;

        this.move(event);

    }


    move(event) {

        if (!this.active)
            return;


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


        this.x =
            x / this.radius;


        this.y =
            y / this.radius;


        this.stick.style.transform =
            `translate(
                calc(-50% + ${x}px),
                calc(-50% + ${y}px)
            )`;


        this.callback(
            this.x,
            this.y
        );

    }


    end() {

        if (!this.active)
            return;


        this.active = false;


        this.x = 0;

        this.y = 0;


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
===================================================== */

new VirtualJoystick(

    document.getElementById(
        "leftJoystick"
    ),

    document.getElementById(
        "leftStick"
    ),

    function(x, y) {

        throttle =
            Math.round(
                ((-y + 1) / 2) * 100
            );


        yaw =
            Math.round(
                x * 100
            );


        updateJoystickValues();

        sendFlightControl();

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

    function(x, y) {

        roll =
            Math.round(
                x * 100
            );


        pitch =
            Math.round(
                -y * 100
            );


        updateJoystickValues();

        sendFlightControl();

    }

);


/* =====================================================
   JOYSTICK VALUES
===================================================== */

let throttle = 0;
let yaw = 0;
let pitch = 0;
let roll = 0;


function updateJoystickValues() {

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


    document
        .getElementById(
            "pitchValue"
        )
        .textContent =
        pitch;


    document
        .getElementById(
            "rollValue"
        )
        .textContent =
        roll;

}


/* =====================================================
   JOYSTICK TRANSMISSION
===================================================== */

let lastControlSent = 0;


function sendFlightControl() {

    if (!armed)
        return;


    if (!bleConnected)
        return;


    const now =
        Date.now();


    /*
       Limit the command rate.
    */

    if (
        now -
        lastControlSent <
        80
    ) {

        return;

    }


    lastControlSent = now;


    const command =
        `JOYSTICK ${throttle} ${yaw} ${pitch} ${roll}`;


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


    if (!logs)
        return;


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "log-row";


    const time =
        new Date()
            .toLocaleTimeString();


    row.innerHTML =
        `
        <span>${time}</span>
        <strong>${type}</strong>
        ${message}
        `;


    logs.prepend(
        row
    );

}


/* =====================================================
   LOGOUT
===================================================== */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async function() {

            await stopEverything();

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
   START STATE
===================================================== */

updateConnectionUI();

updateJoystickValues();

addLog(
    "SYSTEM",
    "VAJRA ready — disconnected"
);
