/* =====================================================
   VAJRA DRONE WEBSITE
   LOGIN + PAGES + JOYSTICKS + BLE
   ===================================================== */


/* ================= LOGIN ================= */

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");


function login() {

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username === "VAJRA" && password === "VAJRA") {

        loginError.textContent = "";

        loginScreen.classList.add("hidden");
        app.classList.remove("hidden");

        addLog("LOGIN SUCCESSFUL");
        addLog("VAJRA COMMAND CENTER OPENED");

    } else {

        loginError.textContent =
            "❌ WRONG USERNAME OR PASSWORD";

        passwordInput.value = "";
        passwordInput.focus();
    }
}


loginBtn.addEventListener("click", login);


/* ENTER KEY LOGIN */

usernameInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        passwordInput.focus();
    }

});


passwordInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        login();
    }

});


/* ================= LOGOUT ================= */

document.getElementById("logoutBtn")
    .addEventListener("click", function() {

        disconnectBluetooth();

        app.classList.add("hidden");
        loginScreen.classList.remove("hidden");

        usernameInput.value = "";
        passwordInput.value = "";

        addLog("USER LOGGED OUT");

    });


/* ================= PAGE NAVIGATION ================= */

const navButtons =
    document.querySelectorAll(".nav-btn");

const pages =
    document.querySelectorAll(".page");


navButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const target =
            button.getAttribute("data-page");

        pages.forEach(function(page) {
            page.classList.remove("active");
        });

        navButtons.forEach(function(btn) {
            btn.classList.remove("active");
        });

        document
            .getElementById(target)
            .classList.add("active");

        button.classList.add("active");

        addLog("OPENED " + target);

    });

});


/* =====================================================
   BLUETOOTH
   ===================================================== */

let bluetoothDevice = null;
let bluetoothServer = null;
let bluetoothCharacteristic = null;


/*
   These UUIDs must match your ESP32-C3 BLE code.
*/

const SERVICE_UUID =
    "12345678-1234-1234-1234-1234567890ab";

const CHARACTERISTIC_UUID =
    "12345678-1234-1234-1234-1234567890ac";


const connectBtn =
    document.getElementById("connectBtn");

const disconnectBtn =
    document.getElementById("disconnectBtn");

const bleLight =
    document.getElementById("bleLight");

const bleText =
    document.getElementById("bleText");

const bleDeviceName =
    document.getElementById("bleDeviceName");

const warningConnect =
    document.getElementById("warningConnect");


/* ================= BLE STATUS ================= */

function setConnected(name) {

    bleLight.classList.add("connected");

    bleText.textContent = "CONNECTED";

    bleDeviceName.textContent =
        name || "VAJRA";

    connectBtn.classList.add("hidden");

    disconnectBtn.classList.remove("hidden");

    warningConnect.textContent =
        "✓ VAJRA CONNECTED — CONTROLS ENABLED";

    warningConnect.style.color = "#00ff88";

    document.getElementById("bluetoothSetting")
        .textContent = "CONNECTED";

    document.getElementById("teleLink")
        .textContent = "ONLINE";

    addLog("BLUETOOTH CONNECTED");

}


function setDisconnected() {

    bleLight.classList.remove("connected");

    bleText.textContent = "DISCONNECTED";

    bleDeviceName.textContent =
        "No device connected";

    connectBtn.classList.remove("hidden");

    disconnectBtn.classList.add("hidden");

    warningConnect.textContent =
        "⚠ CONNECT VAJRA TO ENABLE FLIGHT CONTROLS";

    warningConnect.style.color = "#ffbf3f";

    document.getElementById("bluetoothSetting")
        .textContent = "DISCONNECTED";

    document.getElementById("teleLink")
        .textContent = "OFFLINE";

    addLog("BLUETOOTH DISCONNECTED");

}


/* ================= CONNECT ================= */

