import { AdminButton } from "@/components/ui/admin/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPanelPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="container flex flex-col items-center justify-center gap-8">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Admin Panel
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome to the admin panel
        </p>
        
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Admin Button Examples</CardTitle>
            <CardDescription>
              Examples of admin buttons with different variants
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <AdminButton variant="edit">Edit</AdminButton>
            <AdminButton variant="delete">Delete</AdminButton>
            <AdminButton variant="update">Update</AdminButton>
            <AdminButton variant="view">View Details</AdminButton>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
