import Box, { type BoxProps } from '@mui/material/Box';

/** Page-width column shared by every band, so the edges line up down the page. */
export default function Wrap({ sx, ...rest }: BoxProps) {
  return <Box {...rest} sx={[{ maxWidth: 1240, mx: 'auto', px: { xs: 2.5, md: 4 } }, ...(Array.isArray(sx) ? sx : [sx])]} />;
}
