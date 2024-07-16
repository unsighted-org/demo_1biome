import { useEffect, useRef } from "react";
import * as THREE from "three";

import GeospatialChart from "./GeospatialChart";

import type { HealthEnvironmentData, HealthMetric } from '@/types';

type DynamicEarthTextureProps = {
    data: HealthEnvironmentData[];
    metric: HealthMetric;
    center: { latitude: number; longitude: number };
    zoom: number;
    onTextureReady: (texture: THREE.CanvasTexture) => void;
};

const DynamicEarthTexture: React.FC<DynamicEarthTextureProps> = ({
    data,
    metric,
    center,
    zoom,
    onTextureReady,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && onTextureReady) {
            const texture = new THREE.CanvasTexture(containerRef.current);
            onTextureReady(texture);

            const updateTexture = (): void => {
                texture.needsUpdate = true;
                requestAnimationFrame(updateTexture);
            };
            updateTexture();
        }
    }, [containerRef, onTextureReady]);

    return (
        <div ref={containerRef} style={{ width: "1024px", height: "512px" }}>
            <GeospatialChart data={data} metric={metric} center={center} zoom={zoom} />
        </div>
    );
};

export default DynamicEarthTexture;