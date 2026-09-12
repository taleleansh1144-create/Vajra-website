// ============================================================
// ANSH'S DRONE VAJRA 🚁⚡
// COMPLETE SCRIPT.JS
// ============================================================


// ============================================================
// BLE UUIDS
// ============================================================

const SERVICE_UUID =
    "12345678-1234-1234-1234-1234567890ab";

const RX_UUID =
    "12345678-1234-1234-1234-1234567890ac";

const TX_UUID =
    "12345678-1234-1234-1234-1234567890ad";


// ============================================================
// BLE VARIABLES
// ============================================================

let bleDevice = null;
let bleServer = null;
let rxCharacteristic = null;
let txCharacteristic = null;

let connected = false;
let armed = false;


// ============================================================
// JOYSTICK VALUES
// ============================================================

let throttle = 0;
let yaw = 0;
let pitch = 0;
let roll = 0;

let joystickTimer = null;


// ============================================================
// HTML ELEMENTS
// ============================================================

const loginPage =
    document.getElementById("loginPage");

const dashboard =
    document.getElementById("dashboard");

const username =
    document.getElementById("username");

const password =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const loginError =
    document.getElementById("loginError");

const connectButton =
    document.getElementById("connectButton");

const searchButton =
    document.getElementById("searchButton");

const logoutButton =
    document.getElementById("logoutButton");

const armButton =
    document.getElementById("armButton");

const stopButton =
    document.getElementById("stopButton");


// ============================================================
// LOG
// ============================================================

function addLog(message)
{
    console.log("[VAJRA]", message);

    const logBox =
        document.getElementById("logs");

    if (!logBox)
        return;

    const line =
        document.createElement("div");

    line.className =
        "log-entry";

    line.textContent =
        new Date().toLocaleTimeString() +
        "  " +
        message;

    logBox.prepend(line);
}


// ============================================================
// LOGIN
// ============================================================

if (loginButton)
{
    loginButton.addEventListener(
        "click",
        loginVAJRA
    );
}


if (password)
{
    password.addEventListener(
        "keydown",
        function(event)
        {
            if (event.key === "Enter")
            {
                loginVAJRA();
            }
        }
    );
}


function loginVAJRA()
{
    const user =
        username.value.trim();

    const pass =
        password.value;

    if (
        user === "VAJRA" &&
        pass === "VAJRA"
    )
    {
        loginError.textContent = "";

        loginPage.classList.add(
            "hidden"
        );

        dashboard.classList.remove(
            "hidden"
        );

        addLog(
            "LOGIN SUCCESS"
        );
    }
    else
    {
        loginError.textContent =
            "Wrong username or password.";
    }
}


// ============================================================
// NAVIGATION
// ============================================================

document
    .querySelectorAll(".nav-button")
    .forEach(function(button)
    {
        button.addEventListener(
            "click",
            function()
            {
                document
                    .querySelectorAll(".nav-button")
                    .forEach(function(btn)
                    {
                        btn.classList.remove(
                            "active"
                        );
                    });

                button.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(".page")
                    .forEach(function(page)
                    {
                        page.classList.remove(
                            "active"
                        );
                    });


                const target =
                    document.getElementById(
                        button.dataset.page
                    );

                if (target)
                {
                    target.classList.add(
                        "active"
                    );
                }
            }
        );
    });


// ============================================================
// BLUETOOTH CONNECT
// ============================================================

if (connectButton)
{
    connectButton.addEventListener(
        "click",
        function()
        {
            if (connected)
            {
                disconnectVAJRA();
            }
            else
            {
                connectVAJRA();
            }
        }
    );
}


if (searchButton)
{
    searchButton.addEventListener(
        "click",
        function()
        {
            if (connected)
            {
                disconnectVAJRA();
            }
            else
            {
                connectVAJRA();
            }
        }
    );
}


// ============================================================
// CONNECT VAJRA
// ============================================================

