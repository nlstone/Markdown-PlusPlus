import AiAssistant from '../../../src/renderer/components/aiAssistant/index.vue'

describe('AI assistant settings modal', () => {
  const createVm = () => ({
    ...AiAssistant.data(),
    showSettings: true
  })

  it('does not close when a drag starts inside settings content and ends on the backdrop', () => {
    const vm = createVm()
    const backdrop = {}
    const input = {}

    AiAssistant.methods.handleSettingsModalMouseDown.call(vm, {
      target: input,
      currentTarget: backdrop
    })
    AiAssistant.methods.handleSettingsModalClick.call(vm, {
      target: backdrop,
      currentTarget: backdrop
    })

    expect(vm.showSettings).to.equal(true)
  })

  it('still closes when the backdrop itself is clicked', () => {
    const vm = createVm()
    const backdrop = {}

    AiAssistant.methods.handleSettingsModalMouseDown.call(vm, {
      target: backdrop,
      currentTarget: backdrop
    })
    AiAssistant.methods.handleSettingsModalClick.call(vm, {
      target: backdrop,
      currentTarget: backdrop
    })

    expect(vm.showSettings).to.equal(false)
  })
})
