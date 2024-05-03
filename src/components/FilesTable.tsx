import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@nextui-org/table'
import { useTranslation } from 'react-i18next'
import { FileInfo } from '@/hooks'

function FilesTable({ className, files }: { className?: string; files: FileInfo[] }) {
  const { t } = useTranslation()

  return (
    <Table
      selectionMode="single"
      isHeaderSticky
      classNames={{ wrapper: className }}
      isCompact
      color="primary"
      aria-label="table"
    >
      <TableHeader>
        <TableColumn>{t('Filename')}</TableColumn>
        <TableColumn>{t('Modified')}</TableColumn>
      </TableHeader>
      <TableBody>
        {files.map(fileInfo => (
          <TableRow key={fileInfo.pathname}>
            <TableCell>
              <span className="text-s ">{fileInfo.filename}</span>
            </TableCell>
            <TableCell>
              <span className="text-s text-default-500">{fileInfo.modified}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default FilesTable
