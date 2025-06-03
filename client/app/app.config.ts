export default defineAppConfig({
  ui: {
    icons: {
      caution: 'i-carbon-warning-alt',
      copy: 'i-carbon-copy',
      dark: 'i-carbon-moon',
      document: 'i-carbon-document',
      external: 'i-carbon-launch',
      hash: 'i-carbon-hashtag',
      light: 'i-carbon-sun',
      menu: 'i-carbon-menu',
      next: 'i-carbon-arrow-right',
      note: 'i-carbon-information',
      prev: 'i-carbon-arrow-left',
      system: 'i-carbon-computer',
      tip: 'i-carbon-lightbulb',
      warning: 'i-carbon-warning',
      chevronDoubleLeft: 'i-carbon-chevron-double-left',
      chevronDoubleRight: 'i-carbon-chevron-double-right',
      chevronDown: 'i-carbon-chevron-down',
      chevronLeft: 'i-carbon-chevron-left',
      chevronRight: 'i-carbon-chevron-right',
      arrowLeft: 'i-carbon-arrow-left',
      arrowRight: 'i-carbon-arrow-right',
      check: 'i-carbon-checkmark',
      close: 'i-carbon-close',
      ellipsis: 'i-carbon-overflow-menu-horizontal',
      loading: 'i-carbon-loading',
      minus: 'i-carbon-subtract',
      search: 'i-carbon-search',
    },
    colors: {
      primary: 'blue',
      neutral: 'zinc',
    },
    stepper: {
      slots: {
        root: 'flex gap-4',
        header: 'flex',
        item: 'group text-center relative w-full',
        container: 'relative',
        trigger: 'rounded-full font-medium text-center align-middle flex items-center justify-center font-semibold group-data-[state=completed]:text-inverted group-data-[state=active]:text-inverted text-muted bg-none focus-visible:outline-2 focus-visible:outline-offset-2',
        indicator: 'flex items-center justify-center size-full',
        icon: 'shrink-0',
        separator: 'absolute rounded-full group-data-[disabled]:opacity-75 bg-accented',
        wrapper: '',
        title: 'font-medium text-default',
        description: 'text-muted text-wrap',
        content: 'size-full',
      },
      variants: {
        color: {
          success: {
            trigger: 'group-data-[state=completed]:bg-neutral-900 group-data-[state=active]:bg-neutral-900 group-data-[state=active]:ring-warning group-data-[state=completed]:ring-success ring-1 ring-neutral-900 focus-visible:outline-none',
            separator: 'group-data-[state=completed]:bg-success',
          },
        },
      },
    },
    card: {
      slots: {
        root: 'rounded-lg',
        header: 'p-2 sm:px-4 text-sm font-semibold text-gray-300',
        body: 'p-0 sm:p-0',
        footer: 'p-4 sm:px-6',
      },
      variants: {
        variant: {
          solid: {
            root: 'bg-inverted text-inverted',
          },
          outline: {
            root: 'bg-default ring ring-default divide-y divide-default',
          },
          soft: {
            root: 'bg-elevated/50 divide-y divide-default',
          },
          subtle: {
            root: 'bg-elevated/50 ring ring-default divide-y divide-default',
          },
        },
      },
      defaultVariants: {
        variant: 'outline',
      },
    },
  },
})
