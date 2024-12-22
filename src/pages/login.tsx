import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import { SpaceScene } from '@/components/SpaceScene';
import { Canvas } from '@react-three/fiber';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/globescreen');
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return null;
  }

  return (
    <div className="login-container">
      <div className="fullsize-absolute">
        <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
          <SpaceScene />
        </Canvas>
      </div>
      <LoginForm />
    </div>
  );
}