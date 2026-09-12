/* =========================================================
   VAJRA GROUND CONTROL
   BLE + UI
   ========================================================= */


/* ================= BLE CONFIG ================= */

const DEVICE_NAME = "ANSH'S DRONE VAJRA";

const SERVICE_UUID =
    "12345678-1234-1234-1234-1234567890ab";

const RX_UUID =
    "12345678-1234-1234-1234-1234567890ac";

const TX_UUID =
    "12345678-1234-1234-1234-1234567890ad";


let device = null;
let server = null;
let service = null;

let rxCharacteristic = null;
let txCharacteristic = null;

let connected = false;
let armed = false;

let motorLimit = 1200;


/* ================= LOGIN ================= */

function login() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    const error =
        document.getElementById("loginError");


    if (username === "VAJRA" && password === "VAJRA") {

        error.textContent = "";

        document.getElementById("loginScreen")
            .classList.add("hidden");

        document.getElementById("app")
            .classList.remove("hidden");

        addLog("VAJRA CONTROL SYSTEM INITIALIZED", "success");

    } else {

        error.textContent =
            "INVALID VAJRA CREDENTIALS";

    }
}


/* ================= NAVIGATION ================= */

function showPage(page, button) {

    document.querySelectorAll(".page")
        .forEach(p => p.classList.remove("active-page"));

    document.querySelectorAll(".nav-button")
        .forEach(b => b.classList.remove("active"));

    document.getElementById(page + "Page")
        .classList.add("active-page");

    if (button) {
        button.classList.add("active");
    }
}


/* ================= BLE ================= */

async function connectBLE() {

    try {

        addLog("SEARCHING FOR VAJRA BLE...");

        device = await navigator.bluetooth.requestDevice({

            filters: [
                {
                    name: DEVICE_NAME
                }
            ],

            optionalServices: [
                SERVICE_UUID
            ]

        });


        addLog("DEVICE FOUND: " + device.name, "success");


        device.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );


        server = await device.gatt.connect();

        addLog("GATT CONNECTED", "success");


        service =
            await server.getPrimaryService(SERVICE_UUID);

        addLog("SERVICE FOUND", "success");


        rxCharacteristic =
            await service.getCharacteristic(RX_UUID);

        addLog("RX FOUND", "success");


        txCharacteristic =
            await service.getCharacteristic(TX_UUID);

        addLog("TX FOUND", "success");


        await txCharacteristic.startNotifications();

        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            handleTelemetry
        );


        connected = true;

        updateConnectionUI();

        addLog("VAJRA CONNECTED", "success");

    }

    catch (error) {

        console.error(error);

        addLog(
            "BLE ERROR: " + error.message,
            "error"
        );

        connected = false;

        updateConnectionUI();
    }
}


/* ================= DISCONNECT ================= */

function handleDisconnect() {

    connected = false;

    updateConnectionUI();

    addLog(
        "VAJRA BLE DISCONNECTED",
        "error"
    );

    emergencyStopLocal();
}


/* ================= CONNECTION UI ================= */

function updateConnectionUI() {

    const dot =
        document.getElementById("bleDot");

    const text =
        document.getElementById("connectionText");

    const deviceText =
        document.getElementById("deviceText");

    const button =
        document.getElementById("connectBtn");

    const bottom =
        document.getElementById("bottomBle");


    if (connected) {

        dot.classList.remove("disconnected");

        text.textContent =
            "CONNECTED";

        deviceText.textContent =
            DEVICE_NAME;

        button.textContent =
            "CONNECTED";

        bottom.textContent =
            "ONLINE";

    } else {

        dot.classList.add("disconnected");

        text.textContent =
            "DISCONNECTED";

        deviceText.textContent =
            "BLE LINK OFFLINE";

        button.textContent =
            "CONNECT VAJRA";

        bottom.textContent =
            "OFFLINE";
    }
}


/* ================= SEND BLE ================= */

async function sendCommand(command) {

    if (!connected || !rxCharacteristic) {

        addLog(
            "COMMAND BLOCKED — BLE OFFLINE",
            "error"
        );

        return false;
    }


    try {

        const message =
            command.endsWith("\n")
                ? command
                : command + "\n";


        const data =
            new TextEncoder().encode(message);


        await rxCharacteristic.writeValue(data);


        addLog(
            "TX → " + command.replace("\n", "")
        );


        return true;

    }

    catch (error) {

        addLog(
            "TX ERROR: " + error.message,
            "error"
        );

        return false;
    }
}


/* ================= ARM ================= */

