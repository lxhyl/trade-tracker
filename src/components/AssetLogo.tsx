"use client";

import { useState, useRef, useEffect } from "react";

const assetGradient = (assetType: string) => {
  switch (assetType) {
    case "crypto": return "bg-gradient-to-br from-purple-500 to-pink-500";
    case "stock": return "bg-gradient-to-br from-blue-500 to-cyan-500";
    default: return "bg-gradient-to-br from-gray-500 to-slate-500";
  }
};


interface AssetLogoProps {
  symbol: string;
  assetType: string;
  className?: string;
}

export function AssetLogo({ symbol, assetType, className = "h-10 w-10" }: AssetLogoProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const src = `/api/logo/${encodeURIComponent(symbol)}?type=${encodeURIComponent(assetType)}`;
  const showFallback = failed || !loaded;

  // 处理缓存图片：浏览器已缓存时 onLoad 不会触发，挂载后手动检查 complete
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <div className={`relative ${className} shrink-0 rounded-xl flex items-center justify-center font-bold text-white text-xs ${showFallback ? assetGradient(assetType) : "bg-white"}`}>
      {showFallback && symbol.slice(0, 2)}
      {!failed && (
        <img
          ref={imgRef}
          src={src}
          alt={symbol}
          className="absolute inset-0 h-full w-full rounded-xl object-contain p-0.5"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
