import { Card, Grid, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'

import type { Task } from '../../api/types'
import { TaskActions } from './TaskActions'
import { DueDate, PriorityTag, StatusTag } from './TaskMeta'

interface Props {
  tasks: Task[]
  loading: boolean
  onEdit: (task: Task) => void
  onDelete: (task: Task) => Promise<void>
  onComplete: (task: Task) => Promise<void>
}

/** Table on tablet/desktop, stacked cards on phones. */
export function TaskList({ tasks, loading, ...actions }: Props) {
  const { t } = useTranslation()
  const screens = Grid.useBreakpoint()

  // useBreakpoint() is empty on the first render; default to the table until measured.
  if (screens.md === false) {
    return (
      <Spin spinning={loading}>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {tasks.map((task) => (
            <li key={task.id}>
              <Card size="small">
                <div className="flex items-start justify-between gap-2">
                  <Typography.Text strong delete={task.status === 'done'} className="break-words">
                    {task.title}
                  </Typography.Text>
                  <TaskActions task={task} {...actions} />
                </div>
                {task.description && (
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="!mb-2 !mt-1">
                    {task.description}
                  </Typography.Paragraph>
                )}
                <div className="flex flex-wrap items-center gap-y-1">
                  <StatusTag status={task.status} />
                  <PriorityTag priority={task.priority} />
                  <DueDate task={task} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </Spin>
    )
  }

  const columns: ColumnsType<Task> = [
    {
      title: t('tasks.fields.title'),
      dataIndex: 'title',
      render: (_, task) => (
        <div className="min-w-0">
          <Typography.Text strong delete={task.status === 'done'}>
            {task.title}
          </Typography.Text>
          {task.description && (
            <Typography.Paragraph type="secondary" ellipsis={{ rows: 1 }} className="!mb-0">
              {task.description}
            </Typography.Paragraph>
          )}
        </div>
      ),
    },
    {
      title: t('tasks.fields.status'),
      dataIndex: 'status',
      width: 140,
      render: (_, task) => <StatusTag status={task.status} />,
    },
    {
      title: t('tasks.fields.priority'),
      dataIndex: 'priority',
      width: 110,
      render: (_, task) => <PriorityTag priority={task.priority} />,
    },
    {
      title: t('tasks.fields.dueDate'),
      dataIndex: 'due_date',
      width: 190,
      render: (_, task) => <DueDate task={task} />,
    },
    {
      title: <span className="sr-only">{t('common.actions')}</span>,
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, task) => <TaskActions task={task} {...actions} />,
    },
  ]

  return (
    <Table<Task>
      rowKey="id"
      columns={columns}
      dataSource={tasks}
      loading={loading}
      pagination={false}
      tableLayout="fixed"
    />
  )
}
