import { Input, Select } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskOrdering,
  type TaskPriority,
  type TaskQuery,
  type TaskStatus,
} from '../../api/types'
import { useDebouncedValue } from '../../lib/useDebouncedValue'
import { ORDERINGS } from './query'

interface Props {
  query: TaskQuery
  onChange: (patch: Partial<TaskQuery>) => void
}

export function TaskFilters({ query, onChange }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState(query.search ?? '')
  const debouncedSearch = useDebouncedValue(search.trim(), 350)

  // Keep the input in sync when the URL changes externally (back button, "clear filters").
  useEffect(() => setSearch(query.search ?? ''), [query.search])

  useEffect(() => {
    if (debouncedSearch !== (query.search ?? '')) {
      onChange({ search: debouncedSearch || undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [debouncedSearch])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
      <Input.Search
        allowClear
        aria-label={t('tasks.filters.search')}
        placeholder={t('tasks.filters.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onSearch={(value) => onChange({ search: value.trim() || undefined })}
      />
      <Select<TaskStatus>
        allowClear
        aria-label={t('tasks.fields.status')}
        placeholder={t('tasks.filters.allStatuses')}
        value={query.status}
        onChange={(status) => onChange({ status })}
        options={TASK_STATUSES.map((s) => ({ value: s, label: t(`tasks.status.${s}`) }))}
      />
      <Select<TaskPriority>
        allowClear
        aria-label={t('tasks.fields.priority')}
        placeholder={t('tasks.filters.allPriorities')}
        value={query.priority}
        onChange={(priority) => onChange({ priority })}
        options={TASK_PRIORITIES.map((p) => ({ value: p, label: t(`tasks.priority.${p}`) }))}
      />
      <Select<TaskOrdering>
        aria-label={t('tasks.filters.sort')}
        value={query.ordering}
        onChange={(ordering) => onChange({ ordering })}
        options={ORDERINGS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
      />
    </div>
  )
}
