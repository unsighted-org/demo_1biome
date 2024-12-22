import React, { useCallback } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import CompassIcon from '@mui/icons-material/Explore';

const ControlPanel = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: theme.shape.borderRadius,
  backdropFilter: 'blur(5px)',
}));

const TexturePanel = styled(ControlPanel)({
  top: 20,
  left: 20,
});

const CompassPanel = styled(ControlPanel)({
  bottom: 20,
  right: 20,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const Compass = styled(Box)({
  width: 100,
  height: 100,
  position: 'relative',
  '& .compass-arrow': {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'transform 0.3s ease',
  },
});

interface GlobeControlsProps {
  currentTexture: string;
  onTextureChange: (texture: string) => void;
  rotation: { x: number; y: number };
}

const textureOptions = [
  { value: 'blue-marble', label: 'Blue Marble' },
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
  { value: 'topology', label: 'Topology' },
  { value: 'water', label: 'Water' },
];

const GlobeControls: React.FC<GlobeControlsProps> = ({
  currentTexture,
  onTextureChange,
  rotation,
}) => {
  const compassRotation = -rotation.y * (180 / Math.PI);

  const handleTextureChange = useCallback((event: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (value) {
      onTextureChange(value);
    }
  }, [onTextureChange]);

  return (
    <>
      <TexturePanel elevation={3}>
        <ToggleButtonGroup
          value={currentTexture}
          exclusive
          onChange={handleTextureChange}
          orientation="vertical"
          size="small"
        >
          {textureOptions.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </TexturePanel>

      <CompassPanel elevation={3}>
        <Compass>
          <CompassIcon
            className="compass-arrow"
            style={{ transform: `translate(-50%, -50%) rotate(${compassRotation}deg)` }}
            fontSize="large"
          />
          <Box
            component="img"
            src="/compass-rose.png"
            alt="Compass Rose"
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </Compass>
      </CompassPanel>
    </>
  );
};

export default GlobeControls;
