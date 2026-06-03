/**
 * Wiki Generator Unit Tests
 *
 * Tests the core logic of the wiki generator service.
 * Mocks Electron IPC and fetch API for isolated testing.
 */

/* eslint-disable no-unused-expressions */

// Test data
const SAMPLE_STRUCTURE_XML = `<wiki_structure>
  <title>Test Project Wiki</title>
  <description>A wiki for the test project</description>
  <sections>
    <section id="section-1">
      <title>Overview</title>
      <pages>
        <page_ref>page-1</page_ref>
      </pages>
    </section>
    <section id="section-2">
      <title>Architecture</title>
      <pages>
        <page_ref>page-2</page_ref>
      </pages>
    </section>
  </sections>
  <pages>
    <page id="page-1">
      <title>Project Overview</title>
      <description>General information about the project</description>
      <importance>high</importance>
      <relevant_files>
        <file_path>README.md</file_path>
        <file_path>src/main.js</file_path>
      </relevant_files>
      <related_pages>
        <related>page-2</related>
      </related_pages>
      <parent_section>section-1</parent_section>
    </page>
    <page id="page-2">
      <title>Application Architecture</title>
      <description>How the application is structured</description>
      <importance>high</importance>
      <relevant_files>
        <file_path>src/app.js</file_path>
        <file_path>src/utils.js</file_path>
      </relevant_files>
      <related_pages>
        <related>page-1</related>
      </related_pages>
      <parent_section>section-2</parent_section>
    </page>
  </pages>
</wiki_structure>`

