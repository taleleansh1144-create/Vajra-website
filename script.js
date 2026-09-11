/* =====================================================
   ANSH'S DRONE VAJRA 🚁⚡
   WEBSITE CONTROL SYSTEM
   ===================================================== */


/* ================= LOGIN ================= */

const loginPage = document.getElementById("loginPage");
const dashboardPage = document.getElementById("dashboardPage");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");


loginBtn.addEventListener("click", login);


passwordInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        login();
    }

});


function login() {

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username === "VAJRA" && password === "VAJRA") {

        loginMessage.textContent = "";

        loginPage.classList.remove("active");
        dashboardPage.classList.add("active");

        addLog("LOGIN", "VAJRA dashboard accessed");

    } else {

        loginMessage.textContent =
            "Invalid username or password.";

    }

}


/* ================= LOGOUT ================= */

document
    .getElementById("logoutBtn")
    .addEventListener("click", function() {

        dashboardPage.classList.remove("active");
        loginPage.classList.add("active");

        passwordInput.value = "";

    });


/* ================= NAVIGATION ================= */

const navButtons =
    document.querySelectorAll(".nav-btn");

const contentPages =
    document.querySelectorAll(".content-page");


navButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const target =
            button.getAttribute("data-page");

        navButtons.forEach(function(btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        contentPages.forEach(function(page) {
            page.classList.remove("active");
        });

        document
            .getElementById(target)
            .classList.add("active");

    });

});


/* ================= CONNECTION ================= */

let connected = false;

const connectionDot =
    document.getElementById("connectionDot");

const connectionText =
    document.getElementById("connectionText");

const connectBtn =
    document.getElementById("connectBtn");


connectBtn.addEventListener("click", function() {

    connected = !connected;

    updateConnection();

});


function updateConnection() {

    if (connected) {

        connectionDot.classList.add("connected");

        connectionText.textContent = "CONNECTED";

        connectBtn.textContent = "DISCONNECT";

        addLog(
            "LINK",
            "VAJRA control link connected"
        );

    } else {

        connectionDot.classList.remove("connected");

        connectionText.textContent = "DISCONNECTED";

        connectBtn.textContent = "CONNECT";

        addLog(
            "LINK",
            "VAJRA control link disconnected"
        );

    }

}


/* ================= SPEED ================= */

const speedSlider =
    document.getElementById("speedSlider");

const speedValue =
    document.getElementById("speedValue");


let currentSpeed =
    Number(speedSlider.value);


speedSlider.addEventListener("input", function() {

    currentSpeed =
        Number(speedSlider.value);

    speedValue.textContent =
        currentSpeed;

    updateMotorSpeedDisplays();

});


function updateMotorSpeedDisplays() {

    for (let i = 1; i <= 4; i++) {

        const motorElement =
            document.getElementById(
                `m${i}Speed`
            );

        const statusElement =
            document.getElementById(
                `statusM${i}`
            );

        const isOn =
            statusElement.classList.contains("on");

        motorElement.textContent =
            isOn ? currentSpeed : "900";

    }

}


/* ================= MOTOR STATE ================= */

const motors = {

    M1: false,
    M2: false,
    M3: false,
    M4: false

};


/* ================= SET MOTOR ================= */

function setMotor(motor, state) {

    motors[motor] = state;

    const number =
        motor.replace("M", "");

    const status =
        document.getElementById(
            `status${motor}`
        );

    const speed =
        document.getElementById(
            `m${number}Speed`
        );


    if (state) {

        status.textContent = "ON";

        status.classList.remove("off");

        status.classList.add("on");

        speed.textContent =
            currentSpeed;

        sendCommand(`${motor} ON`);

    } else {

        status.textContent = "OFF";

        status.classList.remove("on");

        status.classList.add("off");

        // OFF = 900 us
        speed.textContent = "900";

        sendCommand(`${motor} OFF`);

    }

}


/* ================= START BUTTONS ================= */

document
    .querySelectorAll(".motor-start")
    .forEach(function(button) {

        button.addEventListener("click", function() {

            const motor =
                button.getAttribute("data-motor");

            setMotor(motor, true);

        });

    });


/* ================= STOP BUTTONS ================= */

document
    .querySelectorAll(".motor-stop")
    .forEach(function(button) {

        button.addEventListener("click", function() {

            const motor =
                button.getAttribute("data-motor");

            setMotor(motor, false);

        });

    });


/* ================= ALL START ================= */

document
    .getElementById("allStartBtn")
    .addEventListener("click", function() {

        motors.M1 = true;
        motors.M2 = true;
        motors.M3 = true;
        motors.M4 = true;

        updateAllMotorUI();

        sendCommand("SPEED " + currentSpeed);
        sendCommand("ALL ON");

        addLog(
            "MOTORS",
            "All motors started at " +
            currentSpeed +
            " µs"
        );

    });


