export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <div className="bg-muted/50 aspect-video rounded-xl p-4">FORM</div>
        <div className="bg-muted/50 aspect-video rounded-xl p-4">LOGS</div>
      </div>
    </div>
  )
}
