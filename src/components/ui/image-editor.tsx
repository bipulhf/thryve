"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Button } from "./button";
import { Input } from "./input";
import { ZoomIn, ZoomOut, Minus, Plus } from "lucide-react";

type ImageEditorProps = {
  imageUrl: string;
  onClose?: () => void;
};

export default function ImageEditor({ imageUrl, onClose }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [strokeColor, setStrokeColor] = useState<string>("#ff0000");
  // keep fill as hex for the color input; if you need opacity, store a separate alpha state
  const [fillColor, setFillColor] = useState<string>("#ff0000");
  const [fillAlpha, setFillAlpha] = useState<number>(0.2); // optional
  const [textValue, setTextValue] = useState<string>("Sample Text");
  const [, forceRender] = useState(0);
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [zoom, setZoom] = useState<number>(1);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const canvas = new fabric.Canvas(canvasEl, {
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    // Load background image (Fabric v6 returns a Promise)
    fabric.Image.fromURL(imageUrl, { crossOrigin: "anonymous" })
      .then((img: fabric.Image) => {
        // Prefer element natural size if present
        const el = (img as any)?.getElement?.() as HTMLImageElement | undefined;
        const naturalWidth = el?.naturalWidth || (img.width as number) || 960;
        const naturalHeight =
          el?.naturalHeight || (img.height as number) || 540;

        const maxWidth = 960; // editor width
        const aspect = naturalWidth / Math.max(1, naturalHeight);
        const width = Math.min(maxWidth, naturalWidth);
        const height = Math.round(width / aspect);

        canvas.setWidth(width);
        canvas.setHeight(height);
        setZoom(1);

        // Prepare background image to exactly fit the canvas
        img.set({
          selectable: false,
          evented: false,
          left: 0,
          top: 0,
          originX: "left",
          originY: "top",
        });
        const scaleX = width / Math.max(1, (img.width as number) || width);
        const scaleY = height / Math.max(1, (img.height as number) || height);

        if (typeof (canvas as any).setBackgroundImage === "function") {
          (canvas as any).setBackgroundImage(img, {
            scaleX,
            scaleY,
            left: 0,
            top: 0,
          });
          canvas.renderAll();
        } else {
          img.set({ scaleX, scaleY });
          canvas.add(img);
          canvas.renderAll();
        }
      })
      .catch(() => {
        // ignore load errors
      });

    return () => {
      try {
        canvas.dispose();
      } catch (e) {
        // defensive
      }
      fabricRef.current = null;
    };
  }, [imageUrl]);

  const rgbaFromHex = (hex: string, alpha = 1) => {
    const h = hex.replace("#", "");
    const bigint = parseInt(
      h.length === 3
        ? h
            .split("")
            .map((ch) => ch + ch)
            .join("")
        : h,
      16
    );
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const updateSelectedColors = () => {
    const c = fabricRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (!active) return;
    // Textbox uses fill for text color
    if ((active as any).type === "textbox") {
      (active as any).set({ fill: strokeColor });
    } else {
      (active as any).set({
        stroke: strokeColor,
        fill: rgbaFromHex(fillColor, fillAlpha),
      });
    }
    c.requestRenderAll();
  };

  const removeSelected = () => {
    const c = fabricRef.current;
    if (!c) return;
    const actives = c.getActiveObjects();
    if (!actives || actives.length === 0) return;
    actives.forEach((obj) => c.remove(obj));
    c.discardActiveObject();
    c.requestRenderAll();
    forceRender((x) => x + 1);
  };

  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // Prevent deleting when typing in inputs
        const target = e.target as HTMLElement | null;
        const isInput =
          target &&
          (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
        if (isInput) return;
        e.preventDefault();
        removeSelected();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const addRect = () => {
    const c = fabricRef.current;
    if (!c) return;
    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 200,
      height: 120,
      fill: rgbaFromHex(fillColor, fillAlpha),
      stroke: strokeColor,
      strokeWidth,
      rx: 6,
      ry: 6,
    });
    c.add(rect);
    c.setActiveObject(rect);
    c.renderAll();
  };

  const addCircle = () => {
    const c = fabricRef.current;
    if (!c) return;
    const circle = new fabric.Circle({
      left: 120,
      top: 120,
      radius: 80,
      fill: rgbaFromHex(fillColor, fillAlpha),
      stroke: strokeColor,
      strokeWidth,
    });
    c.add(circle);
    c.setActiveObject(circle);
    c.renderAll();
  };

  const addText = () => {
    const c = fabricRef.current;
    if (!c) return;

    const shadow = new fabric.Shadow({
      color: "rgba(0,0,0,0.25)",
      blur: 2,
      offsetX: 2,
      offsetY: 2,
    });

    const text = new fabric.Textbox(textValue || "Text", {
      left: 80,
      top: 80,
      fill: strokeColor,
      fontSize: 42,
      fontWeight: "bold",
      width: 400,
      textAlign: "center",
      shadow,
    });
    c.add(text);
    c.setActiveObject(text);
    c.renderAll();
  };

  const handleDownload = () => {
    const c = fabricRef.current;
    if (!c) return;
    // Ensure background is included
    const dataUrl = c.toDataURL({ format: "png", multiplier: 1 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "edited-thumbnail.png";
    link.click();
  };

  const setCanvasZoom = (next: number) => {
    const c = fabricRef.current;
    if (!c) return;
    const clamped = Math.min(3, Math.max(0.25, next));
    setZoom(clamped);
    c.setZoom(clamped);
    c.requestRenderAll();
  };

  const openContextMenu = (clientX: number, clientY: number) => {
    const c = fabricRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (!active) return;
    // Initialize pickers from selected object
    if ((active as any).type === "textbox") {
      const current = (active as any).fill as string | undefined;
      if (current) {
        try {
          // if rgba, ignore alpha for text
          const m = /rgba\((\d+),(\d+),(\d+),(.*)\)/.exec(current);
          if (m) {
            // convert to hex-ish approximation skipped; keep existing strokeColor
          }
        } catch {}
      }
    } else {
      const currentFill = (active as any).fill as string | undefined;
      if (currentFill?.startsWith("rgba")) {
        // parse rgba to hex + alpha
        const parts = currentFill
          .replace("rgba(", "")
          .replace(")", "")
          .split(",")
          .map((v) => v.trim());
        if (parts.length === 4) {
          const r = Number(parts[0]);
          const g = Number(parts[1]);
          const b = Number(parts[2]);
          const a = Number(parts[3]);
          const toHex = (n: number) => `#${n.toString(16).padStart(2, "0")}`;
          setFillColor(
            `#${r.toString(16).padStart(2, "0")}${g
              .toString(16)
              .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
          );
          setFillAlpha(isNaN(a) ? 0.2 : Math.max(0, Math.min(1, a)));
        }
      }
      const currentStroke = (active as any).stroke as string | undefined;
      if (currentStroke && currentStroke.startsWith("#")) {
        setStrokeColor(currentStroke);
      }
    }
    // Convert to container-relative positioning
    const container = containerRef.current;
    const bounds = container?.getBoundingClientRect();
    const baseX = bounds ? clientX - bounds.left : clientX;
    const baseY = bounds ? clientY - bounds.top : clientY;
    setMenuPos({ x: baseX, y: baseY });
    setMenuOpen(true);

    // Next tick measure and clamp inside container
    setTimeout(() => {
      const menuEl = menuRef.current;
      const cont = containerRef.current;
      if (!menuEl || !cont) return;
      const contRect = cont.getBoundingClientRect();
      const menuRect = menuEl.getBoundingClientRect();
      const maxX = contRect.width - menuRect.width - 8;
      const maxY = contRect.height - menuRect.height - 8;
      setMenuPos((prev) => ({
        x: Math.max(8, Math.min(prev.x, maxX)),
        y: Math.max(8, Math.min(prev.y, maxY)),
      }));
    }, 0);
  };

  // Close context menu on outside click / scroll / resize
  useEffect(() => {
    if (!menuOpen) return;
    const handleDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const handleScroll = () => setMenuOpen(false);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [menuOpen]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap rounded-md border p-2 bg-white/60">
        <div className="flex items-center gap-2" />
        <div className="flex items-center gap-2">
          <Input
            placeholder="Text"
            value={textValue}
            onChange={(e) => {
              const v = e.target.value;
              setTextValue(v);
              const c = fabricRef.current;
              if (!c) return;
              const active = c.getActiveObject();
              if (active && (active as any).type === "textbox") {
                (active as any).set({ text: v });
                c.requestRenderAll();
              }
            }}
            className="h-8"
          />
          <Button onClick={addText}>Add text</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={addRect}>Add rectangle</Button>
          <Button onClick={addCircle}>Add circle</Button>
          <Button variant="destructive" onClick={removeSelected}>
            Delete selected
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon"
            variant="secondary"
            onClick={() => {
              if (zoom > 1) setCanvasZoom(zoom - 0.1);
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="px-2 text-xs w-12 text-center">
            {Math.round(zoom * 100)}%
          </div>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setCanvasZoom(zoom + 0.1)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={handleDownload}>Download</Button>
        </div>
      </div>
      <div
        className="relative border rounded bg-[linear-gradient(45deg,#f5f5f5_25%,transparent_25%),linear-gradient(-45deg,#f5f5f5_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f5f5f5_75%),linear-gradient(-45deg,transparent_75%,#f5f5f5_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0]"
        ref={containerRef}
        onContextMenu={(e) => {
          e.preventDefault();
          openContextMenu(e.clientX, e.clientY);
        }}
      >
        <canvas ref={canvasRef} />

        {menuOpen ? (
          <div
            className="absolute z-50 rounded-md border bg-white shadow p-3 space-y-2"
            ref={menuRef}
            style={{ left: menuPos.x, top: menuPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-black/60">Colors</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs">Stroke</span>
                <Input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => {
                    setStrokeColor(e.target.value);
                    updateSelectedColors();
                  }}
                  className="h-6 w-8 p-0"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">Fill</span>
                <Input
                  type="color"
                  value={fillColor}
                  onChange={(e) => {
                    setFillColor(e.target.value);
                    updateSelectedColors();
                  }}
                  className="h-6 w-8 p-0"
                />
                <Input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={fillAlpha}
                  onChange={(e) => {
                    setFillAlpha(Number(e.target.value));
                    updateSelectedColors();
                  }}
                  className="w-24"
                />
              </div>
            </div>
            <div className="text-xs text-black/60 pt-1">Stroke width</div>
            <div className="flex items-center gap-2">
              <Input
                type="range"
                min={1}
                max={12}
                step={1}
                value={strokeWidth}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  setStrokeWidth(w);
                  const c = fabricRef.current;
                  if (!c) return;
                  const active = c.getActiveObject();
                  if (active && (active as any).type !== "textbox") {
                    (active as any).set({ strokeWidth: w });
                    c.requestRenderAll();
                  }
                }}
                className="w-40"
              />
              <div className="text-xs w-6 text-right">{strokeWidth}</div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setMenuOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