async function toggleArm() {

    if (!armed) {

        const ok =
            await sendCommand("VAJRA:START");

        if (!ok) return;


        armed = true;

        document.getElementById("armText")
            .textContent = "ARMED";

        document.getElementById("armIndicator")
            .classList.add("armed");

        document.getElementById("armButton")
            .textContent = "DISARM VAJRA";

        document.getElementById("bottomStatus")
            .textContent = "ARMED";


        addLog(
            "VAJRA ARMED — MOTORS READY",
            "success"
        );

    } else {

        await sendCommand("VAJRA:STOP");

        armed = false;

        document.getElementById("armText")
            .textContent = "DISARMED";

        document.getElementById("armIndicator")
            .classList.remove("armed");

        document.getElementById("armButton")
            .textContent = "ARM VAJRA";

        document.getElementById("bottomStatus")
            .textContent = "READY";


        resetJoystick();

        addLog(
            "VAJRA DISARMED",
            "success"
        );
    }
}


/* ================= EMERGENCY STOP ================= */

async function emergencyStop() {

    await sendCommand("VAJRA:STOP");

    emergencyStopLocal();

    addLog(
        "!!! EMERGENCY STOP !!!",
        "error"
    );
}


function emergencyStopLocal() {

    armed = false;

    document.getElementById("armText")
        .textContent = "DISARMED";

    document.getElementById("armIndicator")
        .classList.remove("armed");

    document.getElementById("armButton")
        .textContent = "ARM VAJRA";

    document.getElementById("bottomMotors")
        .textContent = "STOPPED";

    resetJoystick();

    updateMotor(1, 900);
    updateMotor(2, 900);
    updateMotor(3, 900);
    updateMotor(4, 900);
}


/* ================= MOTOR COMMAND ================= */

async function motorCommand(number, action) {

    if (action === "START") {

        await sendCommand(
            `VAJRA:M${number} START`
        );

    } else {

        await sendCommand(
            `VAJRA:M${number} STOP`
        );
    }
}


/* ================= JOYSTICK ================= */

const joystick =
    document.getElementById("joystick");

const joystickRing =
    document.querySelector(".joystick-ring");


let dragging = false;

let joyThrottle = 0;
let joyYaw = 0;
let joyPitch = 0;
let joyRoll = 0;


function getJoystickCenter() {

    const rect =
        joystickRing.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        radius: rect.width * 0.34
    };
}


function moveJoystick(clientX, clientY) {

    const center =
        getJoystickCenter();


    let dx =
        clientX - center.x;

    let dy =
        clientY - center.y;


    const distance =
        Math.sqrt(dx * dx + dy * dy);


    if (distance > center.radius) {

        dx =
            dx / distance * center.radius;

        dy =
            dy / distance * center.radius;
    }


    joystick.style.transform =
        `translate(${dx}px, ${dy}px)`;


    joyRoll =
        Math.round(
            (dx / center.radius) * 100
        );


    joyPitch =
        Math.round(
            (-dy / center.radius) * 100
        );


    document.getElementById("rollJoyValue")
        .textContent = joyRoll + "%";

    document.getElementById("pitchJoyValue")
        .textContent = joyPitch + "%";


    document.getElementById("joyState")
        .textContent = "ACTIVE";


    sendJoystick();
}


function resetJoystick() {

    joystick.style.transform =
        "translate(0px, 0px)";


    joyThrottle = 0;
    joyYaw = 0;
    joyPitch = 0;
    joyRoll = 0;


    document.getElementById("throttleValue")
        .textContent = "0%";

    document.getElementById("yawJoyValue")
        .textContent = "0%";

    document.getElementById("pitchJoyValue")
        .textContent = "0%";

    document.getElementById("rollJoyValue")
        .textContent = "0%";

    document.getElementById("joyState")
        .textContent = "READY";
}


/*
   Your existing VAJRA joystick protocol:
   VAJRA:JOY,throttle,yaw,pitch,roll
*/

function sendJoystick() {

    if (!connected || !armed) return;


    const command =
        `VAJRA:JOY,${joyThrottle},${joyYaw},${joyPitch},${joyRoll}`;


    sendCommand(command);
}


/* ================= POINTER CONTROL ================= */

joystick.addEventListener(
    "pointerdown",
    event => {

        dragging = true;

        joystick.setPointerCapture(
            event.pointerId
        );

        moveJoystick(
            event.clientX,
            event.clientY
        );
    }
);


joystick.addEventListener(
    "pointermove",
    event => {

        if (!dragging) return;

        moveJoystick(
            event.clientX,
            event.clientY
        );
    }
);


joystick.addEventListener(
    "pointerup",
    event => {

        dragging = false;

        resetJoystick();
    }
);


joystick.addEventListener(
    "pointercancel",
    () => {

        dragging = false;

        resetJoystick();
    }
);


/* ================= TELEMETRY ================= */

