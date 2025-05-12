const usersNum = document.getElementById("users-num");
const lightStatus = document.getElementById("light-status");

let lastUsersCount = 0;
let stationUsers = [];

Edrys.onReady(async () => {
  usersNum.innerText = 0;
  lightStatus.innerText = "OFF";

  if (!Edrys.module.stationConfig?.lightIp) {
    console.warn("Light IP not configured in stationConfig");
  }

  checkUsersInStation();

  setInterval(() => {
    checkUsersInStation();
  }, 2000);

  document.getElementById("light-status").className = "light-indicator off";
});

checkUsersInStation = () => {
  if (Edrys.liveUser.room.startsWith("Station")) {
    const currentStationUsers = Object.values(Edrys.liveClass.users).filter(
      (user) => {
        return (
          !user.displayName.startsWith("Station") &&
          user.room.startsWith("Station")
        );
      }
    );

    const currentCount = currentStationUsers.length;

    const hasChanged = currentCount !== lastUsersCount;

    if (hasChanged) {
      usersNum.innerText = currentCount;

      // If users have entered or left the station, update light status
      if (currentCount > 0 && lastUsersCount === 0) {
        setLightState(true);
      } else if (currentCount === 0 && lastUsersCount > 0) {
        setLightState(false);
      }

      lastUsersCount = currentCount;
    }

    return hasChanged;
  }
  return false;
};

let lightOn = false;

async function setLightState(on) {
  const lightIp = Edrys.module.stationConfig?.lightIp;

  if (!lightIp) {
    console.error("Light IP not configured in stationConfig");
    return;
  }

  lightOn = on;
  const indicator = document.getElementById("light-status");
  indicator.innerText = on ? "ON" : "OFF";
  indicator.className = on ? "light-indicator on" : "light-indicator off";

  try {
    await fetch("http://localhost:3000/api/light", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        on: on ? 1 : 0,
        brightness: 50,
        temperature: 213,
        ip: lightIp,
      }),
    });
  } catch (error) {
    console.error("Failed to set light state:", error);
  }
}
