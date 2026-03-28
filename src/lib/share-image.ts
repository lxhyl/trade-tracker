"use client";

export type ShareImageResult = "shared" | "downloaded";

interface ExportElementAsPngOptions {
  element: HTMLElement;
  filename: string;
  backgroundColor: string;
  skipFonts?: boolean;
}

export function supportsNativeImageShare(): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof File === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function"
  ) {
    return false;
  }

  try {
    const probe = new File([""], "share-test.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export function isShareCancelledError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export async function exportElementAsPng({
  element,
  filename,
  backgroundColor,
  skipFonts = false,
}: ExportElementAsPngOptions): Promise<ShareImageResult> {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor,
    skipFonts,
  });

  const blob = await fetch(dataUrl).then((response) => response.blob());
  const file = new File([blob], filename, { type: "image/png" });

  if (supportsNativeImageShare()) {
    await navigator.share({ files: [file] });
    return "shared";
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
  return "downloaded";
}
