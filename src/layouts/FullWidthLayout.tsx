import { Box, CssBaseline } from "@mui/material";

export default function FullWidthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CssBaseline enableColorScheme />
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </Box>
    </>
  );
}
