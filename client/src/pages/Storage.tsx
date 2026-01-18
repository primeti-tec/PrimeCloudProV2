import { Sidebar } from "@/components/Sidebar";
import { Button, Card, CardContent } from "@/components/ui-custom";
import { Folder, File, MoreVertical, Download, Share2, Trash } from "lucide-react";

const MOCK_FILES = [
  { name: "project-assets", type: "folder", items: "12 items", date: "2 mins ago" },
  { name: "backups", type: "folder", items: "54 items", date: "1 hour ago" },
  { name: "database-dump.sql", type: "file", size: "245 MB", date: "Yesterday" },
  { name: "hero-image.png", type: "file", size: "2.4 MB", date: "2 days ago" },
  { name: "presentation.pdf", type: "file", size: "8.1 MB", date: "1 week ago" },
];

export default function Storage() {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 ml-72 p-8">
        <header className="flex justify-between items-center mb-8">
           <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Storage Browser</h1>
              <p className="text-muted-foreground">Manage your buckets and objects.</p>
           </div>
           <Button>Upload File</Button>
        </header>

        <Card>
           <CardContent className="p-0">
              <table className="w-full">
                 <thead className="bg-slate-50 border-b">
                    <tr>
                       <th className="text-left p-4 pl-6 text-sm font-medium text-muted-foreground w-1/2">Name</th>
                       <th className="text-left p-4 text-sm font-medium text-muted-foreground">Size/Items</th>
                       <th className="text-left p-4 text-sm font-medium text-muted-foreground">Modified</th>
                       <th className="text-right p-4 pr-6 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y">
                    {MOCK_FILES.map((file, i) => (
                       <tr key={i} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                          <td className="p-4 pl-6 flex items-center gap-3">
                             {file.type === "folder" ? (
                                <Folder className="h-5 w-5 text-blue-500 fill-blue-500/20" />
                             ) : (
                                <File className="h-5 w-5 text-slate-400" />
                             )}
                             <span className="font-medium text-slate-700">{file.name}</span>
                          </td>
                          <td className="p-4 text-sm text-slate-600">{file.size || file.items}</td>
                          <td className="p-4 text-sm text-slate-600">{file.date}</td>
                          <td className="p-4 pr-6 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8"><Share2 className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"><Trash className="h-4 w-4" /></Button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </CardContent>
        </Card>
      </main>
    </div>
  );
}
