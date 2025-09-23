import { createClient } from "@/lib/supabase/server"

export default async function DebugGroupPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  console.log("Debug: Group ID:", params.id)

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log("Debug: User:", user?.id, userError)

    if (!user) {
      return <div className="p-8">❌ No user found</div>
    }

    // Get group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", params.id)
      .single()

    console.log("Debug: Group:", group, groupError)

    // Get membership
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", params.id)
      .eq("user_id", user.id)
      .single()

    console.log("Debug: Membership:", membership, memberError)

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", params.id)

    console.log("Debug: All members:", members, membersError)

    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold">🔍 Debug Group Page</h1>
        
        <div className="space-y-2">
          <p><strong>Group ID:</strong> {params.id}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>User Email:</strong> {user.email}</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Group Data:</h2>
          {group ? (
            <div>
              <p><strong>Name:</strong> {group.name}</p>
              <p><strong>Owner ID:</strong> {group.owner_id}</p>
              <p><strong>Is Owner:</strong> {group.owner_id === user.id ? "✅" : "❌"}</p>
            </div>
          ) : (
            <p className="text-red-500">❌ No group found: {groupError?.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Membership:</h2>
          {membership ? (
            <div>
              <p><strong>Status:</strong> {membership.status}</p>
              <p><strong>Email:</strong> {membership.email}</p>
              <p><strong>Is Member:</strong> ✅</p>
            </div>
          ) : (
            <p className="text-red-500">❌ Not a member: {memberError?.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">All Members ({members?.length || 0}):</h2>
          {members && members.length > 0 ? (
            <ul className="list-disc list-inside">
              {members.map((m, i) => (
                <li key={i}>{m.email} - {m.status} - {m.user_id}</li>
              ))}
            </ul>
          ) : (
            <p className="text-red-500">❌ No members found: {membersError?.message}</p>
          )}
        </div>

        <div className="mt-8">
          <a href={`/dashboard/groups/${params.id}`} className="text-blue-500 underline">
            Try Normal Group Page
          </a>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">💥 Error</h1>
        <pre className="mt-4 bg-red-50 p-4 rounded">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    )
  }
}