function handleTelemetry(event) {

    try {

        const text =
            new TextDecoder().decode(
                event.target.value
            ).trim();


        addLog(
            "RX ← " + text
        );


        if (!text.startsWith("TEL,")) {
            return;
        }


        const data =
            text.substring(4).split(",");


        if (data.length < 18) {
            return;
        }


        const roll =
            parseFloat(data[0]) || 0;

        const pitch =
            parseFloat(data[1]) || 0;

        const gx =
            parseFloat(data[2]) || 0;

        const gy =
            parseFloat(data[3]) || 0;

        const gz =
            parseFloat(data[4]) || 0;


        updateTelemetry(
            roll,
            pitch,
            gx,
            gy,
            gz
        );


        updateMotor(
            1,
            parseFloat(data[5]) || 900
        );

        updateMotor(
            2,
            parseFloat(data[6]) || 900
        );

        updateMotor(
            3,
            parseFloat(data[7]) || 900
        );

        updateMotor(
            4,
            parseFloat(data[8]) || 900
        );


        setText("rollP", data[9]);
        setText("rollI", data[10]);
        setText("rollD", data[11]);
        setText("rollPID", data[12]);

        setText("pitchP", data[13]);
        setText("pitchI", data[14]);
        setText("pitchD", data[15]);
        setText("pitchPID", data[16]);

    }

    catch (error) {

        console.error(
            "Telemetry error:",
            error
        );
    }
}


/* ================= UPDATE TELEMETRY ================= */

function updateTelemetry(
    roll,
    pitch,
    gx,
    gy,
    gz
) {

    setText(
        "rollValue",
        roll.toFixed(2) + "°"
    );

    setText(
        "pitchValue",
        pitch.toFixed(2) + "°"
    );


    setText(
        "telRoll",
        roll.toFixed(2) + "°"
    );

    setText(
        "telPitch",
        pitch.toFixed(2) + "°"
    );


    setText(
        "telGX",
        gx.toFixed(2)
    );

    setText(
        "telGY",
        gy.toFixed(2)
    );

    setText(
        "telGZ",
        gz.toFixed(2)
    );


    /*
       Move the artificial horizon.
    */

    const sky =
        document.querySelector(".sky");

    const horizon =
        document.querySelector(".horizon");


    if (sky) {

        sky.style.transform =
            `rotate(${-roll}deg) translateY(${pitch * 2}px)`;
    }


    if (horizon) {

        horizon.style.transform =
            `rotate(${-roll}deg) translateY(${pitch * 2}px)`;
    }
}


/* ================= MOTOR UI ================= */

function updateMotor(number, value) {

    value =
        Math.round(value);


    setText(
        "m" + number + "Value",
        value
    );


    const bar =
        document.getElementById(
            "m" + number + "Bar"
        );


    /*
       900 = stopped
       1200 = current safe visual range
    */

    let percentage =
        ((value - 900) / (motorLimit - 900)) * 100;


    percentage =
        Math.max(
            0,
            Math.min(100, percentage)
        );


    if (bar) {

        bar.style.width =
            percentage + "%";
    }


    if (value > 900) {

        document.getElementById(
            "bottomMotors"
        ).textContent = "ACTIVE";

    } else {

        document.getElementById(
            "bottomMotors"
        ).textContent = "STOPPED";
    }
}


/* ================= SETTINGS ================= */

function updateLimit(value) {

    motorLimit =
        parseInt(value);


    setText(
        "limitValue",
        motorLimit + " µs"
    );
}


/* ================= LOGGING ================= */

function addLog(message, type = "") {

    const logs =
        document.getElementById("logs");


    if (!logs) return;


    const line =
        document.createElement("div");


    line.className =
        "log-line " + type;


    const now =
        new Date();


    const time =
        now.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );


    line.innerHTML =
        `<span class="time">[${time}]</span>${escapeHTML(message)}`;


    logs.prepend(line);


    while (logs.children.length > 100) {

        logs.removeChild(
            logs.lastChild
        );
    }
}


function clearLogs() {

    document.getElementById("logs")
        .innerHTML = "";

    addLog(
        "LOG BUFFER CLEARED",
        "success"
    );
}


/* ================= UTILITY ================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;
    }
}


function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ================= LOGOUT ================= */

function logout() {

    if (armed) {

        sendCommand(
            "VAJRA:STOP"
        );
    }


    armed = false;

    document.getElementById("app")
        .classList.add("hidden");

    document.getElementById("loginScreen")
        .classList.remove("hidden");

    document.getElementById("password")
        .value = "";

    resetJoystick();

    addLog(
        "VAJRA SYSTEM LOCKED"
    );
}


/* ================= STARTUP ================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateConnectionUI();

        resetJoystick();

        updateMotor(1, 900);
        updateMotor(2, 900);
        updateMotor(3, 900);
        updateMotor(4, 900);

        addLog(
            "VAJRA GROUND CONTROL READY",
            "success"
        );

        addLog(
            "BLE TARGET: " + DEVICE_NAME
        );

    }
);
