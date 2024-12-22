import { Container, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Container component="footer" maxWidth={false} className="footer-container">
      <Typography variant="body2" className="footer-text">
        {new Date().getFullYear()} 1Biome. All rights reserved.
      </Typography>
    </Container>
  );
};

export default Footer;