connectBtn.addEventListener("click", async function() {

    if (!navigator.bluetooth) {

        alert(
            "Web Bluetooth is not supported in this browser.\n\n" +
            "Use Google Chrome or Microsoft Edge."
        );

        addLog("WEB BLUETOOTH NOT SUPPORTED");

        return;
    }


    try {

        addLog("SEARCHING FOR VAJRA...");

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


        addLog(
            "DEVICE FOUND: " +
            (bluetoothDevice.name || "VAJRA")
        );


        bluetoothDevice.addEventListener(
            "gattserverdisconnected",
            function() {

                bluetoothCharacteristic = null;
                bluetoothServer = null;

                setDisconnected();

            }
        );


        bluetoothServer =
            await bluetoothDevice.gatt.connect();


        const service =
            await bluetoothServer.getPrimaryService(
                SERVICE_UUID
            );


        bluetoothCharacteristic =
            await service.getCharacteristic(
                CHARACTERISTIC_UUID
            );


        setConnected(
            bluetoothDevice.name
        );


    } catch (error) {

        console.error(error);

        addLog(
            "BLE ERROR: " +
            error.message
        );

        setDisconnected();

    }

});


/* ================= DISCONNECT ================= */

disconnectBtn.addEventListener(
    "click",
    disconnectBluetooth
);


function disconnectBluetooth() {

    if (
        bluetoothDevice &&
        bluetoothDevice.gatt &&
        bluetoothDevice.gatt.connected
    ) {

        bluetoothDevice.gatt.disconnect();

    }

    bluetoothDevice = null;
    bluetoothServer = null;
    bluetoothCharacteristic = null;

    setDisconnected();

}


/* ================= SEND BLE COMMAND ================= */

async function sendCommand(command) {

    if (!bluetoothCharacteristic) {

        addLog(
            "COMMAND BLOCKED: VAJRA NOT CONNECTED"
        );

        return;

    }

    try {

        const data =
            new TextEncoder().encode(command);

        await bluetoothCharacteristic.writeValue(data);

        addLog("TX → " + command);

    } catch (error) {

        addLog(
            "TX ERROR: " +
            error.message
        );

    }

}


/* =====================================================
   JOYSTICK
   ===================================================== */

class VirtualJoystick {

