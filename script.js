/* =====================================================
   VAJRA WEBSITE JAVASCRIPT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       ELEMENTS
    ================================================= */

    const loginScreen = document.getElementById("loginScreen");
    const dashboard = document.getElementById("dashboard");

    const username = document.getElementById("username");
    const password = document.getElementById("password");

    const loginBtn = document.getElementById("loginBtn");
    const loginMessage = document.getElementById("loginMessage");

    const logoutBtn = document.getElementById("logoutBtn");

    const navButtons = document.querySelectorAll(".nav-btn");
    const pages = document.querySelectorAll(".page");

    const bleButton = document.getElementById("bleConnectBtn");
    const bleStatus = document.getElementById("bleStatus");

    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const allMotorStop = document.getElementById("allMotorStop");

    const armedText = document.getElementById("armedText");
    const armedIndicator = document.getElementById("armedIndicator");

    let bleDevice = null;
    let bleServer = null;
    let bleService = null;
    let bleRX = null;
    let bleTX = null;

    let armed = false;


    /* =================================================
       LOGIN
    ================================================= */

    function login() {

        const user = username.value.trim();
        const pass = password.value.trim();

        if (user === "VAJRA" && pass === "VAJRA") {

            loginMessage.style.color = "#00ff9d";
            loginMessage.textContent = "✓ ACCESS GRANTED";

            console.log("VAJRA LOGIN SUCCESS");

            setTimeout(() => {

                loginScreen.style.display = "none";

                dashboard.style.display = "block";

                document.body.style.overflow = "auto";

                addLog("LOGIN SUCCESS — VAJRA dashboard opened");

            }, 350);

        } else {

            loginMessage.style.color = "#ff3155";
            loginMessage.textContent = "✕ INVALID USERNAME OR PASSWORD";

            password.value = "";
            password.focus();
        }
    }


    loginBtn.addEventListener("click", login);


    username.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            password.focus();
        }

    });


    password.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            login();
        }

    });


    /* =================================================
       LOGOUT
    ================================================= */

    logoutBtn.addEventListener("click", () => {

        if (armed) {
            sendCommand("VAJRA:STOP\n");
        }

        loginScreen.style.display = "flex";
        dashboard.style.display = "none";

        username.value = "";
        password.value = "";

        loginMessage.textContent = "";

    });


    /* =================================================
       PAGE NAVIGATION
    ================================================= */

    navButtons.forEach(button => {

        button.addEventListener("click", () => {

            const pageName = button.dataset.page;

            navButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            pages.forEach(page => {
                page.classList.remove("active-page");
            });

            const selectedPage =
                document.getElementById(pageName + "Page");

            if (selectedPage) {
                selectedPage.classList.add("active-page");
            }

        });

    });


    /* =================================================
       LOGGING
    ================================================= */

    const logWindow = document.getElementById("logWindow");

    function addLog(message) {

        if (!logWindow) return;

        const line = document.createElement("div");

        line.className = "log-line";

        const time = new Date().toLocaleTimeString();

        line.innerHTML =
            `<span>[${time}]</span> ${message}`;

        logWindow.appendChild(line);

        logWindow.scrollTop = logWindow.scrollHeight;
    }


    document.getElementById("clearLogs")
        .addEventListener("click", () => {

            logWindow.innerHTML = "";

            addLog("LOGS CLEARED");

        });


    /* =================================================
       BLE
    ================================================= */

    const SERVICE_UUID =
        "12345678-1234-1234-1234-1234567890ab";

    const RX_UUID =
        "12345678-1234-1234-1234-1234567890ac";

    const TX_UUID =
        "12345678-1234-1234-1234-1234567890ad";


    bleButton.addEventListener("click", async () => {

        if (!navigator.bluetooth) {

            alert(
                "Web Bluetooth is not supported in this browser."
            );

            addLog("Web Bluetooth is not supported");

            return;
        }


        try {

            addLog("Searching for VAJRA BLE device...");

            bleDevice = await navigator.bluetooth.requestDevice({

                filters: [
                    {
                        name: "ANSH'S DRONE VAJRA"
                    }
                ],

                optionalServices: [
                    SERVICE_UUID
                ]

            });


            addLog(
                "BLE device selected: " +
                bleDevice.name
            );


            bleDevice.addEventListener(
                "gattserverdisconnected",
                onDisconnected
            );


            bleServer =
                await bleDevice.gatt.connect();

            addLog("GATT CONNECTED");


            bleService =
                await bleServer.getPrimaryService(
                    SERVICE_UUID
                );

            addLog("SERVICE FOUND");


            bleRX =
                await bleService.getCharacteristic(
                    RX_UUID
                );

            addLog("RX FOUND");


            bleTX =
                await bleService.getCharacteristic(
                    TX_UUID
                );

            addLog("TX FOUND");


            if (
                bleTX.properties.notify ||
                bleTX.properties.indicate
            ) {

                await bleTX.startNotifications();

                bleTX.addEventListener(
                    "characteristicvaluechanged",
                    handleTelemetry
                );

            }


            setBLEConnected(true);

            addLog("VAJRA CONNECTED");

        } catch (error) {

            console.error(error);

            addLog(
                "BLE ERROR: " +
                error.message
            );

        }

    });


    function setBLEConnected(connected) {

        if (connected) {

            bleStatus.className =
                "ble-status connected";

            bleStatus.innerHTML =
                "<span></span> BLE CONNECTED";

            bleButton.textContent =
                "CONNECTED";

            bleButton.disabled = true;

            document.getElementById("settingsBle")
                .textContent = "Connected";

        } else {

            bleStatus.className =
                "ble-status disconnected";

            bleStatus.innerHTML =
                "<span></span> BLE DISCONNECTED";

            bleButton.textContent =
                "CONNECT BLE";

            bleButton.disabled = false;

            document.getElementById("settingsBle")
                .textContent = "Disconnected";
        }

    }


    function onDisconnected() {

        addLog("BLE DISCONNECTED");

        setBLEConnected(false);

        bleServer = null;
        bleService = null;
        bleRX = null;
        bleTX = null;

    }


    /* =================================================
       SEND BLE COMMAND
    ================================================= */

    async function sendCommand(command) {

        console.log("COMMAND:", command);

        addLog("TX → " + command.trim());


        if (!bleRX) {

            addLog(
                "BLE not connected — command not sent"
            );

            return;
        }


        try {

            const encoder =
                new TextEncoder();

            const data =
                encoder.encode(command);

            await bleRX.writeValue(data);

        } catch (error) {

            console.error(error);

            addLog(
                "TX ERROR: " +
                error.message
            );

        }

    }


    /* =================================================
       START / STOP
    ================================================= */

    startBtn.addEventListener("click", () => {

        armed = true;

        armedText.textContent = "ARMED";

        armedText.style.color = "#00ff9d";

        armedIndicator.style.background =
            "#00ff9d";

        armedIndicator.style.boxShadow =
            "0 0 15px #00ff9d";

        sendCommand("VAJRA:START\n");

        addLog("MOTORS ARMED");

    });


    stopBtn.addEventListener("click", stopAll);

    allMotorStop.addEventListener("click", stopAll);


    function stopAll() {

        armed = false;

        armedText.textContent =
            "DISARMED";

        armedText.style.color =
            "#ff3155";

        armedIndicator.style.background =
            "#ff3155";

        armedIndicator.style.boxShadow =
            "none";

        sendCommand("VAJRA:STOP\n");

        setMotorValue("M1", 900);
        setMotorValue("M2", 900);
        setMotorValue("M3", 900);
        setMotorValue("M4", 900);

        addLog("ALL MOTORS STOPPED");

    }


    /* =================================================
       MOTOR SLIDERS
    ================================================= */

    const motorNames = ["M1", "M2", "M3", "M4"];


    motorNames.forEach(motor => {

        const slider =
            document.getElementById(
                motor.toLowerCase() + "Slider"
            );

        const value =
            document.getElementById(
                motor.toLowerCase() + "Value"
            );


        slider.addEventListener("input", () => {

            const pulse =
                Number(slider.value);

            value.textContent =
                pulse;

            sendCommand(
                `VAJRA:${motor} ${pulse}us\n`
            );

        });

    });


    document.querySelectorAll(".motor-start")
        .forEach(button => {

            button.addEventListener("click", () => {

                const motor =
                    button.dataset.motor;

                sendCommand(
                    `VAJRA:${motor} START\n`
                );

                addLog(
                    `${motor} START command sent`
                );

            });

        });


    function setMotorValue(motor, pulse) {

        const lower =
            motor.toLowerCase();

        const slider =
            document.getElementById(
                lower + "Slider"
            );

        const value =
            document.getElementById(
                lower + "Value"
            );

        if (slider) {
            slider.value = pulse;
        }

        if (value) {
            value.textContent = pulse;
        }

    }


    /* =================================================
       JOYSTICK
    ================================================= */

    const joystick =
        document.getElementById("joystick");

    const joystickStick =
        document.getElementById("joystickStick");


    const throttleValue =
        document.getElementById("throttleValue");

    const yawValue =
        document.getElementById("yawValue");

    const pitchValue =
        document.getElementById("pitchValue");

    const rollValue =
        document.getElementById("rollValue");


    let joystickActive = false;


    joystickStick.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            joystickActive = true;

            joystickStick.setPointerCapture(
                event.pointerId
            );

        }
    );


    joystickStick.addEventListener(
        "pointermove",
        event => {

            if (!joystickActive) return;

            moveJoystick(
                event.clientX,
                event.clientY
            );

        }
    );


    joystickStick.addEventListener(
        "pointerup",
        () => {

            joystickActive = false;

            resetJoystick();

        }
    );


    joystickStick.addEventListener(
        "pointercancel",
        () => {

            joystickActive = false;

            resetJoystick();

        }
    );


    function moveJoystick(x, y) {

        const rect =
            joystick.getBoundingClientRect();

        const centerX =
            rect.left + rect.width / 2;

        const centerY =
            rect.top + rect.height / 2;

        let dx =
            x - centerX;

        let dy =
            y - centerY;


        const max =
            rect.width / 2 - 36;

        const distance =
            Math.sqrt(dx * dx + dy * dy);


        if (distance > max) {

            dx =
                (dx / distance) * max;

            dy =
                (dy / distance) * max;

        }


        joystickStick.style.left =
            `calc(50% + ${dx}px)`;

        joystickStick.style.top =
            `calc(50% + ${dy}px)`;


        const roll =
            Math.round(
                (dx / max) * 100
            );

        const pitch =
            Math.round(
                (-dy / max) * 100
            );


        rollValue.textContent =
            roll;

        pitchValue.textContent =
            pitch;


        sendJoystick(
            0,
            0,
            pitch,
            roll
        );

    }


    function resetJoystick() {

        joystickStick.style.left = "50%";
        joystickStick.style.top = "50%";

        rollValue.textContent = "0";
        pitchValue.textContent = "0";
        yawValue.textContent = "0";

        sendJoystick(0, 0, 0, 0);

    }


    function sendJoystick(
        throttle,
        yaw,
        pitch,
        roll
    ) {

        throttleValue.textContent =
            throttle;

        yawValue.textContent =
            yaw;


        sendCommand(
            `VAJRA:JOY,${throttle},${yaw},${pitch},${roll}\n`
        );

    }


    /* =================================================
       TELEMETRY
    ================================================= */

    function handleTelemetry(event) {

        const decoder =
            new TextDecoder();

        const message =
            decoder.decode(
                event.target.value
            ).trim();

        console.log("TELEMETRY:", message);

        addLog("RX ← " + message);

        if (!message.startsWith("TEL,")) {
            return;
        }

        const data =
            message.split(",");

        if (data.length < 19) {
            return;
        }


        const roll = data[1];
        const pitch = data[2];
        const gx = data[3];
        const gy = data[4];
        const gz = data[5];

        const m1 = data[6];
        const m2 = data[7];
        const m3 = data[8];
        const m4 = data[9];

        const rollP = data[10];
        const rollI = data[11];
        const rollD = data[12];
        const rollPID = data[13];

        const pitchP = data[14];
        const pitchI = data[15];
        const pitchD = data[16];
        const pitchPID = data[17];


        setText("rollTelemetry", roll + "°");
        setText("pitchTelemetry", pitch + "°");

        setText("telRoll", roll + "°");
        setText("telPitch", pitch + "°");

        setText("telGx", gx);
        setText("telGy", gy);
        setText("telGz", gz);

        setText("telM1", m1);
        setText("telM2", m2);
        setText("telM3", m3);
        setText("telM4", m4);

        setText("rollP", rollP);
        setText("rollI", rollI);
        setText("rollD", rollD);
        setText("rollPID", rollPID);

        setText("pitchP", pitchP);
        setText("pitchI", pitchI);
        setText("pitchD", pitchD);
        setText("pitchPID", pitchPID);

    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }

    }


    /* =================================================
       STARTUP
    ================================================= */

    dashboard.style.display = "none";

    loginScreen.style.display = "flex";

    username.focus();

    console.log(
        "VAJRA WEBSITE READY"
    );

});
