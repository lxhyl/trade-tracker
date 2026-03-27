"use client";

import { useEffect, useRef } from "react";
import { useStyleTheme } from "@/components/StyleThemeProvider";

type Point = {
  x: number;
  y: number;
};

const START_DISTANCE_THRESHOLD = 6;
const POINT_DISTANCE_THRESHOLD = 1.5;
const MAX_STROKES = 120;

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'
    )
  );
}

function getPagePoint(event: PointerEvent): Point {
  return {
    x: event.clientX + window.scrollX,
    y: event.clientY + window.scrollY,
  };
}

export function SketchyDrawingLayer() {
  const { styleTheme } = useStyleTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Point[][]>([]);
  const activeStrokeRef = useRef<Point[] | null>(null);
  const pendingPointRef = useRef<Point | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (canvasRef.current === null) return;
    const currentCanvas = canvasRef.current;

    function syncCanvasSize() {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const pixelWidth = Math.floor(width * dpr);
      const pixelHeight = Math.floor(height * dpr);

      if (currentCanvas.width === pixelWidth && currentCanvas.height === pixelHeight) return;

      currentCanvas.width = pixelWidth;
      currentCanvas.height = pixelHeight;
      currentCanvas.style.width = `${width}px`;
      currentCanvas.style.height = `${height}px`;
    }

    function drawStroke(ctx: CanvasRenderingContext2D, stroke: Point[]) {
      if (stroke.length === 0) return;

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Quadratic bezier smoothing for natural pen feel
      const traceStroke = () => {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x - scrollX, stroke[0].y - scrollY);

        if (stroke.length === 1) {
          ctx.lineTo(stroke[0].x - scrollX + 0.5, stroke[0].y - scrollY + 0.5);
          return;
        }

        for (let i = 1; i < stroke.length - 1; i += 1) {
          const mx = (stroke[i].x + stroke[i + 1].x) / 2 - scrollX;
          const my = (stroke[i].y + stroke[i + 1].y) / 2 - scrollY;
          ctx.quadraticCurveTo(stroke[i].x - scrollX, stroke[i].y - scrollY, mx, my);
        }
        const last = stroke[stroke.length - 1];
        ctx.lineTo(last.x - scrollX, last.y - scrollY);
      };

      traceStroke();
      ctx.strokeStyle = "rgba(143, 120, 86, 0.28)";
      ctx.lineWidth = 5.5;
      ctx.stroke();

      traceStroke();
      ctx.strokeStyle = "rgba(58, 44, 28, 0.88)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    function redraw() {
      rafRef.current = null;
      syncCanvasSize();

      const ctx = currentCanvas.getContext("2d");
      if (!ctx) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (styleTheme !== "sketchy") return;

      for (const stroke of strokesRef.current) {
        drawStroke(ctx, stroke);
      }
    }

    function scheduleRedraw() {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(redraw);
    }

    function finishStroke() {
      activeStrokeRef.current = null;
      pendingPointRef.current = null;
      pointerIdRef.current = null;
      document.documentElement.classList.remove("sketchy-drawing-active");
    }

    function handlePointerDown(event: PointerEvent) {
      if (styleTheme !== "sketchy") return;
      if (event.button !== 0) return;
      if (event.pointerType !== "mouse") return;
      if (isEditableTarget(event.target)) return;

      pointerIdRef.current = event.pointerId;
      pendingPointRef.current = getPagePoint(event);
      activeStrokeRef.current = null;
    }

    function handlePointerMove(event: PointerEvent) {
      if (pointerIdRef.current === null || event.pointerId !== pointerIdRef.current) return;
      if ((event.buttons & 1) !== 1) {
        finishStroke();
        return;
      }

      const point = getPagePoint(event);
      const pendingPoint = pendingPointRef.current;

      if (!pendingPoint) return;

      if (!activeStrokeRef.current) {
        if (distanceBetween(pendingPoint, point) < START_DISTANCE_THRESHOLD) return;

        const newStroke = [pendingPoint, point];
        strokesRef.current.push(newStroke);
        if (strokesRef.current.length > MAX_STROKES) {
          strokesRef.current.shift();
        }

        activeStrokeRef.current = newStroke;
        document.documentElement.classList.add("sketchy-drawing-active");
        scheduleRedraw();
        return;
      }

      const stroke = activeStrokeRef.current;
      const lastPoint = stroke[stroke.length - 1];
      if (distanceBetween(lastPoint, point) < POINT_DISTANCE_THRESHOLD) return;

      stroke.push(point);
      scheduleRedraw();
    }

    function handlePointerUp(event: PointerEvent) {
      if (pointerIdRef.current === null || event.pointerId !== pointerIdRef.current) return;
      finishStroke();
    }

    function handleWindowBlur() {
      finishStroke();
    }

    function handleVisibilityChange() {
      if (!document.hidden) return;
      finishStroke();
    }

    if (styleTheme !== "sketchy") {
      strokesRef.current = [];
      finishStroke();
    }

    scheduleRedraw();

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerUp, true);
    window.addEventListener("resize", scheduleRedraw);
    window.addEventListener("scroll", scheduleRedraw, true);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      finishStroke();

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("pointerup", handlePointerUp, true);
      window.removeEventListener("pointercancel", handlePointerUp, true);
      window.removeEventListener("resize", scheduleRedraw);
      window.removeEventListener("scroll", scheduleRedraw, true);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [styleTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9998]"
      style={{ display: styleTheme === "sketchy" ? "block" : "none" }}
    />
  );
}
