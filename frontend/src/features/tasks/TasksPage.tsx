import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Empty, Pagination, Typography } from 'antd'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { parseApiError } from '../../api/errors'
import * as tasksApi from '../../api/tasks'
import type { Task, TaskInput, TaskQuery } from '../../api/types'
import { ErrorState } from '../../components/ErrorState'
import { hasActiveFilters, PAGE_SIZE, paramsFromQuery, queryFromParams } from './query'
import { TaskFilters } from './TaskFilters'
import { TaskFormModal } from './TaskFormModal'
import { TaskList } from './TaskList'
import { TaskSummaryCards } from './TaskSummaryCards'
import { useAsync } from './useAsync'

type ModalState = { open: false } | { open: true; task: Task | null }

export function TasksPage() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => queryFromParams(searchParams), [searchParams])
  const [modal, setModal] = useState<ModalState>({ open: false })

  const list = useAsync(
    (signal) => tasksApi.listTasks({ ...query, page_size: PAGE_SIZE }, signal),
    [query],
  )
  const summary = useAsync((signal) => tasksApi.getTaskSummary(signal), [])

  const updateQuery = useCallback(
    (patch: Partial<TaskQuery>) => {
      // Any filter change resets to page 1 unless the patch sets a page.
      setSearchParams(paramsFromQuery({ ...query, page: 1, ...patch }))
    },
    [query, setSearchParams],
  )

  const refreshAll = () => {
    list.reload()
    summary.reload()
  }

  const showMutationError = (err: unknown) => {
    const { status } = parseApiError(err)
    void message.error(status === null ? t('common.networkError') : t('common.genericError'))
  }

  const handleSubmit = async (input: TaskInput) => {
    const editing = modal.open ? modal.task : null
    if (editing) {
      await tasksApi.updateTask(editing.id, input)
      void message.success(t('tasks.updated'))
    } else {
      await tasksApi.createTask(input)
      void message.success(t('tasks.created'))
    }
    setModal({ open: false })
    refreshAll()
  }

  const handleDelete = async (task: Task) => {
    try {
      await tasksApi.deleteTask(task.id)
      void message.success(t('tasks.deleted'))
      // Deleting the last item on a page would leave an empty page behind.
      if (list.data?.results.length === 1 && query.page > 1) {
        updateQuery({ page: query.page - 1 })
        summary.reload()
      } else {
        refreshAll()
      }
    } catch (err) {
      showMutationError(err)
    }
  }

  const handleComplete = async (task: Task) => {
    try {
      await tasksApi.updateTask(task.id, { status: 'done' })
      void message.success(t('tasks.updated'))
      refreshAll()
    } catch (err) {
      showMutationError(err)
    }
  }

  const filtered = hasActiveFilters(query)
  const data = list.data

  let body: ReactNode
  if (list.error && !data) {
    body = (
      <ErrorState
        title={t('tasks.loadFailed')}
        description={list.error.status === null ? t('common.networkError') : undefined}
        onRetry={list.reload}
      />
    )
  } else if (data && data.count === 0 && !list.loading) {
    body = filtered ? (
      <Empty description={t('tasks.noMatch')}>
        <Button onClick={() => setSearchParams(new URLSearchParams())}>
          {t('tasks.clearFilters')}
        </Button>
      </Empty>
    ) : (
      <Empty description={<span>{t('tasks.empty')}<br />{t('tasks.emptyHint')}</span>}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true, task: null })}>
          {t('tasks.newTask')}
        </Button>
      </Empty>
    )
  } else {
    body = (
      <>
        <TaskList
          tasks={data?.results ?? []}
          loading={list.loading}
          onEdit={(task) => setModal({ open: true, task })}
          onDelete={handleDelete}
          onComplete={handleComplete}
        />
        {data && data.count > PAGE_SIZE && (
          <div className="mt-4 flex justify-center sm:justify-end">
            <Pagination
              current={query.page}
              pageSize={PAGE_SIZE}
              total={data.count}
              showSizeChanger={false}
              onChange={(page) => updateQuery({ page })}
            />
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={1} className="!m-0 !text-2xl">
          {t('tasks.heading')}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true, task: null })}>
          {t('tasks.newTask')}
        </Button>
      </div>

      <TaskSummaryCards summary={summary.data} />
      <TaskFilters query={query} onChange={updateQuery} />
      <section aria-busy={list.loading} aria-label={t('tasks.heading')}>
        {body}
      </section>

      <TaskFormModal
        open={modal.open}
        task={modal.open ? modal.task : null}
        onCancel={() => setModal({ open: false })}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
