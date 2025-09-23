import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function FindMyGroupsPage() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Get all groups for this user
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🔍 Find Your Groups</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Your User Info:</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
      </div>

      {groupsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-red-800">Error Loading Groups:</h2>
          <p className="text-red-600">{groupsError.message}</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Groups ({groups?.length || 0}):</h2>
        
        {groups && groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="border rounded-lg p-6 bg-white shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{group.name}</h3>
                <p className="text-gray-600 mb-3">{group.description || "No description"}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <strong>Group ID:</strong> 
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs ml-2">{group.id}</code>
                  </div>
                  <div><strong>Status:</strong> {group.status}</div>
                  <div><strong>Created:</strong> {new Date(group.created_at).toLocaleString()}</div>
                  <div><strong>Owner:</strong> ✅ You</div>
                </div>

                <div className="flex gap-3">
                  <Link 
                    href={`/debug-group/${group.id}`}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    🔍 Debug This Group
                  </Link>
                  
                  <Link 
                    href={`/dashboard/groups/${group.id}`}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    ➡️ Go To Group Page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Groups Found</h3>
            <p className="text-yellow-700 mb-4">You don't have any groups yet, or there might be a database access issue.</p>
            <Link 
              href="/dashboard"
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Quick Actions:</h3>
        <div className="flex gap-3">
          <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
