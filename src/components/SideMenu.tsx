import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import appLogo from '../assets/appLogo-small-hd.png';
import MenuContent from './MenuContent';
import OptionsMenu from './OptionsMenu';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

export default function SideMenu() {
  const { user } = useAuth();
  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
          p: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <img 
          src={appLogo} 
          alt="SongLooper" 
          style={{ 
            width: '100px', 
            height: 'auto',
            maxWidth: '100%'
          }} 
        />
      </Box>
      <Divider />
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MenuContent />
      </Box>
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar
          sizes="small"
          alt={user?.email || 'User'}
          sx={{ 
            width: 36, 
            height: 36, 
            backgroundColor: 'primary.main',
            fontSize: '14px'
          }}
        >
          {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </Avatar>
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
            {user?.email?.split('@')[0] || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        <OptionsMenu />
      </Stack>
    </Drawer>
  );
}