async function connectVAJRA()
{
    if (!navigator.bluetooth)
    {
        alert(
            "Web Bluetooth is not supported.\n\n" +
            "Use Google Chrome or Microsoft Edge."
        );

        return;
    }


    try
    {
        addLog(
            "SEARCHING FOR VAJRA..."
        );


        bleDevice =
            await navigator.bluetooth.requestDevice(
            {
                acceptAllDevices: true,

                optionalServices:
                [
                    SERVICE_UUID
                ]
            });


        addLog(
            "FOUND: " +
            (
                bleDevice.name ||
                "Unknown Bluetooth device"
            )
        );


        bleDevice.addEventListener(
            "gattserverdisconnected",
            bluetoothDisconnected
        );


        addLog(
            "CONNECTING..."
        );


        bleServer =
            await bleDevice.gatt.connect();


        addLog(
            "GATT CONNECTED"
        );


        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        addLog(
            "VAJRA SERVICE FOUND"
        );


        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        addLog(
            "RX READY"
        );


        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
            );


        addLog(
            "TX READY"
        );


        await txCharacteristic.startNotifications();


        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            receiveFromDrone
        );


        connected = true;
        armed = false;


        updateConnectionUI();


        addLog(
            "✓ VAJRA CONNECTED"
        );


        /*
         * IMPORTANT:
         * NO STOP COMMAND HERE.
         *
         * Connecting Bluetooth alone must NOT
         * send a motor command.
         */


    }
    catch(error)
    {
        console.error(
            "BLE ERROR:",
            error
        );


        connected = false;
        armed = false;


        updateConnectionUI();


        addLog(
            "BLE ERROR: " +
            error.name +
            " - " +
            error.message
        );


        if (
            error.name !==
            "NotFoundError"
        )
        {
            alert(
                "Bluetooth connection failed:\n\n" +
                error.message
            );
        }
    }
}


// ============================================================
// DISCONNECT
// ============================================================

async function disconnectVAJRA()
{
    stopJoystickLoop();


    /*
     * User explicitly requested STOP = 900us.
     * Send STOP before disconnecting.
     */

    if (rxCharacteristic)
    {
        try
        {
            await sendCommand(
                "STOP"
            );
        }
        catch(error)
        {
            console.log(error);
        }
    }


    try
    {
        if (
            bleDevice &&
            bleDevice.gatt &&
            bleDevice.gatt.connected
        )
        {
            bleDevice.gatt.disconnect();
        }
    }
    catch(error)
    {
        console.log(error);
    }


    bleDevice = null;
    bleServer = null;
    rxCharacteristic = null;
    txCharacteristic = null;

    connected = false;
    armed = false;


    updateConnectionUI();
    resetArmButton();
    resetMotorDisplays();


    addLog(
        "VAJRA DISCONNECTED"
    );
}


// ============================================================
// BLE DISCONNECTED EVENT
// ============================================================

function bluetoothDisconnected()
{
    stopJoystickLoop();

    bleServer = null;
    rxCharacteristic = null;
    txCharacteristic = null;

    connected = false;
    armed = false;

    updateConnectionUI();
    resetArmButton();
    resetMotorDisplays();

    addLog(
        "BLUETOOTH DISCONNECTED"
    );
}


// ============================================================
// CONNECTION UI
// ============================================================

