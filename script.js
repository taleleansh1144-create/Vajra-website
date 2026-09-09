/* =========================================================
   VAJRA WEB CONTROLLER
   ESP32-C3 BLE
   ========================================================= */


/* BLE UUIDs */

const SERVICE_UUID =
    "4fafc201-1fb5-459e-8fcc-c5c9c331914b";

const CHARACTERISTIC_UUID =
    "beb5483e-36e1-4688-b7f5-ea07361b26a8";


let device = null;
let characteristic = null;

let armed = false;


/* =========================================================
   LOGIN
   ========================================================= */

function login() {

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    const message =
        document.getElementById("loginMessage");


    if (username === "VAJRA" &&
        password === "VAJRA") {

        document
            .getElementById("loginPage")
            .classList.add("hidden");

        document
            .getElementById("controlPage")
            .classList.remove("hidden");

    } else {

        message.textContent =
            "INVALID VAJRA LOGIN";
    }
}


/* =========================================================
   BLE CONNECT
   ========================================================= */

async function connectBLE() {

    try {

        if (!navigator.bluetooth) {

            alert(
                "Web Bluetooth is not supported in this browser."
            );

            return;
        }


        setConnection(
            "CONNECTING...",
            false
        );


        device = await navigator.bluetooth.requestDevice({

            filters: [
                {
                    name: "VAJRA-C3"
                }
            ],

            optionalServices: [
                SERVICE_UUID
            ]

        });


        device.addEventListener(
            "gattserverdisconnected",
            disconnected
        );


        const server =
            await device.gatt.connect();


        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        characteristic =
            await service.getCharacteristic(
                CHARACTERISTIC_UUID
            );


        setConnection(
            "BLE CONNECTED",
            true
        );


        document.getElementById(
            "bleStatus"
        ).textContent = "ONLINE";


        document.getElementById(
            "mainStatus"
        ).textContent = "CONNECTED";


        alert(
            "VAJRA-C3 connected successfully!"
        );


    } catch (error) {

        console.error(error);

        setConnection(
            "BLE ERROR",
            false
        );
    }
}


/* =========================================================
   BLE DISCONNECT
   ========================================================= */

function disconnected() {

    characteristic = null;

    setConnection(
        "BLE DISCONNECTED",
        false
    );

    document.getElementById(
        "bleStatus"
    ).textContent = "OFFLINE";

    document.getElementById(
        "mainStatus"
    ).textContent = "WAITING";
}


/* =========================================================
   CONNECTION UI
   ========================================================= */

function setConnection(text, connected) {

    document.getElementById(
        "connectionText"
    ).textContent = text;

    const dot =
        document.getElementById(
            "connectionDot"
        );


    if (connected) {

        dot.style.background = "#00ff91";
        dot.style.boxShadow =
            "0 0 12px #00ff91";

    } else {

        dot.style.background = "#ff3d5c";
        dot.style.boxShadow =
            "0 0 12px #ff3d5c";
    }
}


/* =========================================================
   SEND BLE COMMAND
   ========================================================= */

async function sendCommand(command) {

    console.log(
        "VAJRA COMMAND:",
        command
    );


    if (!characteristic) {

        console.log(
            "BLE not connected"
        );

        return;
    }


    try {

        const encoder =
            new TextEncoder();

        await characteristic.writeValue(
            encoder.encode(command + "\n")
        );

    } catch (error) {

        console.error(
            "BLE SEND ERROR:",
            error
        );
    }
}


/* =========================================================
   ARM
   ========================================================= */

function armDrone() {

    armed = true;

    document.getElementById(
        "armedBadge"
    ).textContent = "ARMED";

    sendCommand("ARM");
}


/* =========================================================
   DISARM
   ========================================================= */

function disarmDrone() {

    armed = false;

    document.getElementById(
        "armedBadge"
    ).textContent = "DISARMED";

    sendCommand("DISARM");
}


/* =========================================================
   EMERGENCY STOP
   ========================================================= */

function emergencyStop() {

    armed = false;

    document.getElementById(
        "armedBadge"
    ).textContent = "DISARMED";

    resetAllControls();

    sendCommand("STOP");
}


/* =========================================================
   BUTTON COMMAND FIX
   ========================================================= */

const originalSendCommand = sendCommand;

function sendCommand(command) {

    console.log("COMMAND:", command);


    if (command === "ARM") {

        armed = true;

        document.getElementById(
            "armedBadge"
        ).textContent = "ARMED";
    }


    if (command === "DISARM" ||
        command === "STOP") {

        armed = false;

        document.getElementById(
            "armedBadge"
        ).textContent = "DISARMED";
    }


    if (!characteristic) {

        console.log(
            "BLE not connected:",
            command
        );

        return;
    }


    const encoder =
        new TextEncoder();


    characteristic.writeValue(
        encoder.encode(command + "\n")
    );
}


/* =========================================================
   ALL MOTOR
   ========================================================= */

