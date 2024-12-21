import { shaderMaterial } from '@react-three/drei';
import { useFrame, useThree, extend } from '@react-three/fiber';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ShootingStarProps {
    position: THREE.Vector3;
    speed: number;
    size: number;
}

// Custom star shader
export const StarMaterial = shaderMaterial(
    { time: 0, color: new THREE.Color(0.2, 0.8, 1) },
    // vertex shader
    `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    // fragment shader
    `
        uniform float time;
        uniform vec3 color;
        varying vec2 vUv;
        void main() {
            vec2 center = vec2(0.5, 0.5);
            float d = distance(vUv, center);
            float alpha = smoothstep(0.5, 0.2, d);
            gl_FragColor = vec4(color, alpha * (0.8 + 0.2 * sin(time * 10.0)));
        }
    `
);

extend({ StarMaterial });

export const ShootingStar: React.FC<ShootingStarProps> = React.memo(({ position, speed, size }) => {
    const mesh = useRef<THREE.Mesh>(null);
    const trail = useRef<THREE.Mesh>(null);
    const material = useRef<any>(null);
    const { viewport } = useThree();

    useFrame((state, delta) => {
        if (mesh.current && trail.current) {
            mesh.current.position.x += speed * delta;
            mesh.current.position.y -= speed * delta * 0.5;
            trail.current.position.copy(mesh.current.position);
            trail.current.scale.x = 1 + speed * delta * 2;

            if (mesh.current.position.x > viewport.width / 2 || mesh.current.position.y < -viewport.height / 2) {
                mesh.current.position.set(-viewport.width / 2, viewport.height / 2 + Math.random() * viewport.height / 2, 0);
                trail.current.scale.x = 1;
            }
        }
        if (material.current) {
            material.current.time = state.clock.elapsedTime;
        }
    });

    return (
        <group>
            <mesh ref={mesh} position={position}>
                <sphereGeometry args={[size, 8, 8]} />
                <primitive object={StarMaterial} ref={material} transparent />
            </mesh>
            <mesh ref={trail} position={position} rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[size * 10, size]} />
                <meshBasicMaterial color={0xffffff} transparent opacity={0.2} />
            </mesh>
        </group>
    );
});

export const ShootingStars: React.FC = React.memo(() => {
    const [stars, setStars] = useState<ShootingStarProps[]>([]);
    const { viewport } = useThree();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const createStar = useCallback(() => {
        const newStar: ShootingStarProps = {
            position: new THREE.Vector3(
                -viewport.width / 2,
                viewport.height / 2 + Math.random() * viewport.height / 2,
                Math.random() * -50
            ),
            speed: Math.random() * 15 + 10,
            size: Math.random() * 0.05 + 0.05
        };
        setStars(prevStars => [...prevStars, newStar].slice(-3));
    }, [viewport]);

    const scheduleNextStar = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (stars.length < 3) {
                createStar();
            }
            scheduleNextStar();
        }, Math.random() * 3000 + 2000);
    }, [createStar, stars.length]);

    useEffect(() => {
        scheduleNextStar();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [scheduleNextStar]);

    useEffect(() => {
        const handleResize = () => {
            setStars([]);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            {stars.map((star, i) => (
                <ShootingStar key={i} {...star} />
            ))}
        </>
    );
});

export const BackgroundStars: React.FC = () => {
    const starsCount = 1000;
    const [positions, sizes] = useMemo(() => {
        const pos = new Float32Array(starsCount * 3);
        const sizes = new Float32Array(starsCount);
        for (let i = 0; i < starsCount; i++) {
            const i3 = i * 3;
            pos[i3] = (Math.random() - 0.5) * 800;
            pos[i3 + 1] = (Math.random() - 0.5) * 800;
            pos[i3 + 2] = Math.random() * -400;
            sizes[i] = Math.random() * 1.5 + 0.5;
        }
        return [pos, sizes];
    }, []);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={sizes.length}
                    array={sizes}
                    itemSize={1}
                />
            </bufferGeometry>
            <pointsMaterial size={1} sizeAttenuation color={0xffffff} />
        </points>
    );
};

export const SpaceScene: React.FC = React.memo(() => {
    const { camera, viewport } = useThree();

    useFrame(({ mouse }) => {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, (mouse.x * viewport.width) / 100, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, (mouse.y * viewport.height) / 100, 0.05);
    });

    return (
        <>
            <BackgroundStars />
            <ShootingStars />
        </>
    );
});
