// import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
// import { Box, TextField, Button, Typography, Alert, Paper, Container, InputAdornment, IconButton, CircularProgress } from '@mui/material';
// import { motion } from 'framer-motion';
// import NextLink from 'next/link';
// import React, { useState } from 'react';

// import { useAuth } from '@/context/AuthContext';

// import type { UserLoginData } from '@/types';

// const LoginPage: React.FC = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const { signIn } = useAuth(); // Use the signIn function from AuthContext

//   const handleLogin = async (e: React.FormEvent): Promise<void> => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     const loginData: UserLoginData = { email, password };

//     try {
//       await signIn(loginData.email, loginData.password);
//       // The router.push is handled in the AuthContext, so we don't need to do it here
//     } catch (error) {
//       console.error('Login error:', error);
//       setError(error instanceof Error ? error.message : 'An unexpected error occurred');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Container maxWidth="sm">
//       <motion.div
//         initial={{ opacity: 0, y: -50 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <Paper elevation={3} sx={{ mt: 8, p: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
//           <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
//             <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4, color: 'primary.main' }}>
//               Welcome to 1Biome
//             </Typography>
//             {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               id="email"
//               label="Email Address"
//               name="email"
//               autoComplete="email"
//               autoFocus
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Email color="primary" />
//                   </InputAdornment>
//                 ),
//               }}
//             />
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               name="password"
//               label="Password"
//               type={showPassword ? 'text' : 'password'}
//               id="password"
//               autoComplete="current-password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Lock color="primary" />
//                   </InputAdornment>
//                 ),
//                 endAdornment: (
//                   <InputAdornment position="end">
//                     <IconButton
//                       aria-label="toggle password visibility"
//                       onClick={() => setShowPassword(!showPassword)}
//                       edge="end"
//                     >
//                       {showPassword ? <VisibilityOff /> : <Visibility />}
//                     </IconButton>
//                   </InputAdornment>
//                 ),
//               }}
//             />
//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
//               disabled={isLoading}
//             >
//               {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
//             </Button>
//             <Box sx={{ textAlign: 'center', mt: 2 }}>
//               <Typography variant="body2">
//                 Don&apos;t have an account?{' '}
//                 <NextLink href="/signup" passHref legacyBehavior>
//                   <Typography component="a" sx={{ color: 'primary.main', textDecoration: 'underline', cursor: 'pointer' }}>
//                     Sign up
//                   </Typography>
//                 </NextLink>
//               </Typography>
//             </Box>
//           </Box>
//         </Paper>
//       </motion.div>
//     </Container>
//   );
// };

// export default LoginPage;



//  BELOW IS THE DEVELOPMENT VIRSION OF THE CODE ABOVE

// import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
// import { Box, TextField, Button, Typography, Alert, Paper, Container, InputAdornment, IconButton, CircularProgress } from '@mui/material';
// import { motion } from 'framer-motion';
// import NextLink from 'next/link';
// import React, { useState } from 'react';

// import { useAuth } from '@/context/AuthContext';

// import type { UserLoginData } from '@/types';

// const LoginPage: React.FC = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const { signIn } = useAuth(); // Use the signIn function from AuthContext

//   const handleLogin = async (e: React.FormEvent): Promise<void> => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     const loginData: UserLoginData = { email, password };