/* ================= ALL STOP ================= */

document
    .getElementById("allStopBtn")
    .addEventListener("click", function() {

        motors.M1 = false;
        motors.M2 = false;
        motors.M3 = false;
        motors.M4 = false;

        updateAllMotorUI();

        // IMPORTANT:
        // STOP sends 900 us
        sendCommand("STOP");

        addLog(
            "STOP",
            "All motors stopped - 900 µs"
        );

    });


/* ================= UPDATE ALL UI ================= */

function updateAllMotorUI() {

    for (let i = 1; i <= 4; i++) {

        const motor =
            `M${i}`;

        const status =
            document.getElementById(
                `status${motor}`
            );

        const speed =
            document.getElementById(
                `m${i}Speed`
            );

        if (motors[motor]) {

            status.textContent = "ON";

            status.classList.remove("off");

            status.classList.add("on");

            speed.textContent =
                currentSpeed;

        } else {

            status.textContent = "OFF";

            status.classList.remove("on");

            status.classList.add("off");

            speed.textContent = "900";

        }

    }

}


/* ================= COMMAND CENTER ================= */

const commandInput =
    document.getElementById(
        "commandInput"
    );

const sendCommandBtn =
    document.getElementById(
        "sendCommandBtn"
    );


sendCommandBtn.addEventListener(
    "click",
    sendManualCommand
);


commandInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {
            sendManualCommand();
        }

    }
);


function sendManualCommand() {

    const command =
        commandInput.value.trim();

    if (command === "") {
        return;
    }

    sendCommand(command);

    commandInput.value = "";

}


/* ================= QUICK COMMANDS ================= */

document
    .querySelectorAll(
        ".quick-commands button"
    )
    .forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                const command =
                    button.getAttribute(
                        "data-command"
                    );

                sendCommand(command);

            }
        );

    });


/* ================= SEND COMMAND ================= */

function sendCommand(command) {

    command =
        command.trim()
            .toUpperCase();

    console.log(
        "VAJRA COMMAND:",
        command
    );


    /*
      This is where the real ESP32 connection
      should be connected later.

      Example command:

      M1 ON
      M1 OFF
      M2 ON
      M2 OFF
      M3 ON
      M3 OFF
      M4 ON
      M4 OFF
      ALL ON
      STOP
      SPEED 1200
    */


    addLog(
        "COMMAND",
        command
    );


    // Update website UI for manual commands
    processLocalCommand(command);

}


/* ================= PROCESS COMMAND ================= */

function processLocalCommand(command) {

    if (command === "M1 ON") {
        setMotorWithoutSending("M1", true);
    }

    else if (command === "M1 OFF") {
        setMotorWithoutSending("M1", false);
    }

    else if (command === "M2 ON") {
        setMotorWithoutSending("M2", true);
    }

    else if (command === "M2 OFF") {
        setMotorWithoutSending("M2", false);
    }

    else if (command === "M3 ON") {
        setMotorWithoutSending("M3", true);
    }

    else if (command === "M3 OFF") {
        setMotorWithoutSending("M3", false);
    }

    else if (command === "M4 ON") {
        setMotorWithoutSending("M4", true);
    }

    else if (command === "M4 OFF") {
        setMotorWithoutSending("M4", false);
    }

    else if (command === "ALL ON") {

        motors.M1 = true;
        motors.M2 = true;
        motors.M3 = true;
        motors.M4 = true;

        updateAllMotorUI();

    }

    else if (command === "STOP") {

        motors.M1 = false;
        motors.M2 = false;
        motors.M3 = false;
        motors.M4 = false;

        updateAllMotorUI();

    }

}


/* ================= LOCAL MOTOR UPDATE ================= */

function setMotorWithoutSending(
    motor,
    state
) {

    motors[motor] = state;

    updateAllMotorUI();

}


/* ================= LOG SYSTEM ================= */

const logContainer =
    document.getElementById(
        "logContainer"
    );


function addLog(type, message) {

    const entry =
        document.createElement("div");

    entry.className =
        "log-entry";

    const time =
        new Date().toLocaleTimeString();

    entry.innerHTML = `
        <span>${type}</span>
        <small>
            ${time} — ${message}
        </small>
    `;

    logContainer.prepend(entry);

}


/* ================= INITIAL STATE ================= */

// All motors OFF at startup.
// Website displays 900 µs.

motors.M1 = false;
motors.M2 = false;
motors.M3 = false;
motors.M4 = false;

updateAllMotorUI();

console.log(
    "VAJRA website initialized."
);
