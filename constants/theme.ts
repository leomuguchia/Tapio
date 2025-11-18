const primaryLight = '#E0F2F1';  // your calm teal
const primaryDark = '#004D40';   // darker variant for contrast in dark mode

const tintColorLight = '#00796B';  // button/active accent in light mode
const tintColorDark = '#80CBC4';   // button/active accent in dark mode

export const Colors = {
  light: {
    text: '#11181C',          // default text
    background: '#fff',       // main background
    primary: primaryLight,    // fixed teal for featured card / highlights
    tint: tintColorLight,     // buttons, icons, active accents
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    primary: primaryLight,     // keep same teal for consistency (Daily Calm remains readable)
    tint: tintColorDark,       // buttons, icons, active accents
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
