import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { getDateRangeRecap } from "@/server/services/recap.service";
import { generateExcelRecapBuffer } from "@/server/services/export.service";

export async function GET(req: NextRequest) {
  const user = await requireSessionUser();

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const locationId = searchParams.get("locationId") ?? undefined;
  const status =
    (searchParams.get("status") as
      | "ALL"
      | "ON"
      | "OFF"
      | "UNREPORTED"
      | null) ?? "ALL";

  const recap = await getDateRangeRecap(
    {
      startDate,
      endDate,
      locationId,
      status,
    },
    user
  );

  const buffer = await generateExcelRecapBuffer(recap);
  const filename = `Rekap-SIAGA-CCTV-${recap.startDate}_sd_${recap.endDate}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
