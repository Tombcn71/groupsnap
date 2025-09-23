"use client"

import { useState } from "react"

export default function TestGroupPage() {
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [result, setResult] = useState("")

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setResult("❌ Please enter an email address")
      return
    }

    setInviteLoading(true)
    setResult("🔄 Sending invite...")
    
    try {
      const response = await fetch("/api/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: "test-group-123",
          email: inviteEmail.trim()
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ SUCCESS: ${data.message}`)
        setInviteEmail("")
      } else {
        setResult(`❌ ERROR: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ NETWORK ERROR: ${error}`)
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Test Invite Function</h1>
      
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">👥 Test Invite Members</h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Enter test email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="border-2 border-gray-300 px-3 py-2 rounded flex-1 text-lg"
              disabled={inviteLoading}
            />
            <button 
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded text-lg font-semibold"
              onClick={handleInvite}
              disabled={inviteLoading}
            >
              {inviteLoading ? "Testing..." : "TEST INVITE"}
            </button>
          </div>
          
          {result && (
            <div className="p-4 border rounded bg-gray-50">
              <pre className="text-sm">{result}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800">🔍 Debug Info:</h3>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>• Test Group ID: test-group-123</li>
          <li>• API Endpoint: /api/invite-member</li>
          <li>• Page: /test-group</li>
          <li>• This should work without authentication</li>
        </ul>
      </div>
    </div>
  )
}
