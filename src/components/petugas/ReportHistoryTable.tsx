"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Loader2,
  Save,
} from "lucide-react";
import {
  HistoryEditDraft,
  updateHistoryEditDraftStatus,
} from "@/lib/ui-state";
import { updateHistoricalReportAction } from "@/server/actions/report.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ReportHistoryItem {
  id: string;
  locationId: string;
  reportDate: string;
  displayName: string;
  status: "ON" | "OFF";
  notes: string | null;
}

export function ReportHistoryTable({
  items,
}: {
  items: ReportHistoryItem[];
}) {
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<ReportHistoryItem | null>(null);
  const [editingDraft, setEditingDraft] = useState<HistoryEditDraft | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openEditDialog = (item: ReportHistoryItem) => {
    setErrorMessage(null);
    setEditingItem(item);
    setEditingDraft({
      reportId: item.id,
      status: item.status,
      notes: item.status === "OFF" ? (item.notes ?? "") : "",
    });
  };

  const closeEditDialog = () => {
    setEditingItem(null);
    setEditingDraft(null);
    setErrorMessage(null);
  };

  const handleSaveEdit = () => {
    if (!editingDraft) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await updateHistoricalReportAction(editingDraft.reportId, {
          status: editingDraft.status,
          notes: editingDraft.status === "OFF" ? editingDraft.notes : null,
        });
        closeEditDialog();
        router.refresh();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal memperbarui laporan."
        );
      }
    });
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Belum ada riwayat laporan yang tersimpan.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-sm font-medium text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Tanggal</TableHead>
                <TableHead className="font-semibold">Lokasi</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Catatan Kendala</TableHead>
                <TableHead className="text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap font-mono text-sm">
                    {item.reportDate}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono font-semibold">
                    {item.displayName}
                  </TableCell>
                  <TableCell>
                    {item.status === "ON" ? (
                      <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>ON</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="gap-1.5 bg-destructive/15 text-destructive hover:bg-destructive/20"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Ada Kendala / OFF</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.notes ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                      className="cursor-pointer gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-lg font-bold">
              Edit Laporan: {editingItem?.displayName}
            </DialogTitle>
            <DialogDescription>
              Tanggal Laporan:{" "}
              <span className="font-mono font-medium text-foreground">
                {editingItem?.reportDate}
              </span>
            </DialogDescription>
          </DialogHeader>

          {editingDraft && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Pilih Status CCTV</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={editingDraft.status === "ON" ? "default" : "outline"}
                    onClick={() =>
                      setEditingDraft(
                        updateHistoryEditDraftStatus(editingDraft, "ON")
                      )
                    }
                    className={`min-h-[44px] cursor-pointer gap-2 ${
                      editingDraft.status === "ON"
                        ? "bg-emerald-600 font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                        : ""
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>ON</span>
                  </Button>

                  <Button
                    type="button"
                    variant={
                      editingDraft.status === "OFF" ? "destructive" : "outline"
                    }
                    onClick={() =>
                      setEditingDraft(
                        updateHistoryEditDraftStatus(editingDraft, "OFF")
                      )
                    }
                    className={`min-h-[44px] cursor-pointer gap-2 ${
                      editingDraft.status === "OFF"
                        ? "bg-destructive font-semibold text-white hover:bg-destructive/90"
                        : ""
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <span>Ada Kendala / OFF</span>
                  </Button>
                </div>
              </div>

              {editingDraft.status === "OFF" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="dialog-edit-notes">
                    Catatan Kendala (Opsional)
                  </Label>
                  <Textarea
                    id="dialog-edit-notes"
                    rows={3}
                    value={editingDraft.notes}
                    onChange={(e) =>
                      setEditingDraft({
                        ...editingDraft,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Contoh: Off 3 titik atau kamera area dermaga mati..."
                  />
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-muted/50 p-2.5 text-xs text-muted-foreground italic">
                  Catatan kendala otomatis dihapus saat status diubah menjadi ON.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={closeEditDialog}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleSaveEdit}
              className="cursor-pointer gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
