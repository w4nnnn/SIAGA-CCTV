const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatLocationDisplayName(loc: {
  category: string;
  name: string;
}): string {
  return `${loc.category.trim()} ${loc.name.trim()}`.trim();
}

export function formatIndonesianDateHeader(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);

  const dateObj = new Date(Date.UTC(year, monthIndex, day));
  const dayName = INDONESIAN_DAYS[dateObj.getUTCDay()];
  const monthName = INDONESIAN_MONTHS[monthIndex];
  const paddedDay = String(day).padStart(2, "0");

  return `${dayName}, ${paddedDay} ${monthName} ${year}`;
}

export function formatIndonesianMonthYear(monthKeyOrDate: string): string {
  const parts = monthKeyOrDate.split("-");
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  const monthName = INDONESIAN_MONTHS[monthIndex] ?? parts[1];
  return `${monthName} ${year}`;
}