function updateConnectionUI()
{
    const connectionText =
        document.getElementById(
            "connectionText"
        );

    const connectionDot =
        document.getElementById(
            "connectionDot"
        );

    const largeConnectionDot =
        document.getElementById(
            "largeConnectionDot"
        );

    const largeConnectionText =
        document.getElementById(
            "largeConnectionText"
        );

    const deviceText =
        document.getElementById(
            "deviceText"
        );

    const remoteStatus =
        document.getElementById(
            "remoteStatus"
        );

    const telemetryBLE =
        document.getElementById(
            "telemetryBLE"
        );


    if (connected)
    {
        if (connectionText)
            connectionText.textContent =
                "CONNECTED";

        if (connectionDot)
            connectionDot.classList.add(
                "connected"
            );

        if (largeConnectionDot)
            largeConnectionDot.classList.add(
                "connected"
            );

        if (largeConnectionText)
            largeConnectionText.textContent =
                "DRONE CONNECTED";

        if (deviceText)
            deviceText.textContent =
                bleDevice.name ||
                "ANSH'S DRONE VAJRA";

        if (connectButton)
            connectButton.textContent =
                "DISCONNECT";

        if (searchButton)
            searchButton.textContent =
                "DISCONNECT VAJRA";

        if (remoteStatus)
            remoteStatus.textContent =
                armed
                    ? "ARMED"
                    : "CONNECTED";

        if (telemetryBLE)
            telemetryBLE.textContent =
                "ONLINE";
    }
    else
    {
        if (connectionText)
            connectionText.textContent =
                "DISCONNECTED";

        if (connectionDot)
            connectionDot.classList.remove(
                "connected"
            );

        if (largeConnectionDot)
            largeConnectionDot.classList.remove(
                "connected"
            );

        if (largeConnectionText)
            largeConnectionText.textContent =
                "DRONE NOT CONNECTED";

        if (deviceText)
            deviceText.textContent =
                "Press SEARCH FOR BLUETOOTH";

        if (connectButton)
            connectButton.textContent =
                "CONNECT";

        if (searchButton)
            searchButton.textContent =
                "🔎 SEARCH BLUETOOTH";

        if (remoteStatus)
            remoteStatus.textContent =
                "DISCONNECTED";

        if (telemetryBLE)
            telemetryBLE.textContent =
                "OFFLINE";
    }
}


// ============================================================
// FAST BLE SEND
// ============================================================

async function sendCommand(
    command
)
{
    if (!rxCharacteristic)
    {
        addLog(
            "NOT CONNECTED: " +
            command
        );

        return false;
    }


    try
    {
        const data =
            new TextEncoder().encode(
                command + "\n"
            );


        /*
         * FAST PATH:
         * WRITE WITHOUT RESPONSE
         */

        if (
            typeof rxCharacteristic
                .writeValueWithoutResponse ===
            "function"
        )
        {
            await rxCharacteristic
                .writeValueWithoutResponse(
                    data
                );
        }
        else
        {
            await rxCharacteristic
                .writeValue(data);
        }


        console.log(
            "TX:",
            command
        );


        return true;
    }
    catch(error)
    {
        console.error(
            "SEND ERROR:",
            error
        );

        addLog(
            "TX ERROR: " +
            error.message
        );

        return false;
    }
}


// ============================================================
// RECEIVE FROM DRONE
// ============================================================

function receiveFromDrone(event)
{
    const data =
        new TextDecoder().decode(
            event.target.value
        ).trim();


    if (!data)
        return;


    console.log(
        "VAJRA RX:",
        data
    );


    addLog(
        "RX: " + data
    );
}


// ============================================================
// ARM
// ============================================================

if (armButton)
{
    armButton.addEventListener(
        "click",
        async function()
        {
            if (!connected)
            {
                alert(
                    "Connect VAJRA first."
                );

                return;
            }


            if (!armed)
            {
                const success =
                    await sendCommand(
                        "ARM"
                    );


                if (!success)
                    return;


                armed = true;


                armButton.textContent =
                    "ARMED";

                armButton.classList.add(
                    "armed"
                );


                const remoteStatus =
                    document.getElementById(
                        "remoteStatus"
                    );

                if (remoteStatus)
                {
                    remoteStatus.textContent =
                        "ARMED";
                }


                addLog(
                    "ARMED"
                );


                /*
                 * START JOYSTICK LOOP
                 */
                startJoystickLoop();
            }
            else
            {
                await stopMotors();
            }
        }
    );
}


// ============================================================
// STOP
// ============================================================

if (stopButton)
{
    stopButton.addEventListener(
        "click",
        stopMotors
    );
}


