import { createTheme } from '@mui/material/styles';

// Define the Slate-Navy & Emerald colors
const slateNavy = '#0F172A';       // Base Background
const elevatedSlate = '#1E293B';    // Panel/Card Background
const offWhite = '#F8FAFC';        // Primary Text
const mutedGray = '#94A3B8';       // Secondary Text / Labels
const tableSeparator = '#334155';  // Table Separator / Darker Slate
const emerald = '#10B981';         // Primary Accent
const darkEmerald = '#059669';     // Accent Hover
const red = '#EF4444';             // Error color (keep for consistency)

// Chip Colors
const activeChipBg = '#DCFCE7';
const activeChipText = '#15803D';
const inactiveChipBg = '#E2E8F0';
const inactiveChipText = '#475569';

// Define the custom theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: emerald,
      contrastText: '#ffffff',
    },
    secondary: { // Use for less prominent actions or elements
      main: mutedGray, // Use muted gray for secondary actions
      contrastText: offWhite,
    },
    error: {
      main: red,
    },
    background: {
      default: slateNavy,
      paper: elevatedSlate,
    },
    text: {
      primary: offWhite,
      secondary: mutedGray,
      disabled: tableSeparator, // Use darker slate for disabled text
    },
    divider: tableSeparator, // Use darker slate for dividers
    // Custom palette entries for chips
    chipActive: {
        main: activeChipBg,
        contrastText: activeChipText,
    },
    chipInactive: {
        main: inactiveChipBg,
        contrastText: inactiveChipText,
    },
    // AppBar and Sidebar use elevated slate
    appBar: {
      main: elevatedSlate,
      contrastText: offWhite,
    },
    sidebar: {
        main: elevatedSlate,
        contrastText: offWhite,
    }
  },
  shape: {
    borderRadius: 12, // Default border radius for buttons and potentially other elements
  },
  shadows: [ // Soft shadows
    'none',
    '0px 5px 15px rgba(0, 0, 0, 0.15)', // Soft shadow for elevation 1 (buttons, paper)
    '0px 8px 20px rgba(0, 0, 0, 0.18)', // Slightly stronger for elevation 2/3
    '0px 10px 25px rgba(0, 0, 0, 0.20)',
    // ... fill remaining shadows
  ].concat(Array(21).fill('0px 10px 25px rgba(0, 0, 0, 0.20)')),
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif', // Specify font
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 }, // Make headers bolder
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 600, // Medium weight for buttons
    },
  },
  spacing: 8, // Default spacing unit (MUI default is 8) - adjust if needed for "generous" spacing
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: slateNavy,
          color: offWhite,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.appBar.main,
          color: theme.palette.appBar.contrastText,
          boxShadow: 'none', // Flat AppBar, rely on background contrast
          backgroundImage: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.sidebar.main,
          color: theme.palette.sidebar.contrastText,
          borderRight: 'none',
          backgroundImage: 'none',
          boxShadow: theme.shadows[2], // Add shadow as it overlaps
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius, // Use 12px radius
          boxShadow: theme.shadows[1],
          transition: 'background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, transform 0.1s ease-in-out',
           '&:hover': {
             boxShadow: theme.shadows[2],
             transform: 'translateY(-1px)', // Subtle lift on hover
           },
           '&:active': {
             boxShadow: theme.shadows[1], // Return to base shadow on click
             transform: 'translateY(0px)',
           }
        }),
        containedPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          '&:hover': {
            backgroundColor: darkEmerald,
          },
        }),
        // ... other button variants (secondary, text, error) ...
        containedSecondary: ({ theme }) => ({
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            '&:hover': {
                backgroundColor: tableSeparator, // Darker slate on hover
            },
        }),
        textPrimary: ({ theme }) => ({
            color: theme.palette.primary.main,
            boxShadow: 'none',
             '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                transform: 'none', // No lift for text buttons
            },
             '&:active': {
                 boxShadow: 'none',
             }
        }),
        containedError: ({ theme }) => ({
            backgroundColor: theme.palette.error.main,
            color: '#ffffff',
            '&:hover': {
                backgroundColor: '#d32f2f',
            },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8, // Use a slightly smaller radius for general panels/cards than buttons
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
          boxShadow: theme.shadows[1],
        }),
        elevation1: ({ theme }) => ({ boxShadow: theme.shadows[1] }),
        elevation2: ({ theme }) => ({ boxShadow: theme.shadows[2] }),
        elevation3: ({ theme }) => ({ boxShadow: theme.shadows[3] }),
      },
    },
    MuiCard: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 8, // Consistent with Paper
            }),
        },
    },
    MuiListItemButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 8, // Match Paper/Card radius
                margin: theme.spacing(0.5, 1),
                width: `calc(100% - ${theme.spacing(2)})`,
                '&.Mui-selected': {
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Lighter emerald highlight
                    color: theme.palette.primary.main, // Use primary color for text when selected
                    '&:hover': {
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    },
                    // Ensure icon color is also primary when selected
                    '.MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                    }
                },
                 '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)', // Subtle hover
                },
            }),
        },
    },
    MuiListItemIcon: {
        styleOverrides: {
            root: ({ theme }) => ({
                color: theme.palette.text.secondary, // Muted gray for icons by default
                minWidth: '40px', // Ensure consistent spacing
            }),
        },
    },
    MuiTableContainer: {
        styleOverrides: {
            root: ({ theme }) => ({
                '.MuiPaper-root > &': {
                    borderRadius: 8, // Match Paper radius
                }
            }),
        },
    },
    MuiTableRow: {
        styleOverrides: {
            root: ({ theme }) => ({
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)', // Subtle hover effect
                },
            }),
        },
    },
    MuiTableCell: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderBottom: `1px solid ${theme.palette.divider}`,
                padding: theme.spacing(2), // Generous padding
            }),
            head: ({ theme }) => ({
                backgroundColor: 'transparent', // Keep header transparent, rely on row background
                color: theme.palette.text.secondary,
                fontWeight: 600,
                borderBottomWidth: '1px', // Standard border width
            }),
            body: ({ theme }) => ({
                color: theme.palette.text.primary,
            }),
        },
    },
    MuiChip: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: 16, // Pill shape
                fontWeight: 600, // Medium weight
                height: '28px', // Slightly larger chip
                paddingLeft: theme.spacing(1.5),
                paddingRight: theme.spacing(1.5),
            }),
            // Custom variants using custom palette colors
            // Usage: <Chip label="Active" color="chipActive" />
            colorChipActive: ({ theme }) => ({
                backgroundColor: theme.palette.chipActive.main,
                color: theme.palette.chipActive.contrastText,
            }),
            colorChipInactive: ({ theme }) => ({
                backgroundColor: theme.palette.chipInactive.main,
                color: theme.palette.chipInactive.contrastText,
            }),
        },
    },
    // ... existing overrides for TextField, Select, Autocomplete, Alert ...
    // Ensure they use the new palette colors correctly and match border radius/styles
    MuiTextField: {
        styleOverrides: {
            root: ({ theme }) => ({
                '& .MuiOutlinedInput-root': {
                    borderRadius: 8, // Match Paper/Card radius
                    backgroundColor: theme.palette.background.default,
                    '& fieldset': {
                        borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                        borderColor: mutedGray, // Use muted gray for hover border
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '1px',
                    },
                },
                 '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                 },
                '& label': {
                    color: theme.palette.text.secondary,
                },
                '& label.Mui-focused': {
                    color: theme.palette.primary.main,
                },
            }),
        },
    },
    MuiSelect: {
        styleOverrides: {
            root: ({ theme }) => ({
                 '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                    backgroundColor: theme.palette.background.default,
                     '& fieldset': { borderColor: theme.palette.divider },
                     '&:hover fieldset': { borderColor: mutedGray },
                     '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1px' },
                 },
            }),
            icon: ({ theme }) => ({
                color: theme.palette.text.secondary,
            }),
        },
    },
     MuiAutocomplete: {
        styleOverrides: {
            root: ({ theme }) => ({
                '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                    backgroundColor: theme.palette.background.default,
                     '& fieldset': { borderColor: theme.palette.divider },
                     '&:hover fieldset': { borderColor: mutedGray },
                     '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1px' },
                },
            }),
            popper: ({ theme }) => ({
                '& .MuiPaper-root': {
                    backgroundColor: elevatedSlate,
                    boxShadow: theme.shadows[3],
                }
            }),
        },
    },
    MuiAlert: {
        styleOverrides: {
            root: ({ theme, ownerState }) => ({
                borderRadius: 8, // Match Paper/Card radius
                boxShadow: theme.shadows[1],
                color: '#ffffff',
                ...(ownerState.severity === 'error' && {
                    backgroundColor: red,
                }),
                 ...(ownerState.severity === 'success' && {
                    backgroundColor: darkEmerald,
                }),
                 ...(ownerState.severity === 'warning' && {
                    backgroundColor: '#FFA726',
                }),
                 ...(ownerState.severity === 'info' && {
                    backgroundColor: '#29B6F6',
                }),
            }),
             icon: ({ theme, ownerState }) => ({
                 color: '#ffffff',
            }),
        },
    },
  },
  // Extend Palette type for custom chip colors (TypeScript only)
  // palette: {
  //   chipActive: Palette['primary'];
  //   chipInactive: Palette['primary'];
  // }
});

// Extend ChipPropsColorOverrides type (TypeScript only)
// declare module '@mui/material/Chip' {
//   interface ChipPropsColorOverrides {
//     chipActive: true;
//     chipInactive: true;
//   }
// }

export default theme;
