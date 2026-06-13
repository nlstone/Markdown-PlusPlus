// Copy from https://github.com/utatti/simple-pandoc/blob/master/index.js
import { spawn } from 'child_process'
import commandExists from 'command-exists'
import { isFile2 } from 'common/filesystem'

const pandocCommand = 'pandoc'

const getCommand = () => {
  if (envPathExists()) {
    return process.env.MARKDOWNPP_PANDOC
  }
  return pandocCommand
}

export const buildPandocOptions = (from, to, outputPath = null, ...args) => {
  const option = ['-s', from, '-t', to]
  if (outputPath) {
    option.push('-o', outputPath)
  }
  return option.concat(args)
}

const pandoc = (from, to, ...args) => {
  const command = getCommand()
  const option = buildPandocOptions(from, to, null, ...args)

  const converter = () => new Promise((resolve, reject) => {
    const proc = spawn(command, option)
    proc.on('error', reject)
    let data = ''
    proc.stdout.on('data', chunk => {
      data += chunk.toString()
    })
    proc.stdout.on('end', () => resolve(data))
    proc.stdout.on('error', reject)
    proc.stdin.end()
  })

  converter.stream = srcStream => {
    const proc = spawn(command, option)
    srcStream.pipe(proc.stdin)
    return proc.stdout
  }

  return converter
}

pandoc.toFile = (from, to, outputPath, ...args) => {
  const command = getCommand()
  const option = buildPandocOptions(from, to, outputPath, ...args)

  return new Promise((resolve, reject) => {
    const proc = spawn(command, option)
    let stderr = ''
    proc.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })
    proc.on('error', reject)
    proc.on('close', code => {
      if (code === 0) {
        resolve(outputPath)
      } else {
        reject(new Error(stderr || `pandoc exited with code ${code}`))
      }
    })
    proc.stdin.end()
  })
}

pandoc.exists = () => {
  if (envPathExists()) {
    return true
  }
  return commandExists.sync(pandocCommand)
}

const envPathExists = () => {
  return !!process.env.MARKDOWNPP_PANDOC && isFile2(process.env.MARKDOWNPP_PANDOC)
}

export default pandoc
