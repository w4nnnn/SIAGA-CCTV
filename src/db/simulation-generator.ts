export interface SimulationLocationConfig {
  category: string;
  name: string;
  sortOrder: number;
}

export interface SimulationUserConfig {
  username: string;
  name: string;
  role: "ADMIN" | "PETUGAS";
  assignedLocationIndices: number[];
}

export interface GeneratedDailyReport {
  locationIndex: number;
  reportDate: string;
  status: "ON" | "OFF";
  notes: string | null;
}

export const SIMULATION_LOCATIONS: SimulationLocationConfig[] = [
  { category: "AFT", name: "Juanda", sortOrder: 1 },
  { category: "IT", name: "Surabaya", sortOrder: 2 },
  { category: "IT", name: "Bima", sortOrder: 3 },
  { category: "LPG", name: "Surabaya", sortOrder: 4 },
  { category: "BP", name: "Gresik", sortOrder: 5 },
  { category: "FT", name: "Malang", sortOrder: 6 },
  { category: "FT", name: "Madiun", sortOrder: 7 },
  { category: "FT", name: "Tuban", sortOrder: 8 },
  { category: "FT", name: "Camplong", sortOrder: 9 },
  { category: "FT", name: "Bandaran", sortOrder: 10 },
];

export const SIMULATION_USERS: SimulationUserConfig[] = [
  {
    username: "admin",
    name: "Supervisor CCTV",
    role: "ADMIN",
    assignedLocationIndices: [],
  },
  {
    username: "petugas_1",
    name: "Petugas Rayon Surabaya",
    role: "PETUGAS",
    assignedLocationIndices: [0, 1, 3, 4],
  },
  {
    username: "petugas_2",
    name: "Petugas Rayon Barat & Selatan",
    role: "PETUGAS",
    assignedLocationIndices: [5, 6, 7],
  },
  {
    username: "petugas_3",
    name: "Petugas Rayon Madura & Kepulauan",
    role: "PETUGAS",
    assignedLocationIndices: [2, 8, 9],
  },
];

export const REALISTIC_OFF_NOTES: string[] = [
  "Koneksi jaringan terputus (RTO / link down)",
  "Kamera buram / lensa terhalang debu dan embun",
  "NVR restart / power supply unit failure",
  "Perbaikan jalur kabel fiber optik di area tangki",
  "Kamera offline pasca pemadaman listrik PLN",
  "Koneksi switch POE intermittent",
  "Kamera freeze / streaming timeout dari server",
];

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPast30Days(referenceDate: Date = new Date()): string[] {
  const dates: string[] = [];
  const base = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  for (let i = 29; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    dates.push(formatLocalDate(d));
  }

  return dates;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateSimulationReports(dates: string[]): GeneratedDailyReport[] {
  const reports: GeneratedDailyReport[] = [];

  for (const dateStr of dates) {
    for (let locIdx = 0; locIdx < SIMULATION_LOCATIONS.length; locIdx++) {
      const hash = hashString(`${dateStr}_loc_${locIdx}`);
      const isOff = hash % 100 < 12; // ~12% OFF

      if (isOff) {
        const noteIdx = hash % REALISTIC_OFF_NOTES.length;
        reports.push({
          locationIndex: locIdx,
          reportDate: dateStr,
          status: "OFF",
          notes: REALISTIC_OFF_NOTES[noteIdx],
        });
      } else {
        reports.push({
          locationIndex: locIdx,
          reportDate: dateStr,
          status: "ON",
          notes: null,
        });
      }
    }
  }

  return reports;
}
