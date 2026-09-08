/* =========================================================
   VAJRA DRONE CONTROL SYSTEM
   Web Bluetooth + Motor Control Interface
========================================================= */


/* =========================================================
   SETTINGS
========================================================= */

const CORRECT_USERNAME = "VAJRA";

/*
   These UUIDs will be changed to exactly match
   the ESP32-C3 BLE firmware.
*/

const SERVICE_UUID =
    "0000ffe0-0000-1000-8000-00805f9b34fb";

const CHARACTERISTIC_UUID =
    "0000ffe1-0000-1000-8000-00805f9b34fb";


/* =========================================================
   BLUETOOTH VARIABLES
========================================================= */

let bluetoothDevice = null;
let bluetoothCharacteristic = null;


/* =========================================================
   MOTOR DATA
========================================================= */

let motorSpeeds = {
    1: 0,
    2: 0,
    3: 0,
    4: 0
};

let droneArmed = false;


/* =========================================================
   ELEMENTS
========================================================= */

const loginPage =
    document.getElementById("loginPage");

const controlPage =
    document.getElementById("controlPage");

const usernameInput =
    document.getElementById("username");

const loginBtn =
    document.getElementById("loginBtn");

const loginMessage =
    document.getElementById("loginMessage");

const connectBtn =
    document.getElementById("connectBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const connectionStatus =
    document.getElementById("connectionStatus");

const bluetoothStatus =
    document.getElementById("bluetoothStatus");

const fcStatus =
    document.getElementById("fcStatus");

const droneStatus =
    document.getElementById("droneStatus");

const masterSlider =
    document.getElementById("masterSlider");

const masterSpeedValue =
    document.getElementById("masterSpeedValue");

const masterSpeedText =
    document.getElementById("masterSpeedText");

const consoleBox =
    document.getElementById("console");


/* =========================================================
   LOGIN
========================================================= */

loginBtn.addEventListener("click", login);

usernameInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        login();
    }

});


function login() {

    const username =
        usernameInput.value.trim();

    if (username === CORRECT_USERNAME) {

        loginMessage.textContent =
            "LOGIN SUCCESSFUL";

        loginMessage.style.color =
            "#70df83";

        setTimeout(function() {

            loginPage.classList.remove("active");
            controlPage.classList.add("active");

        }, 500);

    }

    else {

        loginMessage.textContent =
            "INCORRECT USERNAME";

        loginMessage.style.color =
            "#ff7676";

    }

}


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn.addEventListener("click", function() {

    disconnectBluetooth();

    controlPage.classList.remove("active");
    loginPage.classList.add("active");

    usernameInput.value = "";
    loginMessage.textContent = "";

});


/* =========================================================
   BLUETOOTH CONNECT
========================================================= */

connectBtn.addEventListener(
    "click",
    connectBluetooth
);


