import { Card, Typography } from 'antd'
import type { ReactNode } from 'react'

interface Props {
  title: string
  extra?: ReactNode
  /** True while refetching: the previous render stays, dimmed, so nothing jumps. */
  stale?: boolean
  children: ReactNode
}

export function ChartCard({ title, extra, stale, children }: Props) {
  return (
    <Card
      className="h-full"
      styles={{ body: { opacity: stale ? 0.6 : 1, transition: 'opacity 150ms' } }}
      title={
        <Typography.Title level={2} className="!m-0 !text-base">
          {title}
        </Typography.Title>
      }
      extra={extra && <Typography.Text type="secondary">{extra}</Typography.Text>}
    >
      {children}
    </Card>
  )
}

interface TableProps {
  caption: string
  headers: string[]
  rows: (string | number)[][]
}

/** Screen-reader twin of a chart, so no value depends on colour or hover. */
export function ChartTable({ caption, headers, rows }: TableProps) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(row[0])}>
            {row.map((cell, index) =>
              index === 0 ? (
                <th key={index} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={index}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
