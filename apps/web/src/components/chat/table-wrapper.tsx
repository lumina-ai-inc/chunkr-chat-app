export default function TableWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start py-4">
      <div className="markdown-table">{children}</div>
    </div>
  )
}
