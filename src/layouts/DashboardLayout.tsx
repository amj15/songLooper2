import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { alpha } from "@mui/material/styles";
import AppNavbar from "../components/AppNavbar";
import SideMenu from "../components/SideMenu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: "flex" }}>
        <SideMenu />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: "auto",
          })}
        >
          <Box sx={{ mx: 3, mt: { xs: 8, md: 0 }, pb: 5 }}>{children}</Box>
        </Box>
      </Box>
    </>
  );
}
