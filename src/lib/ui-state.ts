export interface BatchFormRowState {
  locationId: string;
  displayName: string;
  status: "ON" | "OFF";
  notes: string;
  isAlreadyReported: boolean;
}

export function createInitialBatchFormState(
  locationsWithStatus: Array<{
    locationId: string;
    displayName: string;
    report: { status: "ON" | "OFF"; notes: string | null } | null;
  }>
): BatchFormRowState[] {
  return locationsWithStatus.map((loc) => ({
    locationId: loc.locationId,
    displayName: loc.displayName,
    status: loc.report ? loc.report.status : "ON",
    notes:
      loc.report && loc.report.status === "OFF"
        ? (loc.report.notes ?? "")
        : "",
    isAlreadyReported: Boolean(loc.report),
  }));
}

export function applySelectAllOn(
  rows: BatchFormRowState[]
): BatchFormRowState[] {
  return rows.map((row) => ({
    ...row,
    status: "ON",
    notes: "",
  }));
}

export function updateRowStatus(
  rows: BatchFormRowState[],
  locationId: string,
  status: "ON" | "OFF"
): BatchFormRowState[] {
  return rows.map((row) => {
    if (row.locationId !== locationId) return row;
    return {
      ...row,
      status,
      notes: status === "ON" ? "" : row.notes,
    };
  });
}

export function updateRowNotes(
  rows: BatchFormRowState[],
  locationId: string,
  notes: string
): BatchFormRowState[] {
  return rows.map((row) => {
    if (row.locationId !== locationId) return row;
    return {
      ...row,
      notes: row.status === "OFF" ? notes : "",
    };
  });
}

export function buildExportDownloadUrl(
  format: "excel" | "pdf",
  filter: {
    startDate: string;
    endDate: string;
    locationId?: string;
    status?: "ALL" | "ON" | "OFF" | "UNREPORTED";
  }
): string {
  const params = new URLSearchParams();
  params.set("startDate", filter.startDate);
  params.set("endDate", filter.endDate);
  if (filter.locationId && filter.locationId.trim().length > 0) {
    params.set("locationId", filter.locationId.trim());
  }
  if (filter.status) {
    params.set("status", filter.status);
  }
  return `/api/export/${format}?${params.toString()}`;
}

export function resolveInitialTheme(
  savedTheme: string | null | undefined,
  prefersDark: boolean
): "light" | "dark" {
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return prefersDark ? "dark" : "light";
}

export interface NavItem {
  href: string;
  label: string;
  iconName: "dashboard" | "rekap" | "master" | "input" | "riwayat";
}

export function getNavigationItemsForRole(role: "ADMIN" | "PETUGAS"): NavItem[] {
  if (role === "ADMIN") {
    return [
      { href: "/admin", label: "Dashboard Harian", iconName: "dashboard" },
      { href: "/admin/rekap", label: "Rekap & Export", iconName: "rekap" },
      { href: "/admin/master", label: "Master Lokasi & User", iconName: "master" },
      { href: "/petugas", label: "Input Laporan", iconName: "input" },
    ];
  }
  return [
    { href: "/petugas", label: "Input Harian", iconName: "input" },
    { href: "/petugas/riwayat", label: "Riwayat & Edit", iconName: "riwayat" },
  ];
}
