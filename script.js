/* =====================================================
   VAJRA DRONE WEBSITE
   LOGIN + NAVIGATION + JOYSTICKS + TELEMETRY + LOGS
   ===================================================== */


/* ================= LOGIN ================= */

const loginPage = document.getElementById("loginPage");
const app = document.getElementById("app");

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginError = document.getElementById("loginError");


/*
   IMPORTANT:
   Every time the website opens, LOGIN is shown.
   We intentionally do NOT save the login in localStorage.
*/

function showLogin() {

    loginPage.classList.remove("hidden");
    app.classList.add("hidden");

    usernameInput.value = "";
    passwordInput.value = "";

    loginError.textContent = "";
}


function showApp() {

    loginPage.classList.add("hidden");
    app.classList.remove("hidden");

    openPage("control");

    addLog("AUTH", "VAJRA control interface unlocked");
}


loginButton.addEventListener("click", login);


function login() {

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username === "VAJRA" && password === "VAJRA") {

        showApp();

    } else {

        loginError.textContent =
            "ACCESS DENIED — INVALID VAJRA CREDENTIALS";

    }
}


passwordInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        login();
    }

});


logoutButton.addEventListener("click", function() {

    addLog("AUTH", "User logged out");

    showLogin();

});


/* ================= PAGE NAVIGATION ================= */

const navButtons =
    document.querySelectorAll(".nav-button");

const pages =
    document.querySelectorAll(".page");


function openPage(pageName) {

    pages.forEach(page => {

        page.classList.remove("active-page");

    });


    navButtons.forEach(button => {

        button.classList.remove("active");

    });


    const targetPage =
        document.getElementById(pageName + "Page");

    if (targetPage) {

        targetPage.classList.add("active-page");

    }


    const targetButton =
        document.querySelector(
            `.nav-button[data-page="${pageName}"]`
        );

    if (targetButton) {

        targetButton.classList.add("active");

    }

}


navButtons.forEach(button => {

    button.addEventListener("click", function() {

        const page =
            this.getAttribute("data-page");

        openPage(page);

        addLog(
            "NAV",
            `${page.toUpperCase()} page opened`
        );

    });

});


/* =====================================================
   JOYSTICK SYSTEM
   ===================================================== */


/*
   This is the important joystick fix.

   The old problem usually happens when joystick movement
   is calculated from the stick itself instead of the
   whole joystick area.

   Here the user can press/click ANYWHERE inside the
   circular joystick.

   The stick then moves to that location.

   Pointer Events allow:
   - Mouse
   - Touch
   - Pen
*/


class VirtualJoystick {

    constructor(baseElement, stickElement, callback) {

        this.base = baseElement;
        this.stick = stickElement;

        this.callback = callback;

        this.active = false;

        this.x = 0;
        this.y = 0;


        /*
           Maximum distance the stick is allowed
           to move from the center.
        */

        this.maxDistance =
            this.base.clientWidth / 2 - 38;


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

        /*
           Prevent browser scrolling/dragging.
        */

        event.preventDefault();

        this.active = true;

        /*
           Capture pointer so movement continues
           even if pointer moves slightly outside.
        */

        try {
            this.base.setPointerCapture(event.pointerId);
        } catch (e) {}

        this.updatePosition(event);

    }


    move(event) {

        if (!this.active) return;

        event.preventDefault();

        this.updatePosition(event);

    }


    updatePosition(event) {

        const rect =
            this.base.getBoundingClientRect();


        /*
           Center of joystick.
        */

        const centerX =
            rect.left + rect.width / 2;

        const centerY =
            rect.top + rect.height / 2;


        /*
           Pointer distance from center.
        */

        let dx =
            event.clientX - centerX;

        let dy =
            event.clientY - centerY;


        /*
           Calculate distance.
        */

        const distance =
            Math.sqrt(dx * dx + dy * dy);


        /*
           If user pushes beyond the circle,
           clamp the stick to the edge.
        */

        if (distance > this.maxDistance) {

            const angle =
                Math.atan2(dy, dx);

            dx =
                Math.cos(angle) *
                this.maxDistance;

            dy =
                Math.sin(angle) *
                this.maxDistance;

        }


        this.x =
            dx / this.maxDistance;

        this.y =
            dy / this.maxDistance;


        /*
           Move visual joystick.
        */

        this.stick.style.left =
            `calc(50% + ${dx}px)`;

        this.stick.style.top =
            `calc(50% + ${dy}px)`;


        /*
           Send joystick values.
        */

        this.callback(
            this.x,
            -this.y
        );

    }


