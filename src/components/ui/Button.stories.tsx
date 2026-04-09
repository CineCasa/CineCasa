import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Button component with multiple variants, sizes, and states.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Button variant style',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    icon: {
      control: 'text',
      description: 'Icon to display',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: 'With Icon',
    icon: '🚀',
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width',
    fullWidth: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button that takes full width of its container.',
      },
    },
  },
};

export const CustomElement: Story = {
  args: {
    children: 'Link Button',
    as: 'a',
    href: 'https://example.com',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button rendered as a different HTML element.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    children: 'Click me!',
    onClick: () => alert('Button clicked!'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with click handler. Click to see interaction.',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    children: 'Playground',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    icon: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Playground to test all button combinations.',
      },
    },
  },
};