//     try {
//       await signIn(loginData.email, loginData.password);
//       // The router.push is handled in the AuthContext, so we don't need to do it here
//     } catch (error) {
//       console.error('Login error:', error);
//       setError(error instanceof Error ? error.message : 'An unexpected error occurred');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Container maxWidth="sm">
//       <motion.div
//         initial={{ opacity: 0, y: -50 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <Paper elevation={3} sx={{ mt: 8, p: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
//           <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
//             <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4, color: 'primary.main' }}>
//               Welcome to 1Biome
//             </Typography>
//             {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               id="email"
//               label="Email Address"
//               name="email"
//               autoComplete="email"
//               autoFocus
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Email color="primary" />
//                   </InputAdornment>
//                 ),
//               }}
//             />
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               name="password"
//               label="Password"
//               type={showPassword ? 'text' : 'password'}
//               id="password"
//               autoComplete="current-password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Lock color="primary" />
//                   </InputAdornment>
//                 ),
//                 endAdornment: (
//                   <InputAdornment position="end">
//                     <IconButton
//                       aria-label="toggle password visibility"
//                       onClick={() => setShowPassword(!showPassword)}
//                       edge="end"
//                     >
//                       {showPassword ? <VisibilityOff /> : <Visibility />}
//                     </IconButton>
//                   </InputAdornment>
//                 ),
//               }}
//             />
//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
//               disabled={isLoading}
//             >
//               {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
//             </Button>
//             <Box sx={{ textAlign: 'center', mt: 2 }}>
//               <Typography variant="body2">
//                 Don&apos;t have an account?{' '}
//                 <NextLink href="/splashPage" passHref legacyBehavior>
//                   <Typography component="a" sx={{ color: 'primary.main', textDecoration: 'underline', cursor: 'pointer' }}>
//                     Join Waitlist
//                   </Typography>
//                 </NextLink>
//               </Typography>
//             </Box>
//           </Box>
//         </Paper>
//       </motion.div>
//     </Container>
//   );
// };

// export default LoginPage;


import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Preload, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Box, TextField, Button, Typography, Alert, InputAdornment, CircularProgress, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import type { UserLoginData } from '@/types';
import { useRouter } from 'next/router';

// Custom star shader
interface ShootingStarProps {
  position: THREE.Vector3;
  speed: number;
  size: number;
}

// Define the type for the custom shader material
type StarMaterialImpl = {
  time: { value: number };
  color: { value: THREE.Color };
} & THREE.ShaderMaterial;

// Create the custom shader material
const StarMaterialShader = shaderMaterial(
  { time: 0, color: new THREE.Color(1, 1, 1) },
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

// Extend Three.js with our custom material
extend({ StarMaterialShader });

// Augment JSX IntrinsicElements to include our custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      starMaterialShader: React.PropsWithChildren<{ ref?: React.Ref<StarMaterialImpl>, color?: THREE.Color }>;
    }
  }
}