    end() {

        if (!this.active) return;

        this.active = false;

        /*
           Return joystick smoothly to center.
        */

        this.x = 0;
        this.y = 0;

        this.stick.style.left = "50%";
        this.stick.style.top = "50%";

        this.callback(0, 0);

    }

}


/* ================= JOYSTICK ELEMENTS ================= */

const leftJoystick =
    document.getElementById("leftJoystick");

const leftStick =
    document.getElementById("leftStick");

const rightJoystick =
    document.getElementById("rightJoystick");

const rightStick =
    document.getElementById("rightStick");


/* ================= VALUES ================= */

const throttleValue =
    document.getElementById("throttleValue");

const yawValue =
    document.getElementById("yawValue");

const pitchValue =
    document.getElementById("pitchValue");

const rollValue =
    document.getElementById("rollValue");


/* ================= DRONE STATE ================= */

let drone = {

    throttle: 0,
    yaw: 0,

    pitch: 0,
    roll: 0,

    armed: false

};


/* ================= LEFT JOYSTICK ================= */

/*
   Left:
   X = YAW
   Y = THROTTLE
*/

const leftControl =
    new VirtualJoystick(
        leftJoystick,
        leftStick,
        function(x, y) {

            drone.yaw =
                Math.round(x * 100);


            /*
               Bottom = 0
               Top = 100
            */

            drone.throttle =
                Math.round(
                    ((y + 1) / 2) * 100
                );


            updateDisplay();

        }
    );


/* ================= RIGHT JOYSTICK ================= */

/*
   Right:
   X = ROLL
   Y = PITCH
*/

const rightControl =
    new VirtualJoystick(
        rightJoystick,
        rightStick,
        function(x, y) {

            drone.roll =
                Math.round(x * 100);

            drone.pitch =
                Math.round(y * 100);

            updateDisplay();

        }
    );


/* =====================================================
   DISPLAY UPDATE
   ===================================================== */

function updateDisplay() {

    throttleValue.textContent =
        `${drone.throttle}%`;

    yawValue.textContent =
        `${drone.yaw}%`;

    pitchValue.textContent =
        `${drone.pitch}%`;

    rollValue.textContent =
        `${drone.roll}%`;


    document.getElementById("telePitch").textContent =
        `${drone.pitch}°`;

    document.getElementById("teleRoll").textContent =
        `${drone.roll}°`;

    document.getElementById("teleYaw").textContent =
        `${drone.yaw}°`;


    calculateMotors();

}


/* =====================================================
   MOTOR MIXING
   ===================================================== */


/*
   Basic quadcopter-style mixing for the interface.

   M1 = Front Right
   M2 = Rear Right
   M3 = Rear Left
   M4 = Front Left

   This follows your VAJRA motor numbering.
*/


function calculateMotors() {

    let throttle =
        drone.throttle;


    let pitch =
        drone.pitch * 0.35;

    let roll =
        drone.roll * 0.35;

    let yaw =
        drone.yaw * 0.20;


    let m1 =
        throttle
        - pitch
        - roll
        - yaw;


    let m2 =
        throttle
        + pitch
        - roll
        + yaw;


    let m3 =
        throttle
        + pitch
        + roll
        - yaw;


    let m4 =
        throttle
        - pitch
        + roll
        + yaw;


    m1 = clamp(m1, 0, 100);
    m2 = clamp(m2, 0, 100);
    m3 = clamp(m3, 0, 100);
    m4 = clamp(m4, 0, 100);


    updateMotor("m1", m1);
    updateMotor("m2", m2);
    updateMotor("m3", m3);
    updateMotor("m4", m4);

}


