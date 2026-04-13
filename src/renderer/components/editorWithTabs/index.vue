<template>
    <div class="editor-with-tabs">
      <tabs v-show="showTabBar"></tabs>
      <div class="container">
        <!-- Split preview mode: source code + preview pane -->
        <split-preview
          v-if="splitPreview"
          :markdown="markdown"
          :cursor="cursor"
          :text-direction="textDirection"
          :platform="platform"
        ></split-preview>
        <!-- Normal mode: editor -->
        <editor
          v-show="!splitPreview && !sourceCode"
          :markdown="markdown"
          :cursor="cursor"
          :text-direction="textDirection"
          :platform="platform"
        ></editor>
        <!-- Source code mode only -->
        <source-code
          v-if="!splitPreview && sourceCode"
          :markdown="markdown"
          :cursor="cursor"
          :text-direction="textDirection"
        ></source-code>
      </div>
      <tab-notifications></tab-notifications>
    </div>
</template>

<script>
import Tabs from './tabs.vue'
import Editor from './editor.vue'
import SourceCode from './sourceCode.vue'
import SplitPreview from './splitPreview.vue'
import TabNotifications from './notifications.vue'

export default {
  props: {
    markdown: {
      type: String,
      required: true
    },
    cursor: {
      validator (value) {
        return typeof value === 'object'
      },
      required: true
    },
    sourceCode: {
      type: Boolean,
      required: true
    },
    splitPreview: {
      type: Boolean,
      default: false
    },
    showTabBar: {
      type: Boolean,
      required: true
    },
    textDirection: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      required: true
    }
  },
  components: {
    Tabs,
    Editor,
    SourceCode,
    SplitPreview,
    TabNotifications
  }
}
</script>

<style scoped>
  .editor-with-tabs {
    position: relative;
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    background: var(--editorBgColor);
  }
  .editor-with-tabs > .container {
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    display: flex;
  }
</style>
