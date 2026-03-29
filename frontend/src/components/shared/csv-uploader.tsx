'use client';

import React, { useRef, useState } from "react";
import Papa, { type ParseResult } from "papaparse";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileType, CheckCircle2, AlertCircle, X, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CsvUploaderProps<T> {
  onDataParsed: (data: T[]) => void;
  expectedHeaders?: string[];
  buttonText?: string;
  title?: string;
  description?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
  sampleTemplate?: string;
}

export function CsvUploader<T>({
  onDataParsed,
  expectedHeaders,
  buttonText = "Upload CSV",
  title = "Upload Data",
  description = "Upload a CSV file to bulk import records.",
  isOpen,
  onOpenChange,
  isLoading = false,
  sampleTemplate,
}: CsvUploaderProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<T[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setError(null);
    setParsedData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(resetState, 300); // clear on close animation
    }
    onOpenChange(open);
  };

  const downloadSample = () => {
    if (!sampleTemplate) return;
    const blob = new Blob([sampleTemplate], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample-template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please select a valid CSV file.");
      return;
    }

    setFile(selectedFile);
    setError(null);

    Papa.parse<T>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically converts numbers/booleans
      complete: (results: ParseResult<T>) => {
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          return;
        }

        if (expectedHeaders && expectedHeaders.length > 0) {
          const headers = results.meta.fields || [];
          const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            setError(`Missing required columns: ${missingHeaders.join(", ")}`);
            return;
          }
        }

        if (results.data.length === 0) {
          setError("The uploaded CSV file is empty or has no valid rows.");
          return;
        }

        setParsedData(results.data);
      },
      error: (error: Error) => {
        setError(`Failed to read file: ${error.message}`);
      },
    });
  };

  const handleImport = () => {
    if (parsedData.length > 0) {
      onDataParsed(parsedData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="display-heading flex items-center justify-between gap-2 text-2xl w-full">
            <span className="flex items-center gap-2">
              <FileType className="h-5 w-5" />
              {title}
            </span>
            {sampleTemplate && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8 text-xs font-normal"
                onClick={downloadSample}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Template
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {!file && (
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center hover:bg-muted/40 transition-colors cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select a CSV file</p>
              <p className="mt-1 text-xs text-muted-foreground">
                or drag and drop here
              </p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />

          {file && !error && (
            <div className="flex flex-col gap-3 rounded-md border border-border/80 bg-background/50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-medium leading-none">
                      {file.name}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {parsedData.length} valid rows found
                    </p>
                  </div>
                </div>
                {!isLoading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={resetState}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Validation Error</p>
                <p className="mt-1 text-xs opacity-90">{error}</p>
                {!isLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/20"
                    onClick={() => {
                      setError(null);
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Try again
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || !!error || parsedData.length === 0 || isLoading}
          >
            {isLoading ? "Importing..." : `Import ${parsedData.length} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
