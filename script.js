/* =========================================================
   VAJRA DRONE CONTROL SYSTEM
   PAGE NAVIGATION + CONTROL + BLE
========================================================= */


/* =========================================================
   PAGE NAVIGATION
========================================================= */

const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page");

menuItems.forEach(button => {

    button.addEventListener("click", () => {

        const targetPage = button.dataset.page;


        // Remove active menu
        menuItems.forEach(item => {
            item.classList.remove("active");
        });


        // Activate clicked menu
        button.classList.add("active");


        // Hide all pages
        pages.forEach(page => {
            page.classList.remove("active-page");
        });


        // Show selected page
        const page = document.getElementById(targetPage);

        if (page) {
            page.classList.add("active-page");
        }

    });

});


/* =========================================================
   BLE SETTINGS
========================================================= */

let bluetoothDevice = null;
let bleCharacteristic = null;

const SERVICE_UUID =
    "4fafc201-1fb5-459e-8fcc-c5c9c331914b";

const CHARACTERISTIC_UUID =
    "beb5483e-36e1-4688-b7f5-ea07361b26a8";


/* =========================================================
   BLE CONNECT
========================================================= */

async function connectBLE() {

    try {

        if (!navigator.bluetooth) {

            alert(
                "Web Bluetooth is not supported in this browser.\n\n" +
                "Try Chrome or Edge on a supported device."
            );

            return;
        }


        bluetoothDevice =
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


        const server =
            await bluetoothDevice.gatt.connect();


        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        bleCharacteristic =
            await service.getCharacteristic(
                CHARACTERISTIC_UUID
            );


        document.getElementById(
            "bleStatus"
        ).textContent = "BLE CONNECTED";


        document.getElementById(
            "bleState"
        ).textContent = "CONNECTED";


        document.getElementById(
            "statusDot"
        ).classList.add("connected");


        addLog(
            "BLE connected to VAJRA-C3",
            "INFO"
        );


    } catch (error) {

        console.error(error);

        addLog(
            "BLE connection failed",
            "WARNING"
        );

    }

}


/* =========================================================
   SEND BLE COMMAND
========================================================= */

async function sendCommand(command) {

    console.log("VAJRA COMMAND:", command);


    addLog(
        "Command → " + command,
        "INFO"
    );


    if (!bleCharacteristic) {

        console.log(
            "BLE not connected — command displayed only."
        );

        return;
    }


    try {

        const encoder =
            new TextEncoder();

        await bleCharacteristic.writeValue(
            encoder.encode(command)
        );

    } catch (error) {

        console.error(error);

        addLog(
            "BLE command failed",
            "WARNING"
        );

    }

}


/* =========================================================
   ADD BLE CONNECT BUTTON
========================================================= */

const connectionBox =
    document.querySelector(".connection");

if (connectionBox) {

    connectionBox.style.cursor = "pointer";

    connectionBox.addEventListener(
        "click",
        connectBLE
    );

}


/* =========================================================
   ARM
========================================================= */

document
    .getElementById("armBtn")
    .addEventListener("click", () => {

        sendCommand("ARM");

        document
            .getElementById("armText")
            .textContent = "ARMED";

        document
            .querySelector(".green-dot")
            .style.background = "#00ff88";

    });


/* =========================================================
   DISARM
========================================================= */

document
    .getElementById("disarmBtn")
    .addEventListener("click", () => {

        sendCommand("DISARM");

        document
            .getElementById("armText")
            .textContent = "DISARMED";

        document
            .querySelector(".green-dot")
            .style.background = "#777";

    });


/* =========================================================
   EMERGENCY STOP
========================================================= */

document
    .getElementById("emergencyBtn")
    .addEventListener("click", () => {

        sendCommand("STOP");


        document
            .getElementById("armText")
            .textContent = "EMERGENCY STOP";


        document
            .querySelector(".green-dot")
            .style.background = "#ff1744";


        // Reset all sliders

        document
            .getElementById("allMotor")
            .value = 0;

        document
            .getElementById("allMotorValue")
            .textContent = 0;


        document
            .querySelectorAll(".motor-slider")
            .forEach(slider => {

                slider.value = 0;

                slider
                    .parentElement
                    .querySelector("strong")
                    .textContent = "0";

            });

    });