async function connectBluetooth() {

    if (!navigator.bluetooth) {

        addConsole(
            "ERROR: Web Bluetooth is not supported by this browser."
        );

        return;
    }


    try {

        addConsole(
            "Searching for VAJRA Bluetooth device..."
        );


        bluetoothDevice =
            await navigator.bluetooth.requestDevice({

                filters: [
                    {
                        namePrefix: "VAJRA"
                    }
                ],

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        addConsole(
            "Device selected: " +
            bluetoothDevice.name
        );


        bluetoothDevice.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );


        const server =
            await bluetoothDevice.gatt.connect();


        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        bluetoothCharacteristic =
            await service.getCharacteristic(
                CHARACTERISTIC_UUID
            );


        setConnectedUI(true);


        addConsole(
            "Bluetooth connected successfully."
        );


    }

    catch (error) {

        addConsole(
            "Bluetooth error: " +
            error.message
        );

        setConnectedUI(false);

    }

}


/* =========================================================
   DISCONNECT
========================================================= */

function disconnectBluetooth() {

    if (
        bluetoothDevice &&
        bluetoothDevice.gatt.connected
    ) {

        bluetoothDevice.gatt.disconnect();

    }

    bluetoothDevice = null;
    bluetoothCharacteristic = null;

    setConnectedUI(false);

}


/* =========================================================
   DISCONNECT EVENT
========================================================= */

function handleDisconnect() {

    addConsole(
        "Bluetooth disconnected."
    );

    setConnectedUI(false);

}


/* =========================================================
   CONNECTION UI
========================================================= */

function setConnectedUI(connected) {

    if (connected) {

        connectionStatus.textContent =
            "● CONNECTED";

        connectionStatus.className =
            "status connected";

        bluetoothStatus.textContent =
            "Connected";

        fcStatus.textContent =
            "Connected";

        connectBtn.textContent =
            "DISCONNECT";

        connectBtn.onclick =
            disconnectBluetooth;

    }

    else {

        connectionStatus.textContent =
            "● DISCONNECTED";

        connectionStatus.className =
            "status disconnected";

        bluetoothStatus.textContent =
            "Disconnected";

        fcStatus.textContent =
            "Not Connected";

        connectBtn.textContent =
            "CONNECT BLUETOOTH";

        connectBtn.onclick =
            connectBluetooth;

    }

}


/* =========================================================
   SEND BLUETOOTH COMMAND
========================================================= */

async function sendCommand(command) {

    addConsole(
        "TX → " + command
    );


    if (!bluetoothCharacteristic) {

        addConsole(
            "Bluetooth not connected. Command not sent."
        );

        return;
    }


    try {

        const encoder =
            new TextEncoder();

        const data =
            encoder.encode(command + "\n");

        await bluetoothCharacteristic
            .writeValue(data);

    }

    catch (error) {

        addConsole(
            "TX ERROR → " +
            error.message
        );

    }

}


/* =========================================================
   ARM
========================================================= */

document
    .getElementById("armBtn")
    .addEventListener("click", function() {

        if (!bluetoothCharacteristic) {

            addConsole(
                "Connect to VAJRA before arming."
            );

            return;
        }


        sendCommand("ARM");

        droneArmed = true;

        droneStatus.textContent =
            "ARMED";

        addConsole(
            "VAJRA ARMED"
        );

    });


/* =========================================================
   DISARM
========================================================= */

document
    .getElementById("disarmBtn")
    .addEventListener("click", function() {

        sendCommand("DISARM");

        droneArmed = false;

        droneStatus.textContent =
            "DISARMED";

        setAllMotorsToZero();

        addConsole(
            "VAJRA DISARMED"
        );

    });


/* =========================================================
   EMERGENCY STOP
========================================================= */

document
    .getElementById("stopBtn")
    .addEventListener("click", function() {

        sendCommand("STOP");

        droneArmed = false;

        droneStatus.textContent =
            "DISARMED";

        setAllMotorsToZero();

        addConsole(
            "!!! EMERGENCY STOP !!!"
        );

    });


/* =========================================================
   MASTER SLIDER
========================================================= */

masterSlider.addEventListener(
    "input",
    function() {

        const speed =
            Number(masterSlider.value);

        masterSpeedValue.textContent =
            speed;

        masterSpeedText.textContent =
            speed + "%";

    }
);


/* =========================================================
   RUN ALL MOTORS
========================================================= */

document
    .getElementById("allMotorsBtn")
    .addEventListener("click", function() {

        if (!droneArmed) {

            addConsole(
                "ARM the system before running motors."
            );

            return;
        }


        const speed =
            Number(masterSlider.value);


        for (let motor = 1; motor <= 4; motor++) {

            motorSpeeds[motor] = speed;

            updateMotorDisplay(motor);

        }


        sendCommand(
            `ALL ${speed}`
        );


        addConsole(
            `All motors → ${speed}%`
        );

    });


/* =========================================================
   STOP ALL MOTORS
========================================================= */

document
    .getElementById("stopAllBtn")
    .addEventListener("click", function() {

        setAllMotorsToZero();

        sendCommand("ALL 0");

        addConsole(
            "All motors → 0%"
        );

    });


/* =========================================================
   INDIVIDUAL MOTOR SLIDERS
========================================================= */

for (let motor = 1; motor <= 4; motor++) {

    const slider =
        document.getElementById(
            `m${motor}Slider`
        );


    slider.addEventListener(
        "input",
        function() {

            const speed =
                Number(slider.value);

            motorSpeeds[motor] =
                speed;

            updateMotorDisplay(motor);

        }
    );

}


/* =========================================================
   MOTOR RUN BUTTONS
========================================================= */

document
    .querySelectorAll(".motor-run")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                if (!droneArmed) {

                    addConsole(
                        "ARM the system first."
                    );

                    return;
                }


                const motor =
                    Number(
                        button.dataset.motor
                    );


                const speed =
                    motorSpeeds[motor];


                sendCommand(
                    `M${motor} ${speed}`
                );


                addConsole(
                    `Motor ${motor} → ${speed}%`
                );

            }
        );

    });


/* =========================================================
   MOTOR STOP BUTTONS
========================================================= */

document
    .querySelectorAll(".motor-stop")
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                const motor =
                    Number(
                        button.dataset.motor
                    );


                motorSpeeds[motor] = 0;

                updateMotorDisplay(motor);


                sendCommand(
                    `M${motor} 0`
                );


                addConsole(
                    `Motor ${motor} → 0%`
                );

            }
        );

    });


/* =========================================================
   UPDATE MOTOR DISPLAY
========================================================= */

function updateMotorDisplay(motor) {

    const speed =
        motorSpeeds[motor];


    document.getElementById(
        `m${motor}Value`
    ).textContent = speed;


    document.getElementById(
        `m${motor}Slider`
    ).value = speed;

}


/* =========================================================
   SET ALL MOTORS ZERO
========================================================= */

function setAllMotorsToZero() {

    for (let motor = 1; motor <= 4; motor++) {

        motorSpeeds[motor] = 0;

        updateMotorDisplay(motor);

    }


    masterSlider.value = 0;

    masterSpeedValue.textContent = 0;
    masterSpeedText.textContent = "0%";

}


/* =========================================================
   CALIBRATE ALL
========================================================= */

document
    .getElementById("calibrateBtn")
    .addEventListener("click", function() {

        sendCommand("CALIBRATE_ALL");

        addConsole(
            "Calibration command sent."
        );

    });


/* =========================================================
   INDIVIDUAL CALIBRATION
========================================================= */

for (let motor = 1; motor <= 4; motor++) {

    document
        .getElementById(
            `calibrateM${motor}`
        )
        .addEventListener(
            "click",
            function() {

                sendCommand(
                    `CALIBRATE_M${motor}`
                );

                addConsole(
                    `Calibration → M${motor}`
                );

            }
        );

}


/* =========================================================
   CLEAR CONSOLE
========================================================= */

document
    .getElementById("clearConsoleBtn")
    .addEventListener("click", function() {

        consoleBox.innerHTML = "";

    });


/* =========================================================
   CONSOLE
========================================================= */

function addConsole(message) {

    const line =
        document.createElement("div");

    const time =
        new Date().toLocaleTimeString();

    line.textContent =
        `[${time}] ${message}`;

    consoleBox.appendChild(line);

    consoleBox.scrollTop =
        consoleBox.scrollHeight;

}


/* =========================================================
   INITIAL STATE
========================================================= */

setAllMotorsToZero();

addConsole(
    "VAJRA website initialized."
);

addConsole(
    "Login username: VAJRA"
);

addConsole(
    "Bluetooth interface ready."
);