function allMotorChanged(value) {

    document.getElementById(
        "allValue"
    ).textContent = value;


    for (let i = 1; i <= 4; i++) {

        document.getElementById(
            "m" + i
        ).value = value;

        document.getElementById(
            "m" + i + "Value"
        ).textContent = value;
    }


    sendCommand(
        "ALL:" + value
    );
}


/* =========================================================
   INDIVIDUAL MOTOR
   ========================================================= */

function motorChanged(
    motor,
    value
) {

    document.getElementById(
        "m" + motor + "Value"
    ).textContent = value;


    sendCommand(
        "M" + motor + ":" + value
    );
}


/* =========================================================
   RESET CONTROLS
   ========================================================= */

function resetAllControls() {

    document.getElementById(
        "allThrottle"
    ).value = 0;

    document.getElementById(
        "allValue"
    ).textContent = "0";


    for (let i = 1; i <= 4; i++) {

        document.getElementById(
            "m" + i
        ).value = 0;

        document.getElementById(
            "m" + i + "Value"
        ).textContent = "0";
    }


    throttle = 0;
    yaw = 0;
    pitch = 0;
    roll = 0;


    updateFlightValues();
}


/* =========================================================
   VIRTUAL JOYSTICKS
   ========================================================= */

let throttle = 0;
let yaw = 0;

let pitch = 0;
let roll = 0;


/* LEFT */

setupJoystick(
    "leftJoystick",
    "leftStick",
    function(x, y) {

        /*
           Left stick:
           Y = throttle
           X = yaw
        */

        yaw = Math.round(
            x * 1000
        );

        throttle = Math.round(
            ((1 - y) / 2) * 1000
        );


        throttle =
            Math.max(
                0,
                Math.min(1000, throttle)
            );


        sendFlightCommand();
    }
);


/* RIGHT */

setupJoystick(
    "rightJoystick",
    "rightStick",
    function(x, y) {

        /*
           Right stick:
           X = roll
           Y = pitch
        */

        roll = Math.round(
            x * 1000
        );

        pitch = Math.round(
            -y * 1000
        );


        sendFlightCommand();
    }
);


/* =========================================================
   JOYSTICK ENGINE
   ========================================================= */

function setupJoystick(
    areaId,
    stickId,
    callback
) {

    const area =
        document.getElementById(
            areaId
        );

    const stick =
        document.getElementById(
            stickId
        );


    let active = false;


    function move(clientX, clientY) {

        const rect =
            area.getBoundingClientRect();


        const centerX =
            rect.left +
            rect.width / 2;

        const centerY =
            rect.top +
            rect.height / 2;


        let dx =
            clientX - centerX;

        let dy =
            clientY - centerY;


        const radius =
            rect.width / 2;

        const max =
            radius * 0.58;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance > max) {

            dx =
                dx / distance * max;

            dy =
                dy / distance * max;
        }


        const percentX =
            dx / max;

        const percentY =
            dy / max;


        stick.style.transform =
            `translate(${dx}px, ${dy}px)`;


        callback(
            percentX,
            percentY
        );


        updateFlightValues();
    }


    function center() {

        stick.style.transform =
            "translate(0px, 0px)";

        callback(0, 0);

        updateFlightValues();
    }


    area.addEventListener(
        "pointerdown",
        function(event) {

            active = true;

            area.setPointerCapture(
                event.pointerId
            );

            move(
                event.clientX,
                event.clientY
            );
        }
    );


    area.addEventListener(
        "pointermove",
        function(event) {

            if (!active) return;

            move(
                event.clientX,
                event.clientY
            );
        }
    );


    area.addEventListener(
        "pointerup",
        function() {

            active = false;

            center();
        }
    );


    area.addEventListener(
        "pointercancel",
        function() {

            active = false;

            center();
        }
    );
}


/* =========================================================
   SEND FLIGHT COMMAND
   ========================================================= */

let lastFlightCommand = "";


function sendFlightCommand() {

    const command =
        "FLIGHT:" +
        "T=" + throttle +
        ",Y=" + yaw +
        ",P=" + pitch +
        ",R=" + roll;


    updateFlightValues();


    /*
       Reduce duplicate BLE packets.
    */

    if (command === lastFlightCommand) {
        return;
    }


    lastFlightCommand = command;


    sendCommand(command);
}


/* =========================================================
   VALUES
   ========================================================= */

function updateFlightValues() {

    document.getElementById(
        "throttleValue"
    ).textContent = throttle;

    document.getElementById(
        "yawValue"
    ).textContent = yaw;

    document.getElementById(
        "pitchValue"
    ).textContent = pitch;

    document.getElementById(
        "rollValue"
    ).textContent = roll;
}


/* =========================================================
   BUTTON OVERRIDES
   ========================================================= */

document.querySelector(
    ".arm-btn"
).onclick = function() {

    armDrone();
};


document.querySelector(
    ".disarm-btn"
).onclick = function() {

    disarmDrone();
};
