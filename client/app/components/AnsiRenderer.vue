<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  ansi?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  ansi: () => [''],
})

interface AnsiStyles {
  color: string | null
  backgroundColor: string | null
  bold: boolean
  italic: boolean
  underline: boolean
}

interface AnsiPart {
  text: string
  styles: AnsiStyles
}

// ANSI color codes mapping to Tailwind classes
const ansiColors: Record<number, string> = {
  30: 'text-black', // Black
  31: 'text-red-500', // Red
  32: 'text-green-500', // Green
  33: 'text-yellow-500', // Yellow
  34: 'text-blue-500', // Blue
  35: 'text-pink-500', // Magenta
  36: 'text-cyan-500', // Cyan
  37: 'text-white', // White
  90: 'text-gray-500', // Bright Black (Gray)
  91: 'text-red-400', // Bright Red
  92: 'text-green-400', // Bright Green
  93: 'text-yellow-400', // Bright Yellow
  94: 'text-blue-400', // Bright Blue
  95: 'text-pink-400', // Bright Magenta
  96: 'text-cyan-400', // Bright Cyan
  97: 'text-gray-100', // Bright White
}

const ansiBgColors: Record<number, string> = {
  40: 'bg-black', // Black background
  41: 'bg-red-500', // Red background
  42: 'bg-green-500', // Green background
  43: 'bg-yellow-500', // Yellow background
  44: 'bg-blue-500', // Blue background
  45: 'bg-pink-500', // Magenta background
  46: 'bg-cyan-500', // Cyan background
  47: 'bg-white', // White background
  100: 'bg-gray-500', // Bright Black background
  101: 'bg-red-400', // Bright Red background
  102: 'bg-green-400', // Bright Green background
  103: 'bg-yellow-400', // Bright Yellow background
  104: 'bg-blue-400', // Bright Blue background
  105: 'bg-pink-400', // Bright Magenta background
  106: 'bg-cyan-400', // Bright Cyan background
  107: 'bg-gray-100', // Bright White background
}

// Parse ANSI escape sequences and convert to class arrays
function parseAnsiLineToClasses(line: string): AnsiPart[] {
  const ansiRegex = new RegExp(`${String.fromCharCode(27)}\\[([0-9;]+)m`, 'g') // Dynamically create regex
  const parts: AnsiPart[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  let currentStyles: AnsiStyles = {
    color: null,
    backgroundColor: null,
    bold: false,
    italic: false,
    underline: false,
  }

  for (;;) { // Changed from while loop
    match = ansiRegex.exec(line)
    if (match === null || !match[1]) // Add null check for match[1]
      break

    // Add text before the ANSI code
    if (match.index > lastIndex) {
      const textContent = line.slice(lastIndex, match.index)
      if (textContent) {
        parts.push({
          text: textContent,
          styles: { ...currentStyles },
        })
      }
    }

    // Parse the ANSI codes
    const codes = match[1].split(';').map(code => Number.parseInt(code, 10))

    codes.forEach((code) => {
      if (code === 0) {
        // Reset all styles
        currentStyles = {
          color: null,
          backgroundColor: null,
          bold: false,
          italic: false,
          underline: false,
        }
      }
      else if (code === 1) {
        currentStyles.bold = true
      }
      else if (code === 3) {
        currentStyles.italic = true
      }
      else if (code === 4) {
        currentStyles.underline = true
      }
      else if (code === 22) {
        currentStyles.bold = false
      }
      else if (code === 23) {
        currentStyles.italic = false
      }
      else if (code === 24) {
        currentStyles.underline = false
      }
      else if (ansiColors[code]) {
        currentStyles.color = ansiColors[code]
      }
      else if (ansiBgColors[code]) {
        currentStyles.backgroundColor = ansiBgColors[code]
      }
    })

    lastIndex = ansiRegex.lastIndex
  }

  // Add remaining text
  if (lastIndex < line.length) {
    const textContent = line.slice(lastIndex)
    if (textContent) {
      parts.push({
        text: textContent,
        styles: { ...currentStyles },
      })
    }
  }

  return parts
}

const parsedContent = computed(() => {
  return props.ansi.map(line => parseAnsiLineToClasses(line))
})

function getClasses(styles: AnsiStyles): string[] {
  const classes: string[] = []

  if (styles.color)
    classes.push(styles.color)
  if (styles.backgroundColor)
    classes.push(styles.backgroundColor)
  if (styles.bold)
    classes.push('font-bold')
  if (styles.italic)
    classes.push('italic')
  if (styles.underline)
    classes.push('underline')

  return classes
}
</script>

<template>
  <div class="bg-neutral-950 rounded-lg shadow-sm overflow-hidden w-full font-mono">
    <div class="p-4 text-sm min-h-12">
      <Transition name="fade" mode="out-in">
        <div :key="props.ansi.join('\n')" class="flex-1 w-full">
          <div
            v-for="(lineParts, lineIndex) in parsedContent"
            :key="lineIndex"
            class="flex space-x-2"
          >
            <div class="text-green-400 font-medium flex-shrink-0">
              $
            </div>
            <div>
              <span
                v-for="(part, partIndex) in lineParts"
                :key="partIndex"
                :class="getClasses(part.styles)"
              >{{ part.text }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