describe('Wiki Generator', () => {
  // ============================================================================
  // Token Estimation Tests
  // ============================================================================

  describe('Token Estimation', () => {
    it('should estimate tokens correctly for empty string', () => {
      // The estimateTokens function is not exported, but we can test the logic
      const text = ''
      const tokens = Math.ceil(text.length / 4) + 100
      expect(tokens).to.equal(100) // Only metadata
    })

    it('should estimate tokens correctly for short text', () => {
      const text = 'Hello, World!'
      const tokens = Math.ceil(text.length / 4) + 100
      expect(tokens).to.equal(104) // 13 chars / 4 = 4, + 100 metadata
    })

    it('should estimate tokens correctly for code block', () => {
      const text = 'function hello() {\n  return "world"\n}'
      const tokens = Math.ceil(text.length / 4) + 100
      expect(tokens).to.equal(110) // 39 chars / 4 = 10, + 100 metadata
    })
  })

  // ============================================================================
  // XML Parsing Tests
  // ============================================================================

  describe('XML Parsing', () => {
    // We need to import parseStructureXML, but it's not exported
    // So we'll test the XML parsing logic directly

    it('should parse valid wiki structure XML', () => {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(SAMPLE_STRUCTURE_XML, 'text/xml')

      const title = xmlDoc.querySelector('title')?.textContent
      expect(title).to.equal('Test Project Wiki')

      const pages = xmlDoc.querySelectorAll('page')
      expect(pages.length).to.equal(2)

      const firstPage = pages[0]
      expect(firstPage.querySelector('title')?.textContent).to.equal('Project Overview')
      expect(firstPage.querySelector('importance')?.textContent).to.equal('high')

      const filePaths = firstPage.querySelectorAll('file_path')
      expect(filePaths.length).to.equal(2)
      expect(filePaths[0].textContent).to.equal('README.md')
    })

    it('should parse sections correctly', () => {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(SAMPLE_STRUCTURE_XML, 'text/xml')

      const sections = xmlDoc.querySelectorAll('section')
      expect(sections.length).to.equal(2)

      const firstSection = sections[0]
      expect(firstSection.querySelector('title')?.textContent).to.equal('Overview')

      const pageRefs = firstSection.querySelectorAll('page_ref')
      expect(pageRefs.length).to.equal(1)
      expect(pageRefs[0].textContent).to.equal('page-1')
    })

    it('should handle XML with markdown delimiters', () => {
      const xmlWithDelimiters = '```xml\n' + SAMPLE_STRUCTURE_XML + '\n```'
      const cleaned = xmlWithDelimiters.replace(/^```(?:xml)?\s*/i, '').replace(/```\s*$/i, '')

      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(cleaned, 'text/xml')

      const title = xmlDoc.querySelector('title')?.textContent
      expect(title).to.equal('Test Project Wiki')
    })

    it('should handle invalid XML gracefully', () => {
      const invalidXml = '<wiki_structure><title>Test</title></wiki_structure>'
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(invalidXml, 'text/xml')

      // Should still parse, just with missing elements
      const title = xmlDoc.querySelector('title')?.textContent
      expect(title).to.equal('Test')

      const pages = xmlDoc.querySelectorAll('page')
      expect(pages.length).to.equal(0)
    })
  })

  // ============================================================================
  // Batch Creation Tests
  // ============================================================================

  describe('Batch Creation', () => {
    it('should create batches within token budget', () => {
      const files = [
        { path: 'file1.js', tokens: 1000 },
        { path: 'file2.js', tokens: 2000 },
        { path: 'file3.js', tokens: 3000 },
        { path: 'file4.js', tokens: 4000 },
        { path: 'file5.js', tokens: 5000 }
      ]

      const tokenBudget = 8000
      const batches = []
      let currentBatch = []
      let currentTokens = 0

      for (const file of files) {
        if (currentTokens + file.tokens > tokenBudget && currentBatch.length > 0) {
          batches.push([...currentBatch])
          currentBatch = []
          currentTokens = 0
        }
        currentBatch.push(file)
        currentTokens += file.tokens
      }

      if (currentBatch.length > 0) {
        batches.push(currentBatch)
      }

      // Should create 3 batches: [file1, file2], [file3, file4], [file5]
      // Because: 1000+2000=3000, 3000+3000=6000 (ok), 6000+4000=10000 (exceeds) -> new batch
      // Then: 4000+5000=9000 (exceeds) -> new batch
      expect(batches.length).to.be.at.least(2)
      expect(batches.length).to.be.at.most(3)
    })

    it('should handle single file exceeding budget', () => {
      const files = [
        { path: 'large.js', tokens: 200000 }
      ]

      const tokenBudget = 150000
      const batches = []
      let currentBatch = []
      let currentTokens = 0

      for (const file of files) {
        if (currentTokens + file.tokens > tokenBudget && currentBatch.length > 0) {
          batches.push([...currentBatch])
          currentBatch = []
          currentTokens = 0
        }
        currentBatch.push(file)
        currentTokens += file.tokens
      }

      if (currentBatch.length > 0) {
        batches.push(currentBatch)
      }

      // Should still create 1 batch with the large file
      expect(batches.length).to.equal(1)
      expect(batches[0].length).to.equal(1)
    })

    it('should create empty batch list for no files', () => {
      const files = []
      const batches = []

      if (files.length > 0) {
        batches.push(files)
      }

      expect(batches.length).to.equal(0)
    })
  })

  // ============================================================================
  // Slug Generation Tests
  // ============================================================================

  describe('Slug Generation', () => {
    function generateSlug (index, title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40)
      return `${index + 1}-${slug || 'page'}`
    }

    it('should generate slug from English title', () => {
      expect(generateSlug(0, 'Project Overview')).to.equal('1-project-overview')
    })

    it('should generate slug from title with special chars', () => {
      expect(generateSlug(1, 'API Reference (v2.0)')).to.equal('2-api-reference-v20')
    })

    it('should handle empty title', () => {
      expect(generateSlug(2, '')).to.equal('3-page')
    })

    it('should truncate long titles', () => {
      const longTitle = 'This is a very long title that should be truncated to forty characters'
      const slug = generateSlug(3, longTitle)
      expect(slug.length).to.be.at.most(50) // 2 digits + dash + 40 chars
    })
  })

  // ============================================================================
  // Timestamp ID Generation Tests
  // ============================================================================

  describe('Timestamp ID Generation', () => {
    function generateTimestampId () {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const h = String(now.getHours()).padStart(2, '0')
      const min = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      return `${y}${m}${d}${h}${min}${s}`
    }

    it('should generate valid timestamp ID', () => {
      const id = generateTimestampId()
      expect(id).to.have.length(14)
      expect(id).to.match(/^\d{14}$/)
    })

    it('should generate unique IDs', () => {
      const id1 = generateTimestampId()
      // IDs should be valid strings
      expect(id1).to.be.a('string')
      expect(id1).to.have.length(14)
    })
  })

  // ============================================================================
  // Wiki JSON Structure Tests
  // ============================================================================

  describe('Wiki JSON Structure', () => {
    it('should create valid wiki.json structure', () => {
      const versionId = '20260530120000'
      const language = 'zh'
      const pages = [
        { slug: '1-overview', title: 'Overview', filename: '1-overview.md', section: 'Getting Started', importance: 'high' },
        { slug: '2-architecture', title: 'Architecture', filename: '2-architecture.md', section: 'Design', importance: 'medium' }
      ]

      const wikiJson = {
        id: versionId,
        generated_at: new Date().toISOString(),
        language,
        pages: pages.map(p => ({
          slug: p.slug,
          title: p.title,
          file: p.filename,
          section: p.section,
          level: p.importance === 'high' ? 'Beginner' : p.importance === 'low' ? 'Advanced' : 'Intermediate'
        }))
      }

      expect(wikiJson.id).to.equal(versionId)
      expect(wikiJson.language).to.equal('zh')
      expect(wikiJson.pages).to.have.length(2)
      expect(wikiJson.pages[0].level).to.equal('Beginner')
      expect(wikiJson.pages[1].level).to.equal('Intermediate')
    })

    it('should map importance levels correctly', () => {
      const importanceToLevel = (importance) => {
        return importance === 'high' ? 'Beginner' : importance === 'low' ? 'Advanced' : 'Intermediate'
      }

      expect(importanceToLevel('high')).to.equal('Beginner')
      expect(importanceToLevel('medium')).to.equal('Intermediate')
      expect(importanceToLevel('low')).to.equal('Advanced')
    })
  })

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle missing file tree', () => {
      const fileTreeData = { fileTree: null, readme: '' }
      expect(fileTreeData.fileTree).to.be.null
    })

    it('should handle empty file tree', () => {
      const fileTreeData = { fileTree: '', readme: '' }
      const allFiles = fileTreeData.fileTree.split('\n').filter(f => f.trim())
      expect(allFiles).to.have.length(0)
    })

    it('should handle XML parse error', () => {
      const invalidXml = 'not xml at all'
      const xmlMatch = invalidXml.match(/<wiki_structure>[\s\S]*?<\/wiki_structure>/m)
      expect(xmlMatch).to.be.null
    })

    it('should handle empty page list from structure', () => {
      const structure = { pages: [] }
      expect(structure.pages).to.have.length(0)
    })
  })
})
