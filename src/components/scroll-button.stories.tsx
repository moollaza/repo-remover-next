import type { Meta, StoryObj } from "@storybook/react";

import ScrollButton from "./scroll-button";

const meta: Meta<typeof ScrollButton> = {
  component: ScrollButton,
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
        <div className="mt-8 p-4 bg-content2 rounded-lg">
          <p className="text-sm text-default-500">
            Note: Scroll behavior is simulated in Storybook. The target element may not exist in this environment.
          </p>
        </div>
      </div>
    ),
  ],
  title: "Components/ScrollButton",
};

export default meta;
type Story = StoryObj<typeof ScrollButton>;

/** Default primary button */
export const Default: Story = {
  args: {
    children: "Get Started",
    targetId: "demo-section",
  },
};

/** All color variants */
export const AllColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ScrollButton color="primary" targetId="demo">
        Primary
      </ScrollButton>
      <ScrollButton color="secondary" targetId="demo">
        Secondary
      </ScrollButton>
      <ScrollButton color="success" targetId="demo">
        Success
      </ScrollButton>
      <ScrollButton color="warning" targetId="demo">
        Warning
      </ScrollButton>
      <ScrollButton color="danger" targetId="demo">
        Danger
      </ScrollButton>
      <ScrollButton color="default" targetId="demo">
        Default
      </ScrollButton>
    </div>
  ),
};

/** All size variants */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ScrollButton size="sm" targetId="demo">
        Small
      </ScrollButton>
      <ScrollButton size="md" targetId="demo">
        Medium
      </ScrollButton>
      <ScrollButton size="lg" targetId="demo">
        Large
      </ScrollButton>
    </div>
  ),
};

/** All style variants */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ScrollButton targetId="demo" variant="solid">
        Solid
      </ScrollButton>
      <ScrollButton targetId="demo" variant="bordered">
        Bordered
      </ScrollButton>
      <ScrollButton targetId="demo" variant="light">
        Light
      </ScrollButton>
      <ScrollButton targetId="demo" variant="flat">
        Flat
      </ScrollButton>
      <ScrollButton targetId="demo" variant="faded">
        Faded
      </ScrollButton>
      <ScrollButton targetId="demo" variant="shadow">
        Shadow
      </ScrollButton>
      <ScrollButton targetId="demo" variant="ghost">
        Ghost
      </ScrollButton>
    </div>
  ),
};

/** Custom styling */
export const CustomStyled: Story = {
  args: {
    children: "Custom Button",
    className: "font-bold uppercase tracking-wider",
    color: "secondary",
    size: "lg",
    targetId: "demo",
    variant: "shadow",
  },
};
