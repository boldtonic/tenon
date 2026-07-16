<script setup lang="ts">
import type { HandleFinish, HandleType, PublicStyle } from '~~/shared/domain/types'
import { HANDLE_FINISH_SPECS } from '~~/shared/domain/handles'
import { uiText as t } from '~~/shared/i18n/ui-copy'

interface Props {
  modelValue: PublicStyle['rendered']['handles']
  variant?: 'card' | 'row'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'card',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: PublicStyle['rendered']['handles']): void
}>()

const open = ref(false)

const handleTypes = computed<{ value: HandleType, label: string }[]>(() => [
  { value: 'auto', label: t('handleAuto') },
  { value: 'knob', label: t('handleKnob') },
  { value: 'bar', label: t('handleBar') },
])

const handleFinishes = computed<{ value: HandleFinish, label: string, color: string }[]>(() => [
  { value: 'graphite', label: t('handleGraphite'), color: HANDLE_FINISH_SPECS.graphite.color },
  { value: 'nickel', label: t('handleNickel'), color: HANDLE_FINISH_SPECS.nickel.color },
  { value: 'brass', label: t('handleBrass'), color: HANDLE_FINISH_SPECS.brass.color },
])

const presets = computed(() =>
  handleTypes.value.flatMap(type =>
    handleFinishes.value.map(finish => ({
      type: type.value,
      typeLabel: type.label,
      finish: finish.value,
      finishLabel: finish.label,
      color: finish.color,
    })),
  ),
)

const selectedTypeLabel = computed(() =>
  handleTypes.value.find(option => option.value === props.modelValue.type)?.label ?? t('handleAuto'),
)
const selectedFinish = computed(() =>
  handleFinishes.value.find(option => option.value === props.modelValue.finish) ?? handleFinishes.value[0]!,
)
const triggerLabel = computed(() => `${selectedTypeLabel.value} · ${selectedFinish.value.label}`)

function pick(type: HandleType, finish: HandleFinish) {
  emit('update:modelValue', { type, finish })
  open.value = false
}

