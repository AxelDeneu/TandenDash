<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ $t('dashboard.selectDashboard') }}</DialogTitle>
        <DialogDescription>
          {{ $t('dashboard.chooseOrCreate') }}
        </DialogDescription>
      </DialogHeader>

      <!-- Loading state -->
      <div v-if="dashboard.isLoading.value" class="py-8">
        <div class="flex justify-center items-center space-x-2">
          <Loader2 class="h-6 w-6 animate-spin" />
          <span>{{ $t('dashboard.loadingDashboards') }}</span>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="dashboard.hasError.value" class="py-8">
        <div class="text-center text-destructive">
          <AlertCircle class="h-8 w-8 mx-auto mb-2" />
          <p>{{ dashboard.error.value }}</p>
        </div>
      </div>

      <!-- Dashboard grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
        <div
          v-for="db in dashboard.dashboards.value"
          :key="db.id"
          @click="selectDashboard(db.id)"
          :class="[
            'relative group cursor-pointer rounded-lg border-2 p-4 transition-all',
            db.id === dashboard.currentDashboardId.value
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
          ]"
        >
          <!-- Default badge -->
          <Badge 
            v-if="db.isDefault" 
            variant="secondary" 
            class="absolute top-2 right-2"
          >
            {{ $t('dashboard.byDefault') }}
          </Badge>

          <!-- Current badge -->
          <Badge 
            v-if="db.id === dashboard.currentDashboardId.value" 
            variant="default" 
            class="absolute top-2 left-2"
          >
            {{ $t('dashboard.current') }}
          </Badge>

          <div class="space-y-2">
            <h3 class="font-semibold text-lg">{{ db.name }}</h3>
            
            <div class="text-sm text-muted-foreground">
              <p>{{ $t('dashboard.createdOn', { date: formatDate(db.createdAt) }) }}</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                size="sm" 
                variant="outline"
                @click.stop="editDashboard(db)"
              >
                <Edit2 class="w-3 h-3 mr-1" />
                {{ $t('common.edit') }}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                @click.stop="duplicateDashboard(db)"
              >
                <Copy class="w-3 h-3 mr-1" />
                {{ $t('dashboard.duplicate') }}
              </Button>

              <Button 
                v-if="dashboard.dashboardCount.value > 1"
                size="sm" 
                variant="outline"
                @click.stop="confirmDelete(db)"
                class="text-destructive hover:text-destructive"
              >
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <!-- New dashboard card -->
        <div
          @click="showCreateDialog"
          class="group cursor-pointer rounded-lg border-2 border-dashed border-border p-4 hover:border-primary/50 hover:bg-accent/50 transition-all flex items-center justify-center min-h-[150px]"
        >
          <div class="text-center space-y-2">
            <Plus class="w-8 h-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
            <p class="font-medium">{{ $t('dashboard.newDashboard') }}</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false">
          {{ $t('common.close') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Create/Edit dialog -->
  <Dialog v-model:open="isEditDialogOpen">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ editingDashboard ? $t('dashboard.editDashboard') : $t('dashboard.createDashboard') }}
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <!-- General section -->
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="dashboard-name">{{ $t('dashboard.dashboardName') }}</Label>
            <Input
              id="dashboard-name"
              v-model="dashboardForm.name"
              :placeholder="$t('dashboard.dashboardNamePlaceholder')"
              @keyup.enter="saveDashboard"
            />
          </div>

          <div class="flex items-center space-x-2" v-if="!editingDashboard">
            <Checkbox 
              id="is-default"
              v-model:checked="dashboardForm.isDefault"
            />
            <Label 
              for="is-default" 
              class="text-sm font-normal cursor-pointer"
            >
              {{ $t('dashboard.setAsDefault') }}
            </Label>
          </div>
        </div>

        <!-- Settings section - only show when editing -->
        <template v-if="editingDashboard">
          <Separator />
          
          <!-- Regional Settings -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">{{ $t('dashboard.regionalSettings') }}</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="locale">{{ $t('dashboard.language') }}</Label>
                <Select v-model="settingsForm.locale">
                  <SelectTrigger id="locale">
                    <SelectValue :placeholder="$t('dashboard.selectLanguage')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="timezone">{{ $t('dashboard.timezone') }}</Label>
                <Select v-model="settingsForm.timezone">
                  <SelectTrigger id="timezone">
                    <SelectValue :placeholder="$t('dashboard.selectTimezone')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="Europe/London">Europe/Londres</SelectItem>
                    <SelectItem value="America/New_York">New York</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="dateFormat">{{ $t('dashboard.dateFormat') }}</Label>
                <Select v-model="settingsForm.dateFormat">
                  <SelectTrigger id="dateFormat">
                    <SelectValue :placeholder="$t('dashboard.dateFormat')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label>{{ $t('dashboard.timeFormat') }}</Label>
                <RadioGroup v-model="settingsForm.timeFormat" class="flex gap-4">
                  <div class="flex items-center space-x-2">
                    <RadioGroupItem value="24h" id="24h" />
                    <Label for="24h" class="font-normal">24h</Label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <RadioGroupItem value="12h" id="12h" />
                    <Label for="12h" class="font-normal">12h</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Units Settings -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">{{ $t('dashboard.measurementUnits') }}</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>{{ $t('dashboard.measurementSystem') }}</Label>
                <RadioGroup v-model="settingsForm.measurementSystem" class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <RadioGroupItem value="metric" id="metric" />
                    <Label for="metric" class="font-normal">{{ $t('dashboard.metric') }}</Label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <RadioGroupItem value="imperial" id="imperial" />
                    <Label for="imperial" class="font-normal">{{ $t('dashboard.imperial') }}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div class="space-y-2">
                <Label>{{ $t('dashboard.temperature') }}</Label>
                <RadioGroup v-model="settingsForm.temperatureUnit" class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <RadioGroupItem value="celsius" id="celsius" />
                    <Label for="celsius" class="font-normal">{{ $t('dashboard.celsius') }}</Label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <RadioGroupItem value="fahrenheit" id="fahrenheit" />
                    <Label for="fahrenheit" class="font-normal">{{ $t('dashboard.fahrenheit') }}</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Theme -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">{{ $t('dashboard.appearance') }}</h3>
            <div class="space-y-2">
              <Label>{{ $t('dashboard.theme') }}</Label>
              <RadioGroup v-model="settingsForm.theme" class="flex gap-4">
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label for="light" class="font-normal">{{ $t('theme.light') }}</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label for="dark" class="font-normal">{{ $t('theme.dark') }}</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="auto" />
                  <Label for="auto" class="font-normal">{{ $t('dashboard.auto') }}</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </template>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancelEdit">
          {{ $t('common.cancel') }}
        </Button>
        <Button @click="saveDashboard" :disabled="!dashboardForm.name.trim()">
          {{ editingDashboard ? $t('common.save') : $t('common.create') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete confirmation dialog -->
  <Dialog v-model:open="isDeleteDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t('dashboard.deleteDashboard') }}</DialogTitle>
        <DialogDescription>
          {{ $t('dashboard.deleteDashboardConfirm', { name: deletingDashboard?.name }) }}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="outline" @click="isDeleteDialogOpen = false">
          {{ $t('common.cancel') }}
        </Button>
        <Button variant="destructive" @click="deleteDashboard">
          {{ $t('common.delete') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Edit2, Copy, Trash2, Loader2, AlertCircle } from 'lucide-vue-next'
import { useDashboard, useDashboardSettings } from '@/composables'
import type { Dashboard } from '@/types'

// Props & Emits
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const dashboard = useDashboard()
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const editingDashboard = ref<Dashboard | null>(null)
const deletingDashboard = ref<Dashboard | null>(null)

const dashboardForm = reactive({
  name: '',
  isDefault: false
})

// Settings form state
const settingsForm = reactive({
  locale: 'fr',
  measurementSystem: 'metric' as 'metric' | 'imperial',
  temperatureUnit: 'celsius' as 'celsius' | 'fahrenheit',
  timeFormat: '24h' as '24h' | '12h',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Europe/Paris',
  theme: 'auto' as 'light' | 'dark' | 'auto'
})

// Dashboard settings composable (initialized when editing)
const dashboardSettings = ref<ReturnType<typeof useDashboardSettings> | null>(null)

// Methods
const selectDashboard = async (id: number) => {
  if (id === dashboard.currentDashboardId.value) return
  
  await dashboard.switchDashboard(id)
  isOpen.value = false
}

const showCreateDialog = () => {
  editingDashboard.value = null
  dashboardForm.name = ''
  dashboardForm.isDefault = false
  isEditDialogOpen.value = true
}

const editDashboard = async (db: Dashboard) => {
  editingDashboard.value = db
  dashboardForm.name = db.name
  dashboardForm.isDefault = db.isDefault
  
  // Initialize settings composable and load settings
  dashboardSettings.value = useDashboardSettings(db.id)
  
  // Wait for settings to load
  await dashboardSettings.value.fetchSettings()
  
  // Copy settings to form
  if (dashboardSettings.value.settings.value) {
    const settings = dashboardSettings.value.settings.value
    settingsForm.locale = settings.locale
    settingsForm.measurementSystem = settings.measurementSystem
    settingsForm.temperatureUnit = settings.temperatureUnit
    settingsForm.timeFormat = settings.timeFormat
    settingsForm.dateFormat = settings.dateFormat
    settingsForm.timezone = settings.timezone
    settingsForm.theme = settings.theme
  }
  
  isEditDialogOpen.value = true
}

const duplicateDashboard = async (db: Dashboard) => {
  const { t } = useI18n()
  const newName = t('dashboard.dashboardCopy', { name: db.name })
  await dashboard.duplicateDashboard(db.id, newName)
}

const saveDashboard = async () => {
  if (!dashboardForm.name.trim()) return

  try {
    if (editingDashboard.value) {
      // Update dashboard name
      await dashboard.updateDashboard(editingDashboard.value.id, {
        name: dashboardForm.name
      })
      
      // Update settings if they've been loaded
      if (dashboardSettings.value) {
        await dashboardSettings.value.updateSettings(settingsForm)
      }
    } else {
      // Create new dashboard with default settings
      await dashboard.createDashboard({
        name: dashboardForm.name,
        isDefault: dashboardForm.isDefault,
        settings: settingsForm
      })
    }

    isEditDialogOpen.value = false
  } catch (error) {
    console.error('Error saving dashboard:', error)
  }
}

const confirmDelete = (db: Dashboard) => {
  deletingDashboard.value = db
  isDeleteDialogOpen.value = true
}

const deleteDashboard = async () => {
  if (!deletingDashboard.value) return
  
  await dashboard.deleteDashboard(deletingDashboard.value.id)
  isDeleteDialogOpen.value = false
  deletingDashboard.value = null
}

const cancelEdit = () => {
  isEditDialogOpen.value = false
  dashboardSettings.value = null
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Initialize on mount
onMounted(() => {
  if (dashboard.dashboards.value.length === 0) {
    dashboard.fetchDashboards()
  }
})
</script>