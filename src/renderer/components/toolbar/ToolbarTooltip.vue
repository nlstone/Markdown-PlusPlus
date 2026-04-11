<template>
  <el-tooltip
    ref="tooltip"
    class="toolbar-tooltip"
    :content="content"
    :placement="placement"
    :open-delay="openDelay"
    :hide-after="0"
    :enterable="false"
  >
    <slot></slot>
  </el-tooltip>
</template>

<script>
export default {
  name: 'ToolbarTooltip',
  props: {
    content: {
      type: String,
      required: true
    },
    placement: {
      type: String,
      default: 'bottom'
    },
    openDelay: {
      type: Number,
      default: 180
    }
  },
  mounted () {
    const tooltip = this.$refs.tooltip
    if (tooltip && typeof tooltip.handleClosePopper === 'function') {
      tooltip.debounceClose = () => tooltip.handleClosePopper()
    }
  }
}
</script>
