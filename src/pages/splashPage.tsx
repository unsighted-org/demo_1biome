import { Email, ArrowForward } from '@mui/icons-material';
import { Box, TextField, Button, Typography, Alert, InputAdornment, CircularProgress } from '@mui/material';
import { Preload, shaderMaterial } from '@react-three/drei';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import NextLink from 'next/link';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ShootingStarProps {
    position: THREE.Vector3;
    speed: number;
    size: number;
}

// Custom star shader
const StarMaterial = shaderMaterial(
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


const ShootingStar: React.FC<ShootingStarProps> = React.memo(({ position, speed, size }) => {
    const mesh = useRef<THREE.Mesh>(null);
    const trail = useRef<THREE.Mesh>(null);
    const material = useRef<any>(null);
    const { viewport } = useThree();

    useFrame((state, delta) => {
        if (mesh.current && trail.current) {
            mesh.current.position.x += speed * delta;
            mesh.current.position.y -= speed * delta * 0.5; // Reduce vertical movement
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

const ShootingStars: React.FC = React.memo(() => {
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
        setStars(prevStars => [...prevStars, newStar].slice(-3)); // Keep only up to 3 stars
    }, [viewport]);

    const scheduleNextStar = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (stars.length < 3) {
                createStar();
            }
            scheduleNextStar();
        }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds
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

const SpaceScene: React.FC = React.memo(() => {
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

const BackgroundStars: React.FC = () => {
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

const SplashPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSuccess(true);
        } catch (error) {
            console.error('Signup error:', error);
            setError('Failed to sign up. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (!mounted) return null;

    return (
        <Box sx={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
                <Preload all />
                <SpaceScene />
            </Canvas>
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    textAlign: 'center',
                    zIndex: 1,
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <Typography variant="h2" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Global Health Navigation
                    </Typography>
                    <Typography variant="h5" sx={{ mb: 4 }}>
                        Discover regions that can boost your health and wellbeing
                    </Typography>
                    <Box 
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                            maxWidth: '400px',
                            margin: '0 auto',
                            padding: 4,
                        }}
                    >
                        <AnimatePresence>
                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
                                        Welcome to 1Biome&apos;s Global Health Navigation! We&apos;ll keep you updated on health-boosting regions.
                                    </Alert>
                                </motion.div>
                            ) : (
                                <>
                                    {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
                                    <TextField
                                        fullWidth
                                        required
                                        id="email"
                                        label="Email Address"
                                        name="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        sx={{
                                            mb: 2,
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': { border: 'none' },
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                transition: 'background-color 0.3s',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                },
                                                '&.Mui-focused': {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                },
                                            },
                                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                            '& .MuiInputBase-input': { color: 'white' },
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={!email || isLoading}
                                        endIcon={<ArrowForward />}
                                        sx={{
                                            mt: 2,
                                            backgroundColor: 'rgba(0, 255, 255, 0.6)',
                                            color: 'black',
                                            '&:hover': { backgroundColor: 'rgba(0, 255, 255, 0.8)' },
                                            '&:disabled': { backgroundColor: 'rgba(0, 255, 255, 0.3)', color: 'rgba(0, 0, 0, 0.4)' },
                                        }}
                                    >
                                        {isLoading ? <CircularProgress size={24} /> : 'Start Your Health Journey'}
                                    </Button>
                                </>
                            )}
                        </AnimatePresence>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <NextLink href="/login" passHref>
                            <Typography
                                component="a"
                                sx={{
                                    color: 'rgba(0, 255, 255, 0.8)',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    '&:hover': { color: 'rgb(0, 255, 255)' },
                                }}
                            >
                                Already navigating global health? Log in
                            </Typography>
                        </NextLink>
                    </Box>
                </motion.div>
            </Box>
        </Box>
    );
};

export default SplashPage;