// Pretends to be an ESP32 so you can test without hardware.
//   node --env-file=.env.local scripts/sensor.mjs DEV-1001 occupied
//   node --env-file=.env.local scripts/sensor.mjs DEV-1001 free http://localhost:3000
const [deviceId, state, base = "http://localhost:3000"] = process.argv.slice(2);
if (!deviceId || !["occupied", "free"].includes(state)) {
  console.log("Usage: node --env-file=.env.local scripts/sensor.mjs <deviceId> <occupied|free> [baseUrl]");
  process.exit(1);
}
const response = await fetch(`${base}/api/sensor`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-key": process.env.SENSOR_API_KEY ?? "" },
  body: JSON.stringify({ deviceId, occupied: state === "occupied" }),
});
console.log(response.status, await response.text());
