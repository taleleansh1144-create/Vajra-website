/* ============================================================
   VAJRA DRONE CONTROL SYSTEM
   JAVASCRIPT + WEB BLUETOOTH
============================================================ */


/* ============================================================
   LOGIN
============================================================ */

function login() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;

    const message =
        document.getElementById("loginMessage");


    if (
        username === "VAJRA" &&
        password === "VAJRA"
    ) {

        message.textContent =
            "✓ LOGIN SUCCESSFUL";

        message.style.color =
            "#00ff9d";


        setTimeout(() => {

            document
                .getElementById("loginPage")
                .classList.add("hidden");

            document
                .getElementById("controlPage")
                .classList.remove("hidden");

        }, 500);

    }

    else {

        message.textContent =
            "✕ INVALID VAJRA CREDENTIALS";

        message.style.color =
            "#ff4165";

    }
}


/* ============================================================
   PASSWORD VISIBILITY
============================================================ */

function togglePassword() {

    const password =
        document.getElementById("password");

    if (password.type === "password") {

        password.type = "text";

    }

    else {

        password.type = "password";

    }
}


/* ============================================================
   BLE
============================================================ */

const SERVICE_UUID =
    "4fafc201-1fb5-459e-8fcc-c5c9c331914b";

const CHARACTERISTIC_UUID =
    "beb5483e-36e1-4688-b7f5-ea07361b26a8";


let bleDevice = null;

let bleCharacteristic = null;


/* ============================================================
   CONNECT BLE
============================================================ */

