#!/usr/bin/env node
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface WidgetPackageJson {
  name: string
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const WIDGETS_DIR = resolve(__dirname, '../widgets')
const ROOT_DIR = resolve(__dirname, '..')

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

async function readJsonFile<T>(path: string): Promise<T> {
  const content = await fs.readFile(path, 'utf-8')
  return JSON.parse(content)
}

async function getWidgetDirectories(): Promise<string[]> {
  const entries = await fs.readdir(WIDGETS_DIR, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
}

async function installWidgetDependencies(widgetName: string): Promise<void> {
  const widgetDir = join(WIDGETS_DIR, widgetName)
  const packageJsonPath = join(widgetDir, 'package.json')
  
  // Check if package.json exists
  if (!await fileExists(packageJsonPath)) {
    console.log(`⏭️  No package.json found for widget: ${widgetName}`)
    return
  }
  
  try {
    const packageJson = await readJsonFile<WidgetPackageJson>(packageJsonPath)
    
    if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
      console.log(`⏭️  No dependencies for widget: ${widgetName}`)
      return
    }
    
    console.log(`📦 Installing dependencies for widget: ${widgetName}`)
    console.log(`   Dependencies:`, Object.keys(packageJson.dependencies).join(', '))
    
    // Install dependencies in the widget directory
    const { stdout, stderr } = await execAsync('npm install --production', {
      cwd: widgetDir
    })
    
    if (stderr && !stderr.includes('npm notice')) {
      console.error(`⚠️  Warning for ${widgetName}:`, stderr)
    }
    
    console.log(`✅ Dependencies installed for: ${widgetName}`)
  } catch (error) {
    console.error(`❌ Failed to install dependencies for ${widgetName}:`, error)
  }
}


async function main() {
  console.log('🚀 Installing widget dependencies...\n')
  
  try {
    // Get all widget directories
    const widgetDirs = await getWidgetDirectories()
    console.log(`Found ${widgetDirs.length} widgets:`, widgetDirs.join(', '))
    console.log()
    
    // Install dependencies for each widget
    for (const widgetName of widgetDirs) {
      await installWidgetDependencies(widgetName)
    }
    
    console.log('\n✨ Widget dependency installation complete!')
  } catch (error) {
    console.error('❌ Error installing widget dependencies:', error)
    process.exit(1)
  }
}

// Run the script
main()