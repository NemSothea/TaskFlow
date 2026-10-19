import { CheckOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'

import type { Task } from '../../api/types'

interface Props {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => Promise<void>
  onComplete: (task: Task) => Promise<void>
}

export function TaskActions({ task, onEdit, onDelete, onComplete }: Props) {
  const { t } = useTranslation()
  return (
    <Space size={0}>
      {task.status !== 'done' && (
        <Tooltip title={t('tasks.markDone')}>
          <Button
            type="text"
            icon={<CheckOutlined />}
            aria-label={`${t('tasks.markDone')}: ${task.title}`}
            onClick={() => onComplete(task)}
          />
        </Tooltip>
      )}
      <Tooltip title={t('tasks.edit')}>
        <Button
          type="text"
          icon={<EditOutlined />}
          aria-label={`${t('tasks.edit')}: ${task.title}`}
          onClick={() => onEdit(task)}
        />
      </Tooltip>
      <Popconfirm
        title={t('tasks.deleteConfirm')}
        description={t('tasks.deleteConfirmDesc')}
        okText={t('tasks.delete')}
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel')}
        onConfirm={() => onDelete(task)}
      >
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          aria-label={`${t('tasks.delete')}: ${task.title}`}
        />
      </Popconfirm>
    </Space>
  )
}
