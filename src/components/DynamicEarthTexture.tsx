import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import GeospatialChart from "./GeospatialChart";

import type { HealthEnvironmentData, HealthMetric } from '@/types';

type DynamicEarthTextureProps = {
    data: HealthEnvironmentData[];
    metric: HealthMetric;
    center: { latitude: number; longitude: number };
    zoom: number;
    onTextureReady: (texture: THREE.CanvasTexture) => void;
    onLoadTime?: (duration: number) => void;
};

const DynamicEarthTexture: React.FC<DynamicEarthTextureProps> = ({
    data,
    metric,
    center,
    zoom,
    onTextureReady,
    onLoadTime,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [startTime, setStartTime] = useState(performance.now());

    useEffect(() => {
        if (containerRef.current && onTextureReady) {
            const texture = new THREE.CanvasTexture(containerRef.current);
            onTextureReady(texture);

            const updateTexture = (): void => {
                texture.needsUpdate = true;
                requestAnimationFrame(updateTexture);
            };
            updateTexture();

            if (onLoadTime) {
                const loadTime = performance.now() - startTime;
                onLoadTime(loadTime);
            }
        }
    }, [containerRef, onTextureReady, onLoadTime, startTime]);

    return (
        <div ref={containerRef} style={{ width: "1024px", height: "512px" }}>
            <GeospatialChart data={data} metric={metric} center={center} zoom={zoom} />
        </div>
    );
};

export default DynamicEarthTexture;