import { Alert, DatePicker, Form, Input, Modal, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { parseApiError } from '../../api/errors'
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from '../../api/types'
import { applyFieldErrors } from '../../lib/forms'

const TITLE_MAX = 200

interface FormValues {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: Dayjs | null
}

interface Props {
  open: boolean
  /** Task being edited, or null to create a new one. */
  task: Task | null
  onCancel: () => void
  onSubmit: (input: TaskInput) => Promise<void>
}

export function TaskFormModal({ open, task, onCancel, onSubmit }: Props) {
  const { t } = useTranslation()
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue(
      task
        ? { ...task, due_date: task.due_date ? dayjs(task.due_date) : null }
        : { status: 'todo', priority: 'medium' },
    )
  }, [open, task, form])

  const handleCancel = () => {
    setError(null)
    onCancel()
  }

  const handleOk = async () => {
    let values: FormValues
    try {
      values = await form.validateFields()
    } catch {
      return // antd shows the field errors
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description?.trim() ?? '',
        status: values.status,
        priority: values.priority,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      })
    } catch (err) {
      const apiError = parseApiError(err)
      if (!applyFieldErrors(form, apiError.fieldErrors)) {
        setError(apiError.status === null ? t('common.networkError') : t('common.genericError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={task ? t('tasks.editTask') : t('tasks.newTask')}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={submitting}
      destroyOnHidden
      forceRender
    >
      {error && <Alert className="mb-4" type="error" title={error} showIcon role="alert" />}
      <Form form={form} layout="vertical" requiredMark="optional" disabled={submitting}>
        <Form.Item
          label={t('tasks.fields.title')}
          name="title"
          rules={[
            { required: true, whitespace: true, message: t('common.required') },
            { max: TITLE_MAX, message: t('tasks.titleTooLong', { max: TITLE_MAX }) },
          ]}
        >
          <Input autoFocus maxLength={TITLE_MAX} showCount />
        </Form.Item>
        <Form.Item label={t('tasks.fields.description')} name="description">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
        </Form.Item>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
          <Form.Item label={t('tasks.fields.status')} name="status" rules={[{ required: true }]}>
            <Select
              options={TASK_STATUSES.map((s) => ({ value: s, label: t(`tasks.status.${s}`) }))}
            />
          </Form.Item>
          <Form.Item label={t('tasks.fields.priority')} name="priority" rules={[{ required: true }]}>
            <Select
              options={TASK_PRIORITIES.map((p) => ({ value: p, label: t(`tasks.priority.${p}`) }))}
            />
          </Form.Item>
          <Form.Item label={t('tasks.fields.dueDate')} name="due_date">
            <DatePicker className="w-full" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
