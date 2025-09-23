export default function SimpleTest() {
  return (
    <div className="p-8 bg-green-100 min-h-screen">
      <h1 className="text-4xl font-bold text-green-800 mb-4">✅ SIMPLE TEST WORKS!</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl mb-4">📧 Test Invite API</h2>
        
        <button 
          className="bg-blue-500 text-white px-6 py-3 rounded text-lg"
          onClick={async () => {
            const email = prompt("Enter test email:")
            if (!email) return
            
            try {
              const response = await fetch("/api/invite-member", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  groupId: "test-123",
                  email: email
                })
              })
              
              const result = await response.json()
              alert(JSON.stringify(result, null, 2))
            } catch (error) {
              alert("Error: " + error)
            }
          }}
        >
          🧪 TEST INVITE API
        </button>
      </div>
      
      <div className="text-sm text-green-700">
        <p>✅ This page loads = Next.js works</p>
        <p>✅ Click button = JavaScript works</p>
        <p>✅ API call = Backend works</p>
        <p>✅ URL: /simple-test</p>
      </div>
    </div>
  )
}