async function stopMotors()
{
    armed = false;

    stopJoystickLoop();


    await sendCommand(
        "STOP"
    );


    resetArmButton();
    resetMotorDisplays();


    addLog(
        "STOP -> ALL MOTORS 900us"
    );
}


// ============================================================
// ARM BUTTON UI
// ============================================================

function resetArmButton()
{
    armed = false;


    if (armButton)
    {
        armButton.textContent =
            "ARM";

        armButton.classList.remove(
            "armed"
        );
    }
}


// ============================================================
// MOTOR START BUTTONS
// ============================================================

document
    .querySelectorAll(".motor-start")
    .forEach(function(button)
    {
        button.addEventListener(
            "click",
            function()
            {
                const motor =
                    button.dataset.motor;

                if (motor)
                {
                    startMotor(
                        motor
                    );
                }
            }
        );
    });


// ============================================================
// MOTOR STOP BUTTONS
// ============================================================

document
    .querySelectorAll(".motor-stop")
    .forEach(function(button)
    {
        button.addEventListener(
            "click",
            function()
            {
                const motor =
                    button.dataset.motor;

                if (motor)
                {
                    stopMotor(
                        motor
                    );
                }
            }
        );
    });


// ============================================================
// START INDIVIDUAL MOTOR
// ============================================================

async function startMotor(
    motor
)
{
    if (!connected)
    {
        alert(
            "Connect VAJRA first."
        );

        return;
    }


    /*
     * DIRECT:
     * M1 START
     * M2 START
     * M3 START
     * M4 START
     */

    await sendCommand(
        motor + " START"
    );


    const number =
        motor.replace(
            "M",
            ""
        );


    updateMotor(
        number,
        2000,
        true
    );


    addLog(
        motor +
        " START -> 2000us"
    );
}


// ============================================================
// STOP INDIVIDUAL MOTOR
// ============================================================

async function stopMotor(
    motor
)
{
    if (!connected)
    {
        alert(
            "Connect VAJRA first."
        );

        return;
    }


    await sendCommand(
        motor + " STOP"
    );


    const number =
        motor.replace(
            "M",
            ""
        );


    updateMotor(
        number,
        900,
        false
    );


    addLog(
        motor +
        " STOP -> 900us"
    );
}


// ============================================================
// MOTOR DISPLAY
// ============================================================

function updateMotor(
    number,
    speed,
    running
)
{
    const status =
        document.getElementById(
            "m" +
            number +
            "Status"
        );

    const speedElement =
        document.getElementById(
            "m" +
            number +
            "Speed"
        );


    if (status)
    {
        status.textContent =
            running
                ? "ON"
                : "OFF";
    }


    if (speedElement)
    {
        speedElement.textContent =
            speed +
            " µs";
    }
}


function resetMotorDisplays()
{
    for (
        let i = 1;
        i <= 4;
        i++
    )
    {
        updateMotor(
            i,
            900,
            false
        );
    }
}


// ============================================================
// JOYSTICK CLASS
// ============================================================

class VAJRAJoystick
{
    constructor(
        area,
        stick,
        callback
    )
    {
        this.area =
            area;

        this.stick =
            stick;

        this.callback =
            callback;

        this.active =
            false;

        this.pointerId =
            null;


        area.style.touchAction =
            "none";


        area.addEventListener(
            "pointerdown",
            (event) =>
            {
                this.active =
                    true;

                this.pointerId =
                    event.pointerId;


                area.setPointerCapture(
                    event.pointerId
                );


                this.move(event);
            }
        );


        area.addEventListener(
            "pointermove",
            (event) =>
            {
                if (
                    !this.active ||
                    event.pointerId !==
                    this.pointerId
                )
                {
                    return;
                }


                this.move(event);
            }
        );


        area.addEventListener(
            "pointerup",
            () =>
            {
                this.release();
            }
        );


        area.addEventListener(
            "pointercancel",
            () =>
            {
                this.release();
            }
        );
    }


