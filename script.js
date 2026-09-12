// ============================================================
// ANSH'S DRONE VAJRA 🚁⚡
// FAST BLUETOOTH CONTROL
// NO INTENTIONAL MOTOR COMMAND DELAY
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


// ============================================================
// JOYSTICK SEND CONTROL
// ============================================================

let joystickTimer = null;
let joystickMoving = false;


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

const emergencyButton =
    document.getElementById("emergencyButton");


// ============================================================
// LOG
// ============================================================

function addLog(message)
{
    console.log("[VAJRA]", message);

    const logs =
        document.getElementById("logs");

    if (!logs)
        return;

    const entry =
        document.createElement("div");

    entry.className =
        "log-entry";

    entry.textContent =
        new Date().toLocaleTimeString() +
        "  " +
        message;

    logs.prepend(entry);
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

        loginPage.classList.add("hidden");

        dashboard.classList.remove("hidden");

        addLog("LOGIN SUCCESS");
    }
    else
    {
        loginError.textContent =
            "Wrong username or password.";
    }
}


// ============================================================
// CONNECT BUTTON
// ============================================================

if (connectButton)
{
    connectButton.addEventListener(
        "click",
        async function()
        {
            if (connected)
            {
                await disconnectVAJRA();
            }
            else
            {
                await connectVAJRA();
            }
        }
    );
}


// ============================================================
// SEARCH BUTTON
// ============================================================

if (searchButton)
{
    searchButton.addEventListener(
        "click",
        async function()
        {
            if (connected)
            {
                await disconnectVAJRA();
            }
            else
            {
                await connectVAJRA();
            }
        }
    );
}


// ============================================================
// CONNECT BLUETOOTH
// ============================================================

async function connectVAJRA()
{
    if (!navigator.bluetooth)
    {
        alert(
            "Web Bluetooth is not supported.\n\n" +
            "Use Chrome or Edge."
        );

        return;
    }


    try
    {
        addLog("SEARCHING BLUETOOTH");


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
            "DEVICE: " +
            (
                bleDevice.name ||
                "ANSH'S DRONE VAJRA"
            )
        );


        bleDevice.addEventListener(
            "gattserverdisconnected",
            bluetoothDisconnected
        );


        addLog("CONNECTING...");


        bleServer =
            await bleDevice.gatt.connect();


        addLog("GATT CONNECTED");


        const service =
            await bleServer.getPrimaryService(
                SERVICE_UUID
            );


        addLog("SERVICE FOUND");


        // Website -> Main
        rxCharacteristic =
            await service.getCharacteristic(
                RX_UUID
            );


        addLog("RX READY");


        // Main -> Website
        txCharacteristic =
            await service.getCharacteristic(
                TX_UUID
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
            "✓ ANSH'S DRONE VAJRA CONNECTED"
        );


        // Immediately put motors at STOP
        await sendCommand("STOP");
    }
    catch(error)
    {
        console.error(error);

        connected = false;
        armed = false;

        updateConnectionUI();

        addLog(
            "BLE ERROR: " +
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

    try
    {
        if (rxCharacteristic)
        {
            await sendCommand("STOP");
        }
    }
    catch(error)
    {
        console.log(error);
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
}


// ============================================================
// BLE DISCONNECTED
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
}


// ============================================================
// CONNECTION UI
// ============================================================

function updateConnectionUI()
{
    const text =
        document.getElementById(
            "connectionText"
        );

    const dot =
        document.getElementById(
            "connectionDot"
        );

    const largeText =
        document.getElementById(
            "largeConnectionText"
        );

    const largeDot =
        document.getElementById(
            "largeConnectionDot"
        );

    const deviceText =
        document.getElementById(
            "deviceText"
        );


    if (connected)
    {
        if (text)
            text.textContent =
                "CONNECTED";

        if (dot)
            dot.classList.add(
                "connected"
            );

        if (largeDot)
            largeDot.classList.add(
                "connected"
            );

        if (largeText)
            largeText.textContent =
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
    }
    else
    {
        if (text)
            text.textContent =
                "DISCONNECTED";

        if (dot)
            dot.classList.remove(
                "connected"
            );

        if (largeDot)
            largeDot.classList.remove(
                "connected"
            );

        if (largeText)
            largeText.textContent =
                "DRONE NOT CONNECTED";

        if (deviceText)
            deviceText.textContent =
                "No drone connected";

        if (connectButton)
            connectButton.textContent =
                "CONNECT";

        if (searchButton)
            searchButton.textContent =
                "SEARCH BLUETOOTH";
    }
}


// ============================================================
// FAST BLE COMMAND
// ============================================================

async function sendCommand(command)
{
    if (!rxCharacteristic)
    {
        return false;
    }


    try
    {
        const data =
            new TextEncoder().encode(
                command + "\n"
            );


        // ================================================
        // FASTEST METHOD
        // No response waiting.
        // ================================================

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
                .writeValue(
                    data
                );
        }


        console.log(
            "VAJRA TX:",
            command
        );


        return true;
    }
    catch(error)
    {
        console.error(
            "BLE SEND ERROR:",
            error
        );

        return false;
    }
}