const ShootingStar: React.FC<ShootingStarProps> = ({ position, speed, size }) => {
  const mesh = useRef<THREE.Mesh | null>(null);
  const trail = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<StarMaterialImpl>(null);
  const { viewport } = useThree();

  const tailLength = useMemo(() => speed * 0.2, [speed]);
  const tailOpacity = useMemo(() => Math.min(speed * 0.03, 0.7), [speed]);

  useFrame((state, delta) => {
    if (mesh.current && trail.current) {
      const moveX = speed * delta;
      const moveY = -speed * delta * 0.5;

      mesh.current.position.x += moveX;
      mesh.current.position.y += moveY;

      // Position the trail behind the star
      trail.current.position.x = mesh.current.position.x - (tailLength / 2) * Math.cos(Math.atan2(moveY, moveX));
      trail.current.position.y = mesh.current.position.y - (tailLength / 2) * Math.sin(Math.atan2(moveY, moveX));
      trail.current.rotation.z = Math.atan2(moveY, moveX);
      trail.current.scale.x = tailLength;

      if (mesh.current.position.x > viewport.width / 2 || mesh.current.position.y < -viewport.height / 2) {
        mesh.current.position.set(-viewport.width / 2, viewport.height / 2 + Math.random() * viewport.height / 2, -50);
        trail.current.scale.x = 1;
      }
    }
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <group>
      <mesh ref={trail} position={position}>
        <planeGeometry args={[1, size * 2]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          uniforms={{
            time: { value: 0 },
            color: { value: new THREE.Color(1, 1, 1) },
            tailOpacity: { value: tailOpacity },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float time;
            uniform vec3 color;
            uniform float tailOpacity;
            varying vec2 vUv;
            void main() {
              float alpha = smoothstep(0.0, 1.0, vUv.x) * tailOpacity;
              gl_FragColor = vec4(color, alpha);
            }
          `}
        />
      </mesh>
      <mesh ref={mesh} position={position}>
        <sphereGeometry args={[size, 16, 16]} />
        <starMaterialShader ref={materialRef} color={new THREE.Color(1, 1, 1)} />
      </mesh>
    </group>
  );
};

const ShootingStars: React.FC = React.memo(() => {
  const [stars, setStars] = useState<ShootingStarProps[]>([]);
  const { viewport } = useThree();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const createStar = useCallback(() => {
    const newStar: ShootingStarProps = {
      position: new THREE.Vector3(
        -viewport.width / 2,
        viewport.height / 2 + Math.random() * viewport.height / 2,
        -50 // Pushing back farther in Z-axis
      ),
      speed: Math.random() * 15 + 10,
      size: Math.random() * 0.05 + 0.05,
    };
    setStars((prevStars) => [...prevStars, newStar].slice(-2)); // Reduce the number of concurrent stars to 2
  }, [viewport]);

  const scheduleNextStar = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (stars.length < 2) { // Allow only up to 2 stars at a time
        createStar();
      }
      scheduleNextStar();
    }, Math.random() * 5000 + 5000); // Increase the interval between star creation
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

const BackgroundStars: React.FC = () => {
  const starsCount = 2000; // Increased star count for more depth
  const [positions, sizes, opacities] = useMemo(() => {
    const pos = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);
    const opacities = new Float32Array(starsCount);
    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 800;
      pos[i3 + 1] = (Math.random() - 0.5) * 800;
      pos[i3 + 2] = Math.random() * -400;
      
      // Adjust size based on z-position
      const sizeScale = Math.max(0.1, 1 + pos[i3 + 2] / 400);
      sizes[i] = (Math.random() * 1.5 + 0.5) * sizeScale;
      
      // Adjust opacity based on z-position
      opacities[i] = Math.max(0.1, 1 + pos[i3 + 2] / 400);
    }
    return [pos, sizes, opacities];
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
        <bufferAttribute
          attach="attributes-opacity"
          count={opacities.length}
          array={opacities}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={`
          attribute float size;
          attribute float opacity;
          varying float vOpacity;
          void main() {
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          void main() {
            if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.5) discard;
            gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity);
          }
        `}
      />
    </points>
  );
};

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

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.shape.borderRadius,
    '&:hover, &.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(0, 255, 255, 0.7)',
  },
  '& .MuiInputBase-input': {
    color: 'white',
    height: '2.5rem',
  },
  '& .MuiInputAdornment-root': {
    marginRight: theme.spacing(1),
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: 'rgba(0, 255, 255, 0.7)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgb(0, 128, 128)',
  color: 'rgba(0, 0, 0, 0.7)',
  fontWeight: 'bold',
  height: '3rem',
  '&:hover': {
    backgroundColor: 'rgb(0, 150, 150)',
  },
  '&:disabled': {
    backgroundColor: 'rgba(0, 128, 128, 0.5)',
    color: 'rgba(0, 0, 0, 0.4)',
  },
}));

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const loginData: UserLoginData = { email, password };

    try {
      await signIn(loginData.email, loginData.password);
      router.push('/globescreen');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, router]);

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
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
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              width: '100%',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h3" component="h1" align="center" sx={{ mb: 4, color: '#FFFFFF', /* ... */ }}>
              1Biome
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff5252' }}>{error}</Alert>}
            
            <StyledTextField
              required
              fullWidth
              id="email"
              placeholder="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
            
            <StyledTextField
              required
              fullWidth
              name="password"
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'rgba(0, 255, 255, 0.7)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: '#000000' }} /> : 'Sign In'}
            </StyledButton>
            
            <Typography align="center" sx={{ mt: 2, color: 'rgb(0, 255, 255)', fontSize: '0.9rem' }}>
              <Link href="/splashPage" style={{ color: 'inherit', textDecoration: 'underline' }}>
                New to 1Biome? Join the Ecosystem
              </Link>
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default LoginPage;
