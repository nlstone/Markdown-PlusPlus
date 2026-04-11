<template>
  <div class="pref-general">
    <h4>{{ $t('preference.categories.general') }}</h4>
    <compound>
      <template #head>
        <h6 class="title">{{ $t('preference.general.autoSave.title') }}</h6>
      </template>
      <template #children>
        <bool
          :description="$t('preference.general.autoSave.autoSaveDescription')"
          :bool="autoSave"
          :onChange="value => onSelectChange('autoSave', value)"
        ></bool>
        <range
          :description="$t('preference.general.autoSave.delayDescription')"
          :value="autoSaveDelay"
          :min="1000"
          :max="10000"
          unit="ms"
          :step="100"
          :onChange="value => onSelectChange('autoSaveDelay', value)"
        ></range>
      </template>
    </compound>

    <compound>
      <template #head>
        <h6 class="title">{{ $t('preference.general.window.title') }}</h6>
      </template>
      <template #children>
        <cur-select
          v-if="!isOsx"
          :description="$t('preference.general.window.titleBarStyle')"
          :notes="$t('preference.general.window.titleBarStyleNote')"
          :value="titleBarStyle"
          :options="titleBarStyleOptions"
          :onChange="value => onSelectChange('titleBarStyle', value)"
        ></cur-select>
        <bool
          :description="$t('preference.general.window.hideScrollbar')"
          :bool="hideScrollbar"
          :onChange="value => onSelectChange('hideScrollbar', value)"
        ></bool>
        <bool
          :description="$t('preference.general.window.openFilesInNewWindow')"
          :bool="openFilesInNewWindow"
          :onChange="value => onSelectChange('openFilesInNewWindow', value)"
        ></bool>
        <bool
          :description="$t('preference.general.window.openFolderInNewWindow')"
          :bool="openFolderInNewWindow"
          :onChange="value => onSelectChange('openFolderInNewWindow', value)"
        ></bool>
        <cur-select
          :description="$t('preference.general.window.zoom')"
          :value="zoom"
          :options="zoomOptions"
          :onChange="value => onSelectChange('zoom', value)"
        ></cur-select>
      </template>
    </compound>

    <compound>
      <template #head>
        <h6 class="title">{{ $t('preference.general.sidebar.title') }}</h6>
      </template>
      <template #children>
        <bool
          :description="$t('preference.general.sidebar.wordWrapInToc')"
          :bool="wordWrapInToc"
          :onChange="value => onSelectChange('wordWrapInToc', value)"
        ></bool>

        <cur-select
          :description="$t('preference.general.sidebar.fileSortBy')"
          :value="fileSortBy"
          :options="fileSortByOptions"
          :onChange="value => onSelectChange('fileSortBy', value)"
          :disable="true"
        ></cur-select>
      </template>
    </compound>

    <compound>
      <template #head>
        <h6 class="title">{{ $t('preference.general.startup.title') }}</h6>
      </template>
      <template #children>
        <section class="startup-action-ctrl">
          <el-radio-group v-model="startUpAction">
            <el-radio label="folder" style="margin-bottom: 10px;">{{ $t('preference.general.startup.openDefaultDir') }}<span>: {{defaultDirectoryToOpen}}</span></el-radio>
            <el-button size="small" @click="selectDefaultDirectoryToOpen">{{ $t('preference.general.startup.selectFolder') }}</el-button>
            <el-radio label="blank">{{ $t('preference.general.startup.openBlank') }}</el-radio>
          </el-radio-group>
        </section>
      </template>
    </compound>

    <compound>
      <template #head>
        <h6 class="title">{{ $t('preference.general.misc.title') }}</h6>
      </template>
      <template #children>
        <cur-select
          :description="$t('preference.general.misc.language')"
          :value="language"
          :options="languageOptions"
          :onChange="value => onLanguageChange(value)"
        ></cur-select>
      </template>
    </compound>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Compound from '../common/compound'
import Range from '../common/range'
import CurSelect from '../common/select'
import Bool from '../common/bool'
import Separator from '../common/separator'
import { isOsx } from '@/util'
import { setLanguage } from '../../i18n'

import {
  titleBarStyleOptions as titleBarStyleOptionsBase,
  zoomOptions as zoomOptionsBase,
  fileSortByOptions as fileSortByOptionsBase,
  languageOptions as languageOptionsBase
} from './config'

export default {
  components: {
    Compound,
    Bool,
    Range,
    CurSelect,
    Separator
  },
  data () {
    this.isOsx = isOsx
    return {}
  },
  computed: {
    // Translated options using i18n
    titleBarStyleOptions () {
      return titleBarStyleOptionsBase.map(opt => ({
        label: this.$t(`config.titleBarStyle.${opt.value}`),
        value: opt.value
      }))
    },
    zoomOptions () {
      return zoomOptionsBase
    },
    fileSortByOptions () {
      return fileSortByOptionsBase.map(opt => ({
        label: this.$t(`config.fileSortBy.${opt.value}`),
        value: opt.value
      }))
    },
    languageOptions () {
      return languageOptionsBase.map(opt => ({
        label: this.$t(`config.language.${opt.value}`),
        value: opt.value
      }))
    },
    ...mapState({
      autoSave: state => state.preferences.autoSave,
      autoSaveDelay: state => state.preferences.autoSaveDelay,
      titleBarStyle: state => state.preferences.titleBarStyle,
      defaultDirectoryToOpen: state => state.preferences.defaultDirectoryToOpen,
      openFilesInNewWindow: state => state.preferences.openFilesInNewWindow,
      openFolderInNewWindow: state => state.preferences.openFolderInNewWindow,
      zoom: state => state.preferences.zoom,
      hideScrollbar: state => state.preferences.hideScrollbar,
      wordWrapInToc: state => state.preferences.wordWrapInToc,
      fileSortBy: state => state.preferences.fileSortBy,
      language: state => state.preferences.language
    }),
    startUpAction: {
      get: function () {
        return this.$store.state.preferences.startUpAction
      },
      set: function (value) {
        const type = 'startUpAction'
        this.$store.dispatch('SET_SINGLE_PREFERENCE', { type, value })
      }
    }
  },
  methods: {
    onSelectChange (type, value) {
      this.$store.dispatch('SET_SINGLE_PREFERENCE', { type, value })
    },
    selectDefaultDirectoryToOpen () {
      this.$store.dispatch('SELECT_DEFAULT_DIRECTORY_TO_OPEN')
    },
    onLanguageChange (lang) {
      setLanguage(lang)
      this.onSelectChange('language', lang)
    }
  }
}
</script>

<style scoped>
  .pref-general {
    & .startup-action-ctrl {
      font-size: 14px;
      user-select: none;
      color: var(--editorColor);
      & .el-button--small {
        margin-left: 25px;
      }
      & label {
        display: block;
        margin: 20px 0;
      }
    }
  }
</style>
