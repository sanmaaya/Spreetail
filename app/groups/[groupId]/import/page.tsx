// app/groups/[groupId]/import/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface ImportIssue {
  rowNumber: number;
  description: string;
  issues: string[];
}

interface DuplicateMatch {
  row1: any;
  row2: any;
  message: string;
}

interface ConflictMatch {
  row1: any;
  row2: any;
  message: string;
}

export default function ImportWizardPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = Number(params.groupId);

  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    sanitizedRows: any[];
    issues: ImportIssue[];
    duplicates: DuplicateMatch[];
    conflicts: ConflictMatch[];
  } | null>(null);

  // User resolutions
  const [duplicateResolutions, setDuplicateResolutions] = useState<Record<number, boolean>>({}); // rowNum -> shouldKeep
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, "row1" | "row2" | "both">>({}); // key -> choice

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setAnalyzing(true);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
        
        // Initialize duplicate resolutions (default to deleting the second duplicate, i.e., keep = false)
        const dupRes: Record<number, boolean> = {};
        data.duplicates.forEach((d: DuplicateMatch) => {
          dupRes[d.row2.rowNumber] = false; // default: discard row2
        });
        setDuplicateResolutions(dupRes);

        // Initialize conflict resolutions (default to row1 or row2 depending on policy, e.g. row1)
        const confRes: Record<string, "row1" | "row2" | "both"> = {};
        data.conflicts.forEach((c: ConflictMatch, idx: number) => {
          confRes[`conf_${idx}`] = "row1"; // default: keep row1
        });
        setConflictResolutions(confRes);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to upload file");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred during upload");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!results) return;
    setImporting(true);

    try {
      // Filter the sanitized rows based on user resolutions
      const rowsToSave: any[] = [];
      const rowsToDiscard = new Set<number>();

      // Apply duplicate resolutions
      Object.entries(duplicateResolutions).forEach(([rowNumStr, shouldKeep]) => {
        if (!shouldKeep) {
          rowsToDiscard.add(Number(rowNumStr));
        }
      });

      // Apply conflict resolutions
      results.conflicts.forEach((c, idx) => {
        const choice = conflictResolutions[`conf_${idx}`];
        if (choice === "row1") {
          rowsToDiscard.add(c.row2.rowNumber);
        } else if (choice === "row2") {
          rowsToDiscard.add(c.row1.rowNumber);
        }
      });

      results.sanitizedRows.forEach((row) => {
        if (!rowsToDiscard.has(row.rowNumber)) {
          rowsToSave.push(row);
        }
      });

      const confirmRes = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          rows: rowsToSave,
        }),
      });

      if (confirmRes.ok) {
        alert("Import completed successfully!");
        router.push(`/groups/${groupId}`);
        router.refresh();
      } else {
        const errorData = await confirmRes.json();
        alert(errorData.error || "Failed to confirm import");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred during import confirmation");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans p-6 sm:p-12 transition-colors duration-200">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            href={`/groups/${groupId}`}
            className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="text-left">
          <h1 className="text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100">CSV Import Wizard</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-light">
            Upload the flat roommate spreadsheet log and let the wizard solve the inconsistencies.
          </p>
        </div>

        {/* Step 1: Upload File */}
        {!results && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-8 backdrop-blur-xl shadow-sm">
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="mt-4 flex text-sm text-zinc-600 dark:text-zinc-400 justify-center font-medium">
                  <label className="relative cursor-pointer rounded-md font-bold text-amber-600 dark:text-amber-500 focus-within:outline-none hover:text-amber-700 dark:hover:text-amber-400">
                    <span>Upload a CSV file</span>
                    <input
                      type="file"
                      required
                      accept=".csv"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-zinc-500 mt-2 font-mono">
                  {file ? file.name : "Select a spreadsheet file (e.g. expenses_export.csv)"}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!file || analyzing}
                  className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/10 hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  {analyzing ? "Analyzing CSV..." : "Analyze Spreadsheet"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Resolution Screen */}
        {results && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* Summary */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-xl shadow-sm">
              <h2 className="text-xl font-serif font-semibold mb-2 text-zinc-805 dark:text-zinc-200">Analysis Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-center">
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-900">
                  <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">{results.sanitizedRows.length}</div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-medium">Total Rows</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-900">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{results.issues.length}</div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-medium">Issues Found</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-900">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-500">{results.duplicates.length}</div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-medium">Duplicates</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-900">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{results.conflicts.length}</div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-medium">Conflicts</div>
                </div>
              </div>
            </div>

            {/* Detailed Warnings / Issues */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-xl shadow-sm">
              <h2 className="text-xl font-serif font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Validation Warnings (Aisha / Rohan / Sam / Priya)</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {results.issues.map((i, idx) => (
                  <div key={idx} className="bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200 dark:border-zinc-900 text-sm">
                    <span className="font-bold text-amber-600 dark:text-amber-505 font-mono">Row {i.rowNumber}</span>:{" "}
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{i.description}</span>
                    <ul className="list-disc list-inside mt-2 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                      {i.issues.map((msg, subIdx) => (
                        <li key={subIdx}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Duplicates Approval */}
            {results.duplicates.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-xl shadow-sm">
                <h2 className="text-xl font-serif font-semibold mb-2 text-zinc-800 dark:text-zinc-200">
                  Duplicates Approval (Meera)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 mb-4">
                  Check the duplicate entries you want to keep. Unchecked duplicates will be safely merged/discarded.
                </p>
                <div className="space-y-4">
                  {results.duplicates.map((d, idx) => {
                    const row2Num = d.row2.rowNumber;
                    const isChecked = duplicateResolutions[row2Num] || false;
                    return (
                      <div
                        key={idx}
                        className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 p-4 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="text-sm">
                          <p className="text-zinc-800 dark:text-zinc-200 font-medium">{d.message}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-1 font-mono">
                            Row {d.row1.rowNumber}: Paid by {d.row1.paidBy} (₹{d.row1.amountInINR.toFixed(2)})
                          </p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold bg-zinc-50 dark:bg-zinc-955 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-750 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setDuplicateResolutions((prev) => ({
                                ...prev,
                                [row2Num]: e.target.checked,
                              }))
                            }
                            className="rounded text-amber-500 focus:ring-amber-500 animate-pulse-slow"
                          />
                          <span>Keep duplicate</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conflicts Resolution */}
            {results.conflicts.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-6 backdrop-blur-xl shadow-sm">
                <h2 className="text-xl font-serif font-semibold mb-2 text-zinc-850 dark:text-zinc-200">
                  Conflicts Resolution (Meera)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 mb-4">
                  These rows refer to the same event but have differing amounts or payers. Choose which version is correct.
                </p>
                <div className="space-y-6">
                  {results.conflicts.map((c, idx) => {
                    const key = `conf_${idx}`;
                    const val = conflictResolutions[key] || "row1";
                    return (
                      <div key={idx} className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 p-4 rounded-xl space-y-3">
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{c.message}</p>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setConflictResolutions((prev) => ({ ...prev, [key]: "row1" }))
                            }
                            className={`p-3 rounded-xl border text-xs text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                              val === "row1"
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-200 font-bold"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700"
                            }`}
                          >
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Keep Row {c.row1.rowNumber} Only (Payer: {c.row1.paidBy})</span>
                            <span className="font-mono mt-1 font-bold text-sm">₹{c.row1.amountInINR.toFixed(2)}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConflictResolutions((prev) => ({ ...prev, [key]: "row2" }))
                            }
                            className={`p-3 rounded-xl border text-xs text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                              val === "row2"
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-200 font-bold"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955/40 text-zinc-550 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700"
                            }`}
                          >
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Keep Row {c.row2.rowNumber} Only (Payer: {c.row2.paidBy})</span>
                            <span className="font-mono mt-1 font-bold text-sm">₹{c.row2.amountInINR.toFixed(2)}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConflictResolutions((prev) => ({ ...prev, [key]: "both" }))
                            }
                            className={`p-3 rounded-xl border text-xs text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                              val === "both"
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-955/20 text-amber-750 dark:text-amber-200 font-bold"
                                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955/40 text-zinc-550 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700"
                            }`}
                          >
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Keep Both Logs</span>
                            <span className="text-xxs text-zinc-450 dark:text-zinc-500 mt-2 font-sans font-light">Imports both entries independently</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirm & Save Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setResults(null)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              >
                Cancel and Restart
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing}
                className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-600/10 hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
              >
                {importing ? "Importing Ledger..." : "Approve and Confirm Import"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
