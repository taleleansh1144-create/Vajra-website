/* =====================================================
   ANSH'S DRONE VAJRA 🚁⚡
   REAL BLE + DUAL JOYSTICK CONTROLLER

   Browser:
   Chrome / Edge

   BLE:
   Service  = 6E400001-B5A3-F393-E0A9-E50E24DCCA9E
   RX       = 6E400002-B5A3-F393-E0A9-E50E24DCCA9E
   TX       = 6E400003-B5A3-F393-E0A9-E50E24DCCA9E
===================================================== */


/* =====================================================
   BLE UUID
===================================================== */

const SERVICE_UUID =
    "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";

const RX_UUID =
    "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";

const TX_UUID =
    "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";


/* =====================================================
   BLE VARIABLES
===================================================== */

let bleDevice = null;
let rxCharacteristic = null;
let txCharacteristic = null;

let bleConnected = false;


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

    if (
        username.value.trim() === "VAJRA" &&
        password.value === "VAJRA"
    ) {

        loginError.textContent = "";

        loginPage.classList.add("hidden");

        dashboard.classList.remove("hidden");

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
   LOGOUT
===================================================== */

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        function() {

            stopEverything();

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


                const target =
                    button.getAttribute(
                        "data-page"
                    );

                document
                    .getElementById(target)
                    .classList.add("active");

            }
        );

    });


/* =====================================================
   REAL BLE CONNECT
===================================================== */

document
    .getElementById("connectBtn")
    .addEventListener(
        "click",
        connectBLE
    );


async function connectBLE() {

    if (!navigator.bluetooth) {

        alert(
            "Web Bluetooth is not supported in this browser.\n\nUse Google Chrome or Microsoft Edge."
        );

        return;
    }


    try {

        addLog(
            "BLE",
            "Opening Bluetooth device chooser..."
        );


        /* ---------------------------------------------
           IMPORTANT:
           This opens the REAL Bluetooth chooser.
        --------------------------------------------- */

        bleDevice =
            await navigator.bluetooth.requestDevice({

                filters: [
                    {
                        name:
                            "ANSH'S DRONE VAJRA"
                    }
                ],

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        addLog(
            "BLE",
            "Selected " + bleDevice.name
        );


        bleDevice.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );


        /* Connect to GATT server */

        const server =
            await bleDevice.gatt.connect();


        addLog(
            "BLE",
            "GATT connected"
        );


        /* Find service */

        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        /* Find RX characteristic */

        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        /* Find TX characteristic */

        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        /* Start notifications */

        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            handleTelemetry
        );


        bleConnected = true;

        updateConnectionUI();


        addLog(
            "BLE",
            "VAJRA connected successfully"
        );


        /* Send initial STOP */

        sendCommand("STOP");

    }

    catch (error) {

        console.error(error);

        addLog(
            "BLE ERROR",
            error.message
        );

        bleConnected = false;

        updateConnectionUI();

    }

}


/* =====================================================
   DISCONNECT
===================================================== */

function disconnectBLE() {

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


    bleConnected = false;

    rxCharacteristic = null;

    txCharacteristic = null;

    updateConnectionUI();

}


function handleDisconnect() {

    bleConnected = false;

    rxCharacteristic = null;

    txCharacteristic = null;

    updateConnectionUI();

    addLog(
        "BLE",
        "VAJRA disconnected"
    );

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

    const button =
        document.getElementById(
            "connectBtn"
        );

    const telemetry =
        document.getElementById(
            "telemetryLink"
        );


    if (bleConnected) {

        dot.classList.add(
            "connected"
        );

        text.textContent =
            "CONNECTED";

        button.textContent =
            "DISCONNECT";

        telemetry.textContent =
            "ONLINE";


        button.onclick =
            disconnectBLE;

    } else {

        dot.classList.remove(
            "connected"
        );

        text.textContent =
            "DISCONNECTED";

        button.textContent =
            "CONNECT";

        telemetry.textContent =
            "OFFLINE";


        button.onclick =
            connectBLE;

    }

}


/* =====================================================
   SEND BLE COMMAND
===================================================== */