    move(event)
    {
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


        const radius =
            Math.min(
                rect.width,
                rect.height
            ) / 2 - 35;


        const distance =
            Math.sqrt(
                x * x +
                y * y
            );


        if (
            distance > radius
        )
        {
            const scale =
                radius / distance;

            x *= scale;
            y *= scale;
        }


        const normalizedX =
            x / radius;

        const normalizedY =
            y / radius;


        this.stick.style.transform =
            "translate(calc(-50% + " +
            x +
            "px), calc(-50% + " +
            y +
            "px))";


        this.callback(
            normalizedX,
            normalizedY
        );
    }


    release()
    {
        this.active =
            false;

        this.pointerId =
            null;


        this.stick.style.transform =
            "translate(-50%, -50%)";


        /*
         * Return stick to center.
         *
         * IMPORTANT:
         * Throttle is returned to 0.
         */

        this.callback(
            0,
            0
        );
    }
}


// ============================================================
// LEFT JOYSTICK
// THROTTLE + YAW
// ============================================================

const leftJoystick =
    document.getElementById(
        "leftJoystick"
    );

const leftStick =
    document.getElementById(
        "leftStick"
    );


if (
    leftJoystick &&
    leftStick
)
{
    new VAJRAJoystick(
        leftJoystick,
        leftStick,
        function(x, y)
        {
            /*
             * UP = THROTTLE
             */

            throttle =
                Math.round(
                    ((-y + 1) / 2) *
                    100
                );


            /*
             * LEFT/RIGHT = YAW
             */

            yaw =
                Math.round(
                    x * 100
                );


            updateJoystickValues();
        }
    );
}


// ============================================================
// RIGHT JOYSTICK
// PITCH + ROLL
// ============================================================

const rightJoystick =
    document.getElementById(
        "rightJoystick"
    );

const rightStick =
    document.getElementById(
        "rightStick"
    );


if (
    rightJoystick &&
    rightStick
)
{
    new VAJRAJoystick(
        rightJoystick,
        rightStick,
        function(x, y)
        {
            /*
             * LEFT/RIGHT = ROLL
             */

            roll =
                Math.round(
                    x * 100
                );


            /*
             * UP/DOWN = PITCH
             */

            pitch =
                Math.round(
                    -y * 100
                );


            updateJoystickValues();
        }
    );
}


// ============================================================
// JOYSTICK DISPLAY
// ============================================================

function updateJoystickValues()
{
    const throttleValue =
        document.getElementById(
            "throttleValue"
        );

    const yawValue =
        document.getElementById(
            "yawValue"
        );

    const pitchValue =
        document.getElementById(
            "pitchValue"
        );

    const rollValue =
        document.getElementById(
            "rollValue"
        );


    if (throttleValue)
    {
        throttleValue.textContent =
            throttle;
    }

    if (yawValue)
    {
        yawValue.textContent =
            yaw;
    }

    if (pitchValue)
    {
        pitchValue.textContent =
            pitch;
    }

    if (rollValue)
    {
        rollValue.textContent =
            roll;
    }
}


// ============================================================
// FAST JOYSTICK LOOP
// ============================================================

function startJoystickLoop()
{
    if (joystickTimer !== null)
        return;


    if (!connected)
        return;


    joystickTimer =
        setInterval(
            function()
            {
                if (
                    !connected ||
                    !armed
                )
                {
                    return;
                }


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

            },
            20
        );
}


// ============================================================
// STOP JOYSTICK LOOP
// ============================================================

function stopJoystickLoop()
{
    if (joystickTimer !== null)
    {
        clearInterval(
            joystickTimer
        );

        joystickTimer = null;
    }
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton)
{
    logoutButton.addEventListener(
        "click",
        async function()
        {
            await stopMotors();

            await disconnectVAJRA();

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


// ============================================================
// INITIAL STATE
// ============================================================

connected = false;
armed = false;

updateConnectionUI();
resetMotorDisplays();
updateJoystickValues();

addLog(
    "VAJRA READY"
);

addLog(
    "BLUETOOTH DISCONNECTED"
);
