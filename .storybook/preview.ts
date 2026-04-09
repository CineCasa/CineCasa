import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import { themes } from '@storybook/theming';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'cinecasa-dark',
          value: '#0f0f0f',
        },
      ],
    },
    docs: {
      toc: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        widescreen: {
          name: 'Widescreen',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'cinecasa-dark', title: 'CineCasa Dark', icon: 'movie' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English', right: '🇺🇸' },
          { value: 'pt', title: 'Português', right: '🇧🇷' },
          { value: 'es', title: 'Español', right: '🇪🇸' },
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: themes.light,
        dark: themes.dark,
        'cinecasa-dark': {
          ...themes.dark,
          defaultBackground: '#0f0f0f',
          barBg: '#1a1a1a',
          textColor: '#ffffff',
          inputBg: '#2a2a2a',
          inputTextColor: '#ffffff',
          inputBorderColor: '#3a3a3a',
          buttonBg: '#4a4a4a',
          buttonTextColor: '#ffffff',
          selectedBg: '#5a5a5a',
          selectedTextColor: '#ffffff',
        },
      },
      defaultTheme: 'dark',
    }),
    (Story) => (
      <div style={{ padding: '1rem', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