// ============================================================
// RECEIVE DATA
// ============================================================

function receiveFromDrone(event)
{
    const message =
        new TextDecoder().decode(
            event.target.value
        ).trim();


    if (!message)
        return;


    console.log(
        "VAJRA RX:",
        message
    );


    addLog(
        "RX: " + message
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
                await sendCommand(
                    "ARM"
                );

                armed = true;

                armButton.textContent =
                    "ARMED";

                armButton.classList.add(
                    "armed"
                );

                addLog(
                    "ARM"
                );
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
        "STOP -> ALL = 900us"
    );
}


// ============================================================
// EMERGENCY STOP
// ============================================================

if (emergencyButton)
{
    emergencyButton.addEventListener(
        "click",
        async function()
        {
            armed = false;

            stopJoystickLoop();

            await sendCommand(
                "EMERGENCY"
            );

            resetArmButton();

            resetMotorDisplays();

            addLog(
                "EMERGENCY STOP -> 900us"
            );
        }
    );
}


// ============================================================
// ARM UI
// ============================================================

function resetArmButton()
{
    if (!armButton)
        return;

    armButton.textContent =
        "ARM";

    armButton.classList.remove(
        "armed"
    );
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
// MOTOR START
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


    // DIRECT COMMAND
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
        " -> 2000us"
    );
}


// ============================================================
// MOTOR STOP
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


    // DIRECT COMMAND
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
        " -> 900us"
    );
}


// ============================================================
// MOTOR UI
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
        this.area = area;
        this.stick = stick;
        this.callback = callback;

        this.active = false;
        this.pointerId = null;


        area.style.touchAction =
            "none";


        area.addEventListener(
            "pointerdown",
            (event) =>
            {
                this.active = true;
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


        const nx =
            x / radius;

        const ny =
            y / radius;


        this.stick.style.transform =
            "translate(calc(-50% + " +
            x +
            "px), calc(-50% + " +
            y +
            "px))";


        this.callback(
            nx,
            ny
        );
    }


    release()
    {
        this.active = false;
        this.pointerId = null;


        this.stick.style.transform =
            "translate(-50%, -50%)";


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
            // Up = throttle
            throttle =
                Math.round(
                    ((-y + 1) / 2) *
                    100
                );


            // Left/right = yaw
            yaw =
                Math.round(
                    x * 100
                );


            updateJoystickDisplay();


            // Start fast joystick loop
            if (armed)
            {
                startJoystickLoop();
            }
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
            roll =
                Math.round(
                    x * 100
                );


            pitch =
                Math.round(
                    -y * 100
                );


            updateJoystickDisplay();


            if (armed)
            {
                startJoystickLoop();
            }
        }
    );
}


// ============================================================
// JOYSTICK VALUES DISPLAY
// ============================================================

function updateJoystickDisplay()
{
    const throttleElement =
        document.getElementById(
            "throttleValue"
        );

    const yawElement =
        document.getElementById(
            "yawValue"
        );

    const pitchElement =
        document.getElementById(
            "pitchValue"
        );

    const rollElement =
        document.getElementById(
            "rollValue"
        );


    if (throttleElement)
        throttleElement.textContent =
            throttle;

    if (yawElement)
        yawElement.textContent =
            yaw;

    if (pitchElement)
        pitchElement.textContent =
            pitch;

    if (rollElement)
        rollElement.textContent =
            roll;
}


// ============================================================
// FAST JOYSTICK LOOP
// ============================================================

function startJoystickLoop()
{
    if (!connected)
        return;

    if (!armed)
        return;


    joystickMoving = true;


    if (joystickTimer !== null)
        return;


    /*
       20 ms = 50 commands/sec.
       There is NO artificial 80 ms delay.
    */

    joystickTimer =
        setInterval(
            function()
            {
                if (
                    !connected ||
                    !armed
                )
                {
                    stopJoystickLoop();
                    return;
                }


                sendJoystickCommand();

            },
            20
        );
}


// ============================================================
// STOP JOYSTICK LOOP
// ============================================================

function stopJoystickLoop()
{
    joystickMoving = false;


    if (joystickTimer !== null)
    {
        clearInterval(
            joystickTimer
        );

        joystickTimer = null;
    }
}


// ============================================================
// JOYSTICK COMMAND
//
// JOY,THROTTLE,YAW,PITCH,ROLL
// ============================================================

function sendJoystickCommand()
{
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
}


// ============================================================
// INITIALIZE
// ============================================================

updateConnectionUI();

resetMotorDisplays();

updateJoystickDisplay();

addLog(
    "VAJRA READY"
);

addLog(
    "BLUETOOTH DISCONNECTED"
);