function isSelected(type: HandleType, finish: HandleFinish): boolean {
  return props.modelValue.type === type && props.modelValue.finish === finish
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{ side: 'top', align: 'center', sideOffset: 8, collisionPadding: 12 }"
    :ui="{ content: 'bg-transparent p-0 shadow-none ring-0 rounded-none overflow-visible' }"
  >
    <button
      v-if="variant === 'row'"
      type="button"
      class="flex h-[34px] w-full items-center justify-between gap-2 rounded-lg border border-default bg-default px-2.5 text-left text-xs text-muted transition-[background-color,border-color,transform] duration-150 hover:border-accented hover:bg-accented/40 active:scale-[0.98]"
      :aria-label="`${t('handles')}: ${triggerLabel}`"
    >
      <span class="min-w-0 truncate font-medium text-highlighted">{{ t('handles') }}</span>
      <span class="flex min-w-0 shrink items-center gap-2">
        <span
          class="size-4 shrink-0 rounded-full ring-1 ring-default/70"
          :style="{ backgroundColor: selectedFinish.color }"
        />
        <span class="max-w-36 truncate font-medium text-toned">{{ triggerLabel }}</span>
        <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 text-muted" />
      </span>
    </button>

    <button
      v-else
      type="button"
      class="flex w-full min-h-11 items-center gap-2.5 rounded-xl bg-default px-2 py-1.5 text-left shadow-sm ring-1 ring-default/60 transition-[box-shadow,transform] hover:ring-[color:color-mix(in_oklch,var(--color-morti-400)_40%,var(--ui-border))] active:scale-[0.99]"
      :aria-label="`${t('handles')}: ${triggerLabel}`"
    >
      <span class="handle-trigger-preview h-9 w-12 shrink-0 rounded-md ring-1 ring-default/70">
        <span
          class="handle-trigger-bar"
          :style="{ backgroundColor: selectedFinish.color }"
        />
      </span>
      <span class="min-w-0 flex-1 leading-tight">
        <span class="block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{{ t('handles') }}</span>
        <span class="block truncate text-xs font-semibold text-highlighted">{{ triggerLabel }}</span>
      </span>
      <UIcon name="i-lucide-chevron-down" class="size-3.5 shrink-0 text-muted" />
    </button>

    <template #content>
      <div class="handle-picker-popover scrollbar-thin">
        <div class="handle-picker-header">
          <p class="shrink-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            {{ t('handles') }}
          </p>
          <p class="min-w-0 truncate text-right text-[10px] text-muted/80">
            {{ t('handleTypeAndFinish') }}
          </p>
        </div>

        <div class="handle-picker-grid grid grid-cols-3 gap-2">
          <button
            v-for="preset in presets"
            :key="`${preset.type}-${preset.finish}`"
            type="button"
            class="handle-preset-card group/card relative flex min-w-0 flex-col overflow-hidden rounded-xl bg-default text-left transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.96]"
            :class="isSelected(preset.type, preset.finish) ? 'is-selected' : undefined"
            :aria-label="`${preset.typeLabel} · ${preset.finishLabel}`"
            :aria-pressed="isSelected(preset.type, preset.finish)"
            @click="pick(preset.type, preset.finish)"
          >
            <span class="handle-preview relative grid h-14 w-full place-items-center">
              <span
                v-if="preset.type === 'auto'"
                class="handle-preview-auto"
                :style="{ '--handle-color': preset.color }"
              >
                <span class="handle-preview-knob" />
                <span class="handle-preview-bar" />
              </span>
              <span
                v-else-if="preset.type === 'knob'"
                class="handle-preview-knob"
                :style="{ '--handle-color': preset.color }"
              />
              <span
                v-else
                class="handle-preview-bar"
                :style="{ '--handle-color': preset.color }"
              />
              <span
                v-if="isSelected(preset.type, preset.finish)"
                class="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-inverted shadow"
                aria-hidden="true"
              >
                <UIcon name="i-lucide-check" class="size-3" />
              </span>
            </span>
            <span class="flex min-w-0 flex-col gap-0 px-2 py-1.5">
              <span class="truncate text-[11px] font-semibold leading-tight text-highlighted">
                {{ preset.typeLabel }}
              </span>
              <span class="truncate text-[10px] leading-tight text-muted">
                {{ preset.finishLabel }}
              </span>
            </span>
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.handle-picker-popover {
  box-sizing: border-box;
  isolation: isolate;
  width: min(20rem, calc(100vw - 1.5rem), var(--reka-popover-content-available-width, calc(100vw - 1.5rem)));
  max-height: min(28rem, calc(100dvh - 1.5rem), var(--reka-popover-content-available-height, calc(100dvh - 1.5rem)));
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 18px;
  background: color-mix(in oklch, var(--ui-bg-muted) 97%, transparent);
  padding: 12px;
  box-shadow:
    0 22px 56px rgb(0 0 0 / 0.36),
    0 7px 18px rgb(0 0 0 / 0.2),
    inset 0 0 0 1px color-mix(in oklch, var(--ui-border) 82%, transparent);
  backdrop-filter: blur(12px);
}

.handle-picker-header {
  position: sticky;
  top: -12px;
  z-index: 2;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: -12px -12px 8px;
  border-radius: 18px 18px 0 0;
  background: color-mix(in oklch, var(--ui-bg-muted) 97%, transparent);
  padding: 12px 13px 10px;
  backdrop-filter: blur(12px);
}

.handle-trigger-preview,
.handle-preview {
  background: color-mix(in oklch, var(--ui-bg-accented) 58%, var(--ui-bg));
}

.handle-trigger-preview {
  position: relative;
  display: grid;
  place-items: center;
}

.handle-trigger-bar,
.handle-preview-bar {
  position: relative;
  display: block;
  width: 30px;
  height: 5px;
  border-radius: 999px;
  background: var(--handle-color);
  box-shadow:
    0 2px 4px rgb(0 0 0 / 0.28),
    inset 0 1px 0 rgb(255 255 255 / 0.22);
}

.handle-trigger-bar {
  width: 28px;
  height: 4px;
}

.handle-preview-knob {
  display: block;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--handle-color);
  box-shadow:
    0 2px 4px rgb(0 0 0 / 0.3),
    inset 0 1px 0 rgb(255 255 255 / 0.3);
}

.handle-preview-auto {
  display: flex;
  align-items: center;
  gap: 8px;
}

.handle-preset-card {
  box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--ui-border-muted) 82%, transparent);
}

.handle-preset-card:hover {
  box-shadow:
    inset 0 0 0 1px color-mix(in oklch, var(--ui-primary) 38%, var(--ui-border-muted)),
    0 8px 20px rgb(0 0 0 / 0.18);
}

.handle-preset-card:focus-visible {
  outline: 2px solid color-mix(in oklch, var(--ui-primary) 62%, transparent);
  outline-offset: 2px;
}

.handle-preset-card.is-selected {
  box-shadow:
    inset 0 0 0 2px var(--ui-primary),
    0 10px 24px rgb(0 0 0 / 0.22);
}

@media (max-width: 359.98px) {
  .handle-picker-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
