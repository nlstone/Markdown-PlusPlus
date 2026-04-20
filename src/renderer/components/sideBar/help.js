import FilesIcon from '@/assets/icons/files.svg'
import SearchIcon from '@/assets/icons/search.svg'
import TocIcon from '@/assets/icons/toc.svg'
import SettingIcon from '@/assets/icons/setting.svg'
import ZreadIcon from '@/assets/icons/zread.svg'
import AiIcon from '@/assets/icons/ai.svg'

export const sideBarIcons = [
  {
    name: 'files',
    icon: FilesIcon
  }, {
    name: 'search',
    icon: SearchIcon
  }, {
    name: 'toc',
    icon: TocIcon
  }, {
    name: 'ai',
    icon: AiIcon
  }
]

// Conditional icons - only shown when certain conditions are met
export const sideBarConditionalIcons = [
  {
    name: 'zread',
    icon: ZreadIcon
  }
]

export const sideBarBottomIcons = [
  {
    name: 'settings',
    icon: SettingIcon
  }
]