function updateMotor(name, value) {

    const bar =
        document.getElementById(name + "Bar");

    const text =
        document.getElementById(name + "Text");


    bar.style.width =
        `${value}%`;

    text.textContent =
        `${Math.round(value)}%`;

}


function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


/* =====================================================
   COMMAND BUTTONS
   ===================================================== */

const armButton =
    document.getElementById("armButton");

const takeoffButton =
    document.getElementById("takeoffButton");

const landButton =
    document.getElementById("landButton");

const emergencyButton =
    document.getElementById("emergencyButton");

const commandStatus =
    document.getElementById("commandStatus");


armButton.addEventListener("click", function() {

    drone.armed =
        !drone.armed;


    if (drone.armed) {

        commandStatus.textContent =
            "SYSTEM ARMED — READY FOR FLIGHT";

        armButton.textContent =
            "DISARM";

        addLog(
            "FLIGHT",
            "Drone armed"
        );

    } else {

        commandStatus.textContent =
            "SYSTEM STANDBY";

        armButton.textContent =
            "ARM";

        addLog(
            "FLIGHT",
            "Drone disarmed"
        );

    }

});


takeoffButton.addEventListener("click", function() {

    if (!drone.armed) {

        commandStatus.textContent =
            "ARM SYSTEM FIRST";

        addLog(
            "WARNING",
            "Takeoff blocked — drone not armed"
        );

        return;

    }


    commandStatus.textContent =
        "TAKEOFF COMMAND SENT";

    addLog(
        "FLIGHT",
        "Takeoff command sent"
    );

});


landButton.addEventListener("click", function() {

    commandStatus.textContent =
        "LANDING COMMAND SENT";

    addLog(
        "FLIGHT",
        "Landing command sent"
    );

});


emergencyButton.addEventListener("click", function() {

    drone.armed = false;

    drone.throttle = 0;
    drone.yaw = 0;
    drone.pitch = 0;
    drone.roll = 0;


    updateDisplay();


    armButton.textContent =
        "ARM";


    commandStatus.textContent =
        "⚠ EMERGENCY STOP ACTIVATED";


    addLog(
        "EMERGENCY",
        "Emergency stop activated"
    );

});


/* =====================================================
   LOG SYSTEM
   ===================================================== */

const logContainer =
    document.getElementById("logContainer");


function addLog(type, message) {

    if (!logContainer) return;


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


    const entry =
        document.createElement("div");


    entry.className =
        "log-entry";


    entry.innerHTML = `
        <span>${time}</span>
        <strong>${type}</strong>
        ${message}
    `;


    logContainer.prepend(entry);

}


document
    .getElementById("clearLogs")
    .addEventListener("click", function() {

        logContainer.innerHTML = "";

        addLog(
            "SYSTEM",
            "Flight logs cleared"
        );

    });


/* =====================================================
   SETTINGS
   ===================================================== */

const controlMode =
    document.getElementById("controlMode");


controlMode.addEventListener("click", function() {

    this.classList.toggle("active");


    if (this.classList.contains("active")) {

        this.textContent = "ON";

        addLog(
            "SETTINGS",
            "Joystick control enabled"
        );

    } else {

        this.textContent = "OFF";

        addLog(
            "SETTINGS",
            "Joystick control disabled"
        );

    }

});


/* =====================================================
   DEMO TELEMETRY
   ===================================================== */


/*
   These values are only simulated in the website.

   They are NOT actual MPU6050 / ESP32 telemetry yet.
*/

setInterval(function() {

    if (app.classList.contains("hidden")) {
        return;
    }


    const altitude =
        drone.throttle * 0.04;


    const speed =
        Math.abs(drone.pitch) * 0.02 +
        Math.abs(drone.roll) * 0.02;


    document.getElementById("altitude").textContent =
        altitude.toFixed(1) + " m";


    document.getElementById("speed").textContent =
        speed.toFixed(1) + " m/s";


}, 300);


/* =====================================================
   INITIAL STATE
   ===================================================== */

showLogin();

updateDisplay();