    constructor(baseId, stickId, callback) {

        this.base =
            document.getElementById(baseId);

        this.stick =
            document.getElementById(stickId);

        this.callback = callback;

        this.active = false;

        this.pointerId = null;

        this.x = 0;
        this.y = 0;


        this.base.addEventListener(
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

        window.addEventListener(
            "pointercancel",
            this.end.bind(this)
        );

    }


    start(event) {

        event.preventDefault();

        this.active = true;

        this.pointerId = event.pointerId;

        this.base.setPointerCapture(
            event.pointerId
        );

        this.update(event);

    }


    move(event) {

        if (
            !this.active ||
            event.pointerId !== this.pointerId
        ) {
            return;
        }

        this.update(event);

    }


    end(event) {

        if (
            !this.active ||
            event.pointerId !== this.pointerId
        ) {
            return;
        }

        this.active = false;

        this.pointerId = null;

        this.x = 0;
        this.y = 0;

        this.stick.style.left = "90px";
        this.stick.style.top = "90px";

        this.callback(0, 0);

    }


    update(event) {

        const rect =
            this.base.getBoundingClientRect();

        const centerX =
            rect.left + rect.width / 2;

        const centerY =
            rect.top + rect.height / 2;

        let x =
            event.clientX - centerX;

        let y =
            event.clientY - centerY;


        const radius =
            rect.width / 2 - 35;


        const distance =
            Math.sqrt(x * x + y * y);


        if (distance > radius) {

            x =
                x / distance * radius;

            y =
                y / distance * radius;

        }


        this.x = x / radius;
        this.y = y / radius;


        this.stick.style.left =
            (90 + x) + "px";

        this.stick.style.top =
            (90 + y) + "px";


        this.callback(
            this.x,
            this.y
        );

    }

}


/* =====================================================
   JOYSTICK VALUES
   ===================================================== */

let throttle = 0;
let yaw = 0;
let pitch = 0;
let roll = 0;


const throttleValue =
    document.getElementById("throttleValue");

const yawValue =
    document.getElementById("yawValue");

const pitchValue =
    document.getElementById("pitchValue");

const rollValue =
    document.getElementById("rollValue");


function updateLeft(x, y) {

    yaw =
        Math.round(x * 100);

    throttle =
        Math.round(-y * 100);


    throttleValue.textContent =
        throttle;

    yawValue.textContent =
        yaw;


    updateMotors();

    sendCommand(
        `JOY,${throttle},${yaw},${pitch},${roll}`
    );

}


function updateRight(x, y) {

    roll =
        Math.round(x * 100);

    pitch =
        Math.round(-y * 100);


    pitchValue.textContent =
        pitch;

    rollValue.textContent =
        roll;


    updateMotors();

    sendCommand(
        `JOY,${throttle},${yaw},${pitch},${roll}`
    );

}


new VirtualJoystick(
    "leftJoystick",
    "leftStick",
    updateLeft
);


new VirtualJoystick(
    "rightJoystick",
    "rightStick",
    updateRight
);


/* =====================================================
   MOTOR MIXING
   ===================================================== */

function updateMotors() {

    let m1 =
        throttle +
        pitch -
        roll +
        yaw;

    let m2 =
        throttle -
        pitch -
        roll -
        yaw;

    let m3 =
        throttle -
        pitch +
        roll +
        yaw;

    let m4 =
        throttle +
        pitch +
        roll -
        yaw;


    m1 = constrain(m1, 0, 100);
    m2 = constrain(m2, 0, 100);
    m3 = constrain(m3, 0, 100);
    m4 = constrain(m4, 0, 100);


    setMotor(
        1,
        m1
    );

    setMotor(
        2,
        m2
    );

    setMotor(
        3,
        m3
    );

    setMotor(
        4,
        m4
    );

}


function constrain(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


function setMotor(number, value) {

    document.getElementById(
        "m" + number + "Text"
    ).textContent =
        Math.round(value) + "%";


    document.getElementById(
        "m" + number + "Bar"
    ).style.width =
        value + "%";

}


/* =====================================================
   FLIGHT BUTTONS
   ===================================================== */

document.getElementById("armBtn")
    .addEventListener("click", function() {

        sendCommand("ARM");

    });


document.getElementById("takeoffBtn")
    .addEventListener("click", function() {

        sendCommand("TAKEOFF");

    });


document.getElementById("landBtn")
    .addEventListener("click", function() {

        sendCommand("LAND");

    });


document.getElementById("stopBtn")
    .addEventListener("click", function() {

        sendCommand("EMERGENCY");

        throttle = 0;
        yaw = 0;
        pitch = 0;
        roll = 0;

        updateMotors();

    });


/* =====================================================
   LOGGING
   ===================================================== */

const logContainer =
    document.getElementById("logContainer");


function addLog(message) {

    if (!logContainer) {
        return;
    }

    const time =
        new Date().toLocaleTimeString();


    const div =
        document.createElement("div");

    div.className = "log";

    div.innerHTML =
        `<span>[${time}]</span> ${message}`;


    logContainer.prepend(div);

}


document.getElementById("clearLogs")
    .addEventListener("click", function() {

        logContainer.innerHTML = "";

        addLog("LOGS CLEARED");

    });


/* =====================================================
   DEMO TELEMETRY
   ===================================================== */

setInterval(function() {

    const link =
        document.getElementById("teleLink").textContent;


    if (link === "ONLINE") {

        document.getElementById("speed")
            .textContent =
            Math.abs(throttle) + " km/h";

        document.getElementById("telePitch")
            .textContent =
            pitch + "°";

        document.getElementById("teleRoll")
            .textContent =
            roll + "°";

        document.getElementById("teleYaw")
            .textContent =
            yaw + "°";

    }

}, 500);


/* =====================================================
   INITIAL STATE
   ===================================================== */

setDisconnected();

addLog("VAJRA SYSTEM INITIALIZED");
addLog("LOGIN REQUIRED");