async function connectBLE() {

    if (!navigator.bluetooth) {

        alert(
            "Web Bluetooth is not supported in this browser."
        );

        return;
    }


    try {

        document.getElementById("bleButton")
            .textContent = "SEARCHING...";


        bleDevice =
            await navigator.bluetooth.requestDevice({

                filters: [
                    {
                        name: "VAJRA-C3"
                    }
                ],

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        bleDevice.addEventListener(
            "gattserverdisconnected",
            onBLEDisconnected
        );


        const server =
            await bleDevice.gatt.connect();


        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        bleCharacteristic =
            await service.getCharacteristic(
                CHARACTERISTIC_UUID
            );


        setBLEConnected(true);


    }

    catch (error) {

        console.error(error);

        setBLEConnected(false);

        document.getElementById("bleButton")
            .textContent = "CONNECT BLE";

    }
}


/* ============================================================
   BLE STATUS
============================================================ */

function setBLEConnected(connected) {

    const text =
        document.getElementById("bleText");

    const dot =
        document.getElementById("bleDot");

    const system =
        document.getElementById("systemBLE");

    const telemetry =
        document.getElementById("telemetryLink");

    const button =
        document.getElementById("bleButton");


    if (connected) {

        text.textContent =
            "BLE CONNECTED";

        dot.classList.remove("red");

        dot.classList.add("green");

        system.textContent =
            "CONNECTED";

        system.style.color =
            "#00ff9d";

        telemetry.textContent =
            "ONLINE";

        button.textContent =
            "CONNECTED";

    }

    else {

        text.textContent =
            "BLE DISCONNECTED";

        dot.classList.remove("green");

        dot.classList.add("red");

        system.textContent =
            "DISCONNECTED";

        telemetry.textContent =
            "OFFLINE";

        button.textContent =
            "CONNECT BLE";
    }
}


function onBLEDisconnected() {

    bleCharacteristic = null;

    setBLEConnected(false);

}


/* ============================================================
   SEND BLE COMMAND
============================================================ */

async function sendCommand(command) {

    console.log(
        "VAJRA COMMAND:",
        command
    );


    if (!bleCharacteristic) {

        console.log(
            "BLE not connected. Command not sent."
        );

        return;
    }


    try {

        const encoder =
            new TextEncoder();

        const data =
            encoder.encode(command + "\n");


        await bleCharacteristic.writeValue(
            data
        );

    }

    catch (error) {

        console.error(
            "BLE WRITE ERROR:",
            error
        );

    }
}


/* ============================================================
   ARM
============================================================ */

function armDrone() {

    sendCommand("ARM");


    document
        .getElementById("armIndicator")
        .classList.add("armed");


    document
        .getElementById("armText")
        .textContent = "ARMED";

}


/* ============================================================
   DISARM
============================================================ */

function disarmDrone() {

    sendCommand("DISARM");


    document
        .getElementById("armIndicator")
        .classList.remove("armed");


    document
        .getElementById("armText")
        .textContent = "DISARMED";


    resetMotorSliders();

}


/* ============================================================
   EMERGENCY STOP
============================================================ */

function emergencyStop() {

    sendCommand("STOP");


    document
        .getElementById("armIndicator")
        .classList.remove("armed");


    document
        .getElementById("armText")
        .textContent = "DISARMED";


    resetMotorSliders();

}


/* ============================================================
   ALL MOTOR
============================================================ */

function allMotorChanged() {

    const value =
        Number(
            document.getElementById("allMotor").value
        );


    document.getElementById("allMotorValue")
        .textContent = value;


    for (let i = 1; i <= 4; i++) {

        document.getElementById(
            "motor" + i
        ).value = value;

        document.getElementById(
            "m" + i + "Value"
        ).textContent = value;

        updateRPM(i, value);
    }


    sendCommand(
        "ALL:" + value
    );
}


/* ============================================================
   INDIVIDUAL MOTOR
============================================================ */

function motorChanged(number) {

    const value =
        Number(
            document.getElementById(
                "motor" + number
            ).value
        );


    document.getElementById(
        "m" + number + "Value"
    ).textContent = value;


    updateRPM(
        number,
        value
    );


    sendCommand(
        "M" + number + ":" + value
    );
}


/* ============================================================
   RPM DISPLAY
============================================================ */

function updateRPM(
    number,
    value
) {

    document.getElementById(
        "rpm" + number
    ).textContent =
        value;
}


/* ============================================================
   RESET MOTOR SLIDERS
============================================================ */

function resetMotorSliders() {

    document.getElementById(
        "allMotor"
    ).value = 0;

    document.getElementById(
        "allMotorValue"
    ).textContent = 0;


    for (let i = 1; i <= 4; i++) {

        document.getElementById(
            "motor" + i
        ).value = 0;

        document.getElementById(
            "m" + i + "Value"
        ).textContent = 0;

        updateRPM(i, 0);

    }
}


/* ============================================================
   RESET PANEL
============================================================ */

function resetPanel() {

    sendCommand("DISARM");

    resetMotorSliders();


    document.getElementById(
        "armIndicator"
    ).classList.remove("armed");


    document.getElementById(
        "armText"
    ).textContent =
        "DISARMED";


    setStickPosition(
        document.getElementById("leftKnob"),
        0,
        0
    );

    setStickPosition(
        document.getElementById("rightKnob"),
        0,
        0
    );


    updateFlightValues(
        0,
        0,
        0,
        0
    );
}


/* ============================================================
   QUICK ACTIONS
============================================================ */

function quickAction(action) {

    console.log(
        "QUICK ACTION:",
        action
    );


    sendCommand(
        action
    );

}


/* ============================================================
   FLIGHT VALUES
============================================================ */

function updateFlightValues(
    throttle,
    yaw,
    pitch,
    roll
) {

    document.getElementById(
        "throttleValue"
    ).textContent =
        Math.round(throttle);


    document.getElementById(
        "yawValue"
    ).textContent =
        Math.round(yaw);


    document.getElementById(
        "pitchValue"
    ).textContent =
        Math.round(pitch);


    document.getElementById(
        "rollValue"
    ).textContent =
        Math.round(roll);


    document.getElementById(
        "throttleBar"
    ).style.width =
        Math.max(
            0,
            Math.min(
                100,
                throttle / 10
            )
        ) + "%";


    document.getElementById(
        "yawBar"
    ).style.width =
        Math.abs(yaw) / 10 + "%";


    document.getElementById(
        "pitchBar"
    ).style.width =
        Math.abs(pitch) / 10 + "%";


    document.getElementById(
        "rollBar"
    ).style.width =
        Math.abs(roll) / 10 + "%";
}


/* ============================================================
   JOYSTICK SYSTEM
============================================================ */

function setupJoystick(
    stickId,
    knobId,
    type
) {

    const stick =
        document.getElementById(stickId);

    const knob =
        document.getElementById(knobId);


    let active = false;


    function move(
        clientX,
        clientY
    ) {

        const rect =
            stick.getBoundingClientRect();


        let x =
            clientX -
            (rect.left + rect.width / 2);


        let y =
            clientY -
            (rect.top + rect.height / 2);


        const max =
            rect.width / 2 - 35;


        const distance =
            Math.sqrt(
                x * x + y * y
            );


        if (distance > max) {

            x =
                x / distance * max;

            y =
                y / distance * max;

        }


        knob.style.transform =
            `translate(
                calc(-50% + ${x}px),
                calc(-50% + ${y}px)
            )`;


        let horizontal =
            Math.round(
                (x / max) * 1000
            );


        let vertical =
            Math.round(
                (-y / max) * 1000
            );


        horizontal =
            Math.max(
                -1000,
                Math.min(
                    1000,
                    horizontal
                )
            );


        vertical =
            Math.max(
                -1000,
                Math.min(
                    1000,
                    vertical
                )
            );


        if (type === "left") {

            const throttle =
                Math.max(
                    0,
                    vertical
                );


            const yaw =
                horizontal;


            updateFlightValues(
                throttle,
                yaw,
                0,
                0
            );


            sendFlightCommand(
                throttle,
                yaw,
                0,
                0
            );

        }

        else {

            const pitch =
                vertical;

            const roll =
                horizontal;


            updateFlightValues(
                0,
                0,
                pitch,
                roll
            );


            sendFlightCommand(
                0,
                0,
                pitch,
                roll
            );
        }
    }


    function release() {

        active = false;


        setStickPosition(
            knob,
            0,
            0
        );


        if (type === "left") {

            sendFlightCommand(
                0,
                0,
                0,
                0
            );

        }

        else {

            sendFlightCommand(
                0,
                0,
                0,
                0
            );
        }

    }


    stick.addEventListener(
        "pointerdown",
        event => {

            active = true;

            stick.setPointerCapture(
                event.pointerId
            );

            move(
                event.clientX,
                event.clientY
            );
        }
    );


    stick.addEventListener(
        "pointermove",
        event => {

            if (!active)
                return;

            move(
                event.clientX,
                event.clientY
            );

        }
    );


    stick.addEventListener(
        "pointerup",
        release
    );


    stick.addEventListener(
        "pointercancel",
        release
    );
}


/* ============================================================
   STICK POSITION
============================================================ */

function setStickPosition(
    knob,
    x,
    y
) {

    knob.style.transform =
        `translate(
            calc(-50% + ${x}px),
            calc(-50% + ${y}px)
        )`;
}


/* ============================================================
   FLIGHT COMMAND
============================================================ */

function sendFlightCommand(
    throttle,
    yaw,
    pitch,
    roll
) {

    const command =
        `FLIGHT:T=${Math.round(throttle)},Y=${Math.round(yaw)},P=${Math.round(pitch)},R=${Math.round(roll)}`;


    sendCommand(command);
}


/* ============================================================
   START JOYSTICKS
============================================================ */

setupJoystick(
    "leftStick",
    "leftKnob",
    "left"
);


setupJoystick(
    "rightStick",
    "rightKnob",
    "right"
);


/* ============================================================
   INITIAL STATE
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateFlightValues(
            0,
            0,
            0,
            0
        );

        resetMotorSliders();

    }
);
