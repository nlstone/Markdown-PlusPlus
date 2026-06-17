export function normalizeWikiVersions (versions = [], currentVersionPath = '') {
  const normalized = versions
    .filter(version => version && version.versionPath)
    .map(version => ({
      versionPath: version.versionPath,
      title: version.title || version.versionPath,
      pageCount: version.pageCount || 0,
      isCurrent: version.versionPath === currentVersionPath
    }))

  if (currentVersionPath && !normalized.some(version => version.versionPath === currentVersionPath)) {
    normalized.push({
      versionPath: currentVersionPath,
      title: currentVersionPath,
      pageCount: 0,
      isCurrent: true
    })
  }

  return normalized
}

export function transformWikiPagesToTree (pages, rootPath, versionPath, wikiDirPrefix) {
  const sectionsMap = {}

  for (const page of pages || []) {
    const sectionName = page.section || '未分类'
    const groupName = page.group

    if (!sectionsMap[sectionName]) {
      sectionsMap[sectionName] = {
        label: sectionName,
        children: {}
      }
    }

    const sectionNode = sectionsMap[sectionName]
    const pageNode = {
      label: page.title,
      file: page.file,
      fullPath: `${rootPath}/${wikiDirPrefix}/${versionPath}/${page.file}`,
      level: page.level,
      isLeaf: true
    }

    if (!groupName) {
      sectionNode.children[page.title] = pageNode
    } else {
      if (!sectionNode.children[groupName]) {
        sectionNode.children[groupName] = {
          label: groupName,
          children: {}
        }
      }
      sectionNode.children[groupName].children[page.title] = pageNode
    }
  }

  return Object.values(sectionsMap).map(section => ({
    label: section.label,
    children: Object.values(section.children).map(item => {
      if (item.isLeaf) return item
      return {
        label: item.label,
        children: Object.values(item.children)
      }
    })
  }))
}
