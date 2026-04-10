export default function StatsCard({ title, value, icon, color }) {
  return (
    <div className="flex items-center p-4 bg-white shadow rounded-md">
      <div className={`p-3 rounded-full ${color} flex items-center justify-center mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
