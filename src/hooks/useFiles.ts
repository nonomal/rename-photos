import { getInitialFormat, StorageKey, TauriCommand } from '@/const'
import { useError } from '@/hooks'
import { FileInfo, transformIpcFiles } from '@/util'
import { invoke } from '@tauri-apps/api/core'
import { listen, TauriEvent } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-dialog'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

export function useFiles() {
  const { t } = useTranslation()
  const { handleError } = useError()
  const [isDragging, setIsDragging] = useState(false)
  const [ipcFiles, setIpcFiles] = useState<IpcFiles>([])
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [format, setFormat] = useState(getInitialFormat())

  const handleOpenFolder = () => {
    open({
      multiple: false,
      directory: true,
      recursive: false,
    })
      .then(data => {
        if (!data) return
        invokeDir(data).catch(() => {})
      })
      .catch(err => {
        handleError({ err, title: t('Read Files Error') })
      })
  }

  let isRenaming = false
  const handleClickRename = async () => {
    if (isRenaming) return
    try {
      isRenaming = true
      localStorage.setItem(StorageKey.FORMAT, format)
      const time = Date.now()
      const renamePathData = files
        .filter(item => item.filename !== item.newFilename)
        .map(item => [
          `${item.dirname}/${item.filename}`,
          `${item.dirname}/${item.newFilename}`,
          `${item.dirname}/${time}_${item.filename}`,
        ])
      if (renamePathData.length) {
        const res = await invokeRename(renamePathData)
        if (res) toast.success(t('Rename Success!'), {})
      } else {
        toast.info(t('No need to perform renaming'))
      }
    } catch (err) {
      // impossible
    } finally {
      isRenaming = false
    }
  }

  useEffect(() => {
    setFiles(transformIpcFiles({ ipcFiles, format, t }))
  }, [ipcFiles, format, t])

  useEffect(() => {
    const promises = Promise.all([
      listen(TauriEvent.DRAG, () => {
        setIsDragging(true)
      }),
      listen<{ paths: string[] }>(TauriEvent.DROP, event => {
        setIsDragging(false)
        invokePaths(event.payload.paths).catch(() => {})
      }),
      listen(TauriEvent.DROP_CANCELLED, () => {
        setIsDragging(false)
      }),
    ])

    return () => {
      promises.then(([unDrag, unDrop, unDropCancel]) => {
        unDrag()
        unDrop()
        unDropCancel()
      })
    }
  }, [])

  async function invokePaths(paths: string[]): Promise<boolean> {
    try {
      if (!paths.length) return true
      const ipcFiles = await invoke<IpcFiles>(TauriCommand.GET_FILES_FROM_PATHS, { paths })
      setIpcFiles(ipcFiles)
      setSelectedFile(null)
      return true
    } catch (err) {
      handleError({ err, title: t('Read Files Error') })
      return false
    }
  }

  async function invokeDir(dirPath: string): Promise<boolean> {
    try {
      if (!dirPath) return true
      const ipcFiles = await invoke<IpcFiles>(TauriCommand.GET_FILES_FROM_DIR, { dirPath })
      setIpcFiles(ipcFiles)
      setSelectedFile(null)
      return true
    } catch (err) {
      handleError({ err, title: t('Read Folder Error') })
      return false
    }
  }

  async function invokeRename(renamePathData: string[][]): Promise<boolean> {
    try {
      if (!renamePathData.length) return true
      const ipcFiles = await invoke<IpcFiles>(TauriCommand.RENAME_FILES, { renamePathData })
      setIpcFiles(ipcFiles)
      setSelectedFile(null)
      return true
    } catch (err) {
      handleError({ err, title: t('Rename Files Error') })
      return false
    }
  }

  return {
    isDragging,
    files,
    selectedFile,
    format,
    handleOpenFolder,
    handleSelectFile: setSelectedFile,
    handleFormatChange: setFormat,
    handleClickRename,
  }
}
