<script setup lang="ts">
import { UI_LOCALE_STORAGE_KEY } from '~~/shared/i18n/locale'
import type { UiLocale } from '~~/shared/i18n/ui-copy'
import { ACTIVE_UI_LOCALE, uiText as t } from '~~/shared/i18n/ui-copy'

const emit = defineEmits<{ (e: 'restart'): void }>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const themeAriaLabel = computed(() =>
  t('pillThemeAria', { mode: isDark.value ? t('pillThemeLight') : t('pillThemeDark') }),
)

/** 0 = colapsado, 1 = tema+idioma+"···", 2 = todo en línea */
const level = ref<0 | 1 | 2>(0)
const pinned = ref(false)
const confirmOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

let hoverTimer: ReturnType<typeof setTimeout> | null = null

function onPointerEnter(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    if (level.value === 0) level.value = 1
  }, 150)
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  if (!pinned.value && !confirmOpen.value) level.value = 0
}

function onMarkClick() {
  pinned.value = true
  if (level.value === 0) level.value = 1
}

function openMore() {
  pinned.value = true
  level.value = 2
}

function collapse() {
  pinned.value = false
  level.value = 0
}

function onDocumentPointerDown(event: PointerEvent) {
  if (confirmOpen.value) return
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) collapse()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !confirmOpen.value && level.value > 0) collapse()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  if (hoverTimer) clearTimeout(hoverTimer)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

function setLocale(locale: UiLocale) {
  if (locale === ACTIVE_UI_LOCALE) return
  localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale)
  window.location.reload()
}

function onRestartConfirm() {
  confirmOpen.value = false
  collapse()
  emit('restart')
}
</script>

<template>
  <div
    ref="rootRef"
    class="product-pill-anchor pointer-events-auto"
    :class="`product-pill-anchor--level-${level}`"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <div class="product-pill flex items-center rounded-full bg-elevated shadow-md ring-1 ring-default/50">
      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center rounded-full transition-transform active:scale-[0.95]"
        :aria-label="t('pillMenuAria')"
        :aria-expanded="level > 0"
        @click="onMarkClick"
      >
        <span class="flex size-6 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-inverted">T</span>
      </button>

      <div
        class="product-pill-items flex items-center gap-1 overflow-hidden"
        :class="level > 0 ? 'product-pill-items--open' : ''"
      >
        <template v-if="level > 0">
          <UButton
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            size="xs"
            color="neutral"
            variant="ghost"
            class="rounded-full transition-transform active:scale-[0.95]"
            :aria-label="themeAriaLabel"
            @click="toggleTheme"
          />

          <span
            class="flex rounded-full bg-muted p-0.5"
            role="group"
            :aria-label="t('pillLanguageAria')"
          >
            <button
              type="button"
              class="min-h-6 rounded-full px-2 text-[11px] font-semibold transition-colors"
              :class="ACTIVE_UI_LOCALE === 'es' ? 'bg-elevated text-highlighted shadow-sm' : 'text-muted hover:text-highlighted'"
              :aria-pressed="ACTIVE_UI_LOCALE === 'es'"
              @click="setLocale('es')"
            >
              ES
            </button>
            <button
              type="button"
              class="min-h-6 rounded-full px-2 text-[11px] font-semibold transition-colors"
              :class="ACTIVE_UI_LOCALE === 'en' ? 'bg-elevated text-highlighted shadow-sm' : 'text-muted hover:text-highlighted'"
              :aria-pressed="ACTIVE_UI_LOCALE === 'en'"
              @click="setLocale('en')"
            >
              EN
            </button>
          </span>

          <UButton
            v-if="level === 1"
            icon="i-lucide-ellipsis"
            size="xs"
            color="neutral"
            variant="ghost"
            class="rounded-full transition-transform active:scale-[0.95]"
            :aria-label="t('pillMoreAria')"
            @click="openMore"
          />

          <template v-else>
            <UButton
              icon="i-lucide-rotate-ccw"
              size="xs"
              color="error"
              variant="ghost"
              class="rounded-full transition-transform active:scale-[0.95]"
              :aria-label="t('pillRestart')"
              @click="confirmOpen = true"
            >
              <span class="hidden md:inline">{{ t('pillRestart') }}</span>
            </UButton>
            <UButton
              icon="i-lucide-house"
              size="xs"
              color="neutral"
              variant="ghost"
              to="/"
              class="rounded-full transition-transform active:scale-[0.95]"
              :aria-label="t('home')"
            >
              <span class="hidden md:inline">{{ t('home') }}</span>
            </UButton>
          </template>
        </template>
      </div>
    </div>

    <AppConfirmDialog
      v-model:open="confirmOpen"
      :title="t('pillRestartTitle')"
      :message="t('pillRestartMessage')"
      :confirm-label="t('pillRestart')"
      confirm-color="error"
      @confirm="onRestartConfirm"
    />
  </div>
</template>

<style scoped>
.product-pill-anchor {
  --product-pill-rest-y: 1.25rem;
  --product-pill-open-y: -0.75rem;
}

.product-pill {
  min-height: 3rem;
  min-width: 3rem;
  padding: 4px;
  transform: translateY(var(--product-pill-rest-y));
  transform-origin: bottom center;
  transition:
    min-width 0.22s ease,
    transform 0.22s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.product-pill-anchor--level-1 .product-pill,
.product-pill-anchor--level-2 .product-pill {
  transform: translateY(var(--product-pill-open-y));
}

.product-pill-items {
  max-width: 0;
  opacity: 0;
  transition: max-width 0.22s ease, opacity 0.18s ease, margin-left 0.22s ease;
}

.product-pill-items--open {
  max-width: 26rem;
  opacity: 1;
  margin-left: 4px;
}
</style>
