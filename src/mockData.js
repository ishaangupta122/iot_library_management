export const MOCK_NOW = "2026-11-03T09:30:00.000Z";

export const library = { name: "Central Library" };

export const operatingHours = [
  { day: 0, label: "Sunday", open: "10:00", close: "18:00", closed: false },
  { day: 1, label: "Monday", open: "08:00", close: "22:00", closed: false },
  { day: 2, label: "Tuesday", open: "08:00", close: "22:00", closed: false },
  { day: 3, label: "Wednesday", open: "08:00", close: "22:00", closed: false },
  { day: 4, label: "Thursday", open: "08:00", close: "22:00", closed: false },
  { day: 5, label: "Friday", open: "08:00", close: "22:00", closed: false },
  { day: 6, label: "Saturday", open: "09:00", close: "20:00", closed: false },
];

export const floors = [{ id: "FLR-1", name: "Ground Floor" }];

export const seats = [
  { id: "SEAT-001", number: "A", floorId: "FLR-1", deviceId: "S-01", enabled: true, maintenance: false },
  { id: "SEAT-002", number: "B", floorId: "FLR-1", deviceId: "S-02", enabled: true, maintenance: false },
  { id: "SEAT-003", number: "C", floorId: "FLR-1", deviceId: "S-03", enabled: true, maintenance: false },
  { id: "SEAT-004", number: "D", floorId: "FLR-1", deviceId: "S-04", enabled: true, maintenance: true },
];

export const devices = [
  { id: "S-01", seatId: "SEAT-001", isActive: true },
  { id: "S-02", seatId: "SEAT-002", isActive: true },
  { id: "S-03", seatId: "SEAT-003", isActive: true },
  { id: "S-04", seatId: "SEAT-004", isActive: false },
];

export const sensorReadings = {
  "S-01": { value: 1, occupied: true, onBreak: false },
  "S-02": { value: 0, occupied: false, onBreak: false },
  "S-03": { value: 2, occupied: false, onBreak: true },
};

export const students = [
  { id: "1024031118", name: "Ishaan Gupta" },
  { id: "1024031135", name: "Saksham Kansal" },
  { id: "1024031137", name: "Sanshi" },
  { id: "1024031101", name: "Aarav Sharma" },
  { id: "1024031104", name: "Diya Mehta" },
  { id: "1024031109", name: "Kabir Singh" },
  { id: "1024031112", name: "Ananya Verma" },
  { id: "1024031121", name: "Rohan Kapoor" },
  { id: "1024031126", name: "Ishita Bansal" },
  { id: "1024031130", name: "Arjun Malhotra" },
];