async function sendCommand(command) {

    command =
        command
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


        await rxCharacteristic
            .writeValue(data);


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
   TELEMETRY FROM FLIGHT CONTROLLER
===================================================== */

function handleTelemetry(event) {

    const decoder =
        new TextDecoder();


    const data =
        decoder.decode(
            event.target.value
        ).trim();


    console.log(
        "TELEMETRY:",
        data
    );


    addLog(
        "RX",
        data
    );


    /*
       Expected example:

       ROLL=2.30 PITCH=-1.20

       Adjust this parser later if your
       Flight controller sends a different
       telemetry format.
    */


    const rollMatch =
        data.match(
            /ROLL\s*[=:]\s*(-?\d+(\.\d+)?)/i
        );


    const pitchMatch =
        data.match(
            /PITCH\s*[=:]\s*(-?\d+(\.\d+)?)/i
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
                    "Connect VAJRA first."
                );

                return;

            }


            armed = !armed;


            if (armed) {

                /*
                   This sends a command to your
                   Main ESP32. Your Flight code
                   can decide how ARM should work.
                */

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
                    "DISARMED";


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
   BIG STOP
===================================================== */

document
    .getElementById("stopBtn")
    .addEventListener(
        "click",
        stopEverything
    );


async function stopEverything() {

    armed = false;


    /* STOP command */

    await sendCommand(
        "STOP"
    );


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


    document
        .getElementById(
            "remoteStatus"
        )
        .textContent =
        "DISARMED";


    document
        .getElementById(
            "remoteStatus"
        )
        .classList.remove(
            "armed"
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


    addLog(
        "STOP",
        "STOP sent — all motors = 900 µs"
    );

}


/* =====================================================
   MOTOR CONTROL
===================================================== */

const MOTOR_SPEED =
    1100;


async function motorOn(motor) {

    if (!bleConnected) {

        alert(
            "Connect VAJRA first."
        );

        return;

    }


    /*
       Send speed first.
    */

    await sendCommand(
        "SPEED " + MOTOR_SPEED
    );


    await sendCommand(
        motor + " ON"
    );


    updateMotorUI(
        motor,
        true,
        MOTOR_SPEED
    );

}


async function motorOff(motor) {

    await sendCommand(
        motor + " OFF"
    );


    updateMotorUI(
        motor,
        false,
        900
    );

}


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

        this.area.setPointerCapture(
            event.pointerId
        );


        this.move(event);

    }


    move(event) {

        if (!this.active)
            return;


        const rect =
            this.area.getBoundingClientRect();


        let x =
            event.clientX -
            (rect.left + rect.width / 2);


        let y =
            event.clientY -
            (rect.top + rect.height / 2);


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
            `translate(calc(-50% + ${x}px),
                       calc(-50% + ${y}px))`;


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
   X = YAW
   Y = THROTTLE
===================================================== */

const leftJoystick =
    new VirtualJoystick(

        document.getElementById(
            "leftJoystick"
        ),

        document.getElementById(
            "leftStick"
        ),

        function(x, y) {

            /*
               Up = positive throttle.
               Down = zero throttle.
            */

            let throttle =
                Math.round(
                    ((-y + 1) / 2) * 100
                );


            /*
               Neutral = 0.
            */

            let yaw =
                Math.round(
                    x * 100
                );


            throttle =
                Math.max(
                    0,
                    Math.min(
                        100,
                        throttle
                    )
                );


            updateValue(
                "throttleValue",
                throttle
            );


            updateValue(
                "yawValue",
                yaw
            );


            sendFlightControl();

        }

    );


/* =====================================================
   RIGHT JOYSTICK
   X = ROLL
   Y = PITCH
===================================================== */

const rightJoystick =
    new VirtualJoystick(

        document.getElementById(
            "rightJoystick"
        ),

        document.getElementById(
            "rightStick"
        ),

        function(x, y) {

            let roll =
                Math.round(
                    x * 100
                );


            let pitch =
                Math.round(
                    -y * 100
                );


            updateValue(
                "rollValue",
                roll
            );


            updateValue(
                "pitchValue",
                pitch
            );


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


function updateValue(
    id,
    value
) {

    document
        .getElementById(id)
        .textContent =
        value;


    if (id === "throttleValue")
        throttle = value;

    if (id === "yawValue")
        yaw = value;

    if (id === "pitchValue")
        pitch = value;

    if (id === "rollValue")
        roll = value;

}


/* =====================================================
   SEND FLIGHT CONTROL
===================================================== */

let lastControlTime = 0;


function sendFlightControl() {

    /*
       Do not send joystick packets too quickly.
    */

    const now =
        Date.now();


    if (
        now -
        lastControlTime <
        80
    ) {

        return;

    }


    lastControlTime = now;


    /*
       Only send flight commands when armed.
    */

    if (!armed)
        return;


    /*
       Current command format:

       JOYSTICK T Y P R

       Example:

       JOYSTICK 35 -10 5 20

       T = throttle
       Y = yaw
       P = pitch
       R = roll

       Your Main/Flight firmware must
       implement this command before
       these joysticks can control the
       motors physically.
    */

    const command =
        `JOYSTICK ${throttle} ${yaw} ${pitch} ${roll}`;


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

    const container =
        document.getElementById(
            "logs"
        );


    if (!container)
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


    row.innerHTML = `
        <span>${time}</span>
        <strong>${type}</strong>
        ${message}
    `;


    container.prepend(
        row
    );

}


/* =====================================================
   INITIAL STATE
===================================================== */

updateConnectionUI();

addLog(
    "SYSTEM",
    "VAJRA ready"
);


/*
   Safety behavior:
   website starts disconnected,
   motors start OFF,
   joystick starts centered.
*/

console.log(
    "ANSH'S DRONE VAJRA controller loaded."
);