/* =========================================================
   ALL MOTOR CONTROL
========================================================= */

const allMotor =
    document.getElementById("allMotor");

const allMotorValue =
    document.getElementById("allMotorValue");


allMotor.addEventListener(
    "input",
    () => {

        const value =
            allMotor.value;


        allMotorValue.textContent =
            value;


        sendCommand(
            "ALL:" + value
        );


        document
            .getElementById("throttleValue")
            .textContent = value;


        document
            .getElementById("telemetryThrottle")
            .textContent = value;


        document
            .getElementById("throttleBar")
            .style.width =
                (value / 10) + "%";


        // Keep individual motor sliders synchronized

        document
            .querySelectorAll(".motor-slider")
            .forEach(slider => {

                slider.value = value;

                slider
                    .parentElement
                    .querySelector("strong")
                    .textContent = value;

            });

    }
);


/* =========================================================
   INDIVIDUAL MOTOR CONTROL
========================================================= */

const motorSliders =
    document.querySelectorAll(
        ".motor-slider"
    );


motorSliders.forEach(slider => {

    slider.addEventListener(
        "input",
        () => {

            const motor =
                slider.dataset.motor;

            const value =
                slider.value;


            slider
                .parentElement
                .querySelector("strong")
                .textContent =
                value;


            sendCommand(
                motor + ":" + value
            );

        }
    );

});


/* =========================================================
   RESET
========================================================= */

document
    .getElementById("resetBtn")
    .addEventListener("click", () => {

        allMotor.value = 0;

        allMotorValue.textContent = "0";


        motorSliders.forEach(slider => {

            slider.value = 0;

            slider
                .parentElement
                .querySelector("strong")
                .textContent = "0";

        });


        document
            .getElementById("throttleValue")
            .textContent = "0";


        document
            .getElementById("telemetryThrottle")
            .textContent = "0";


        document
            .getElementById("throttleBar")
            .style.width = "0%";


        sendCommand("STOP");


        addLog(
            "Control system reset",
            "INFO"
        );

    });


/* =========================================================
   LOG SYSTEM
========================================================= */

function addLog(message, level) {

    const logs =
        document.getElementById("logs");


    if (!logs) return;


    const now =
        new Date().toLocaleTimeString();


    const entry =
        document.createElement("div");


    entry.className =
        "log";


    if (level === "WARNING") {
        entry.classList.add("warning");
    }


    entry.innerHTML = `

        <span>${now}</span>

        <b>${level}</b>

        ${message}

    `;


    logs.appendChild(entry);


    logs.scrollTop =
        logs.scrollHeight;

}


/* =========================================================
   CLEAR LOGS
========================================================= */

document
    .getElementById("clearLogs")
    .addEventListener("click", () => {

        document
            .getElementById("logs")
            .innerHTML = "";

        addLog(
            "Logs cleared",
            "INFO"
        );

    });


/* =========================================================
   SAVE SETTINGS
========================================================= */

document
    .querySelector(".save-btn")
    .addEventListener("click", () => {

        addLog(
            "Settings saved",
            "INFO"
        );


        alert(
            "VAJRA settings saved successfully!"
        );

    });


/* =========================================================
   QUICK ACTIONS
========================================================= */

const quickButtons =
    document.querySelectorAll(
        ".quick-grid button"
    );


quickButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const action =
                button.innerText
                    .replace(/\n/g, " ");


            addLog(
                "Quick Action → " + action,
                "INFO"
            );

        }
    );

});


/* =========================================================
   INITIAL STATUS
========================================================= */

addLog(
    "VAJRA Control System initialized",
    "INFO"
);

addLog(
    "Waiting for BLE connection...",
    "INFO"
);

console.log(
    "⚡ VAJRA CONTROL SYSTEM READY"
);
