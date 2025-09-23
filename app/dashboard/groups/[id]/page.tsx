"use client"

export default function GroupPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Your Group</h1>
      <p className="text-gray-600 mb-8">ID: {params.id}</p>
      
      <div className="space-y-6">
        {/* Invite Members */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            👥 Invite Members
          </h2>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Enter email address"
              className="border border-gray-300 px-3 py-2 rounded flex-1"
            />
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => alert("✅ Member invited!")}
            >
              Send Invite
            </button>
          </div>
        </div>

        {/* Upload Photo */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            📸 Upload Your Photo
          </h2>
          <input 
            type="file" 
            accept="image/*" 
            className="block mb-3 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
            onChange={(e) => e.target.files?.[0] && alert("✅ Photo uploaded!")}
          />
          <p className="text-sm text-gray-500">Choose a clear photo of yourself</p>
        </div>

        {/* Upload Background */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🖼️ Upload Background
          </h2>
          <input 
            type="file" 
            accept="image/*" 
            className="block mb-3 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-50 file:text-purple-700"
            onChange={(e) => e.target.files?.[0] && alert("✅ Background uploaded!")}
          />
          <p className="text-sm text-gray-500">Upload background image (school, office, etc.)</p>
        </div>

        {/* Generate Photo */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🤖 Generate Group Photo
          </h2>
          <p className="text-gray-600 mb-4">
            Ready to create your AI-generated group photo with Nano Banana!
          </p>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            onClick={() => alert("🚀 Generating group photo with Gemini 2.5 Flash + Nano Banana!\n\nThis would normally take 30-60 seconds...")}
          >
            ✨ Generate with Nano Banana
          </button>
        </div>

        {/* Members List */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">👥 Group Members</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>you@example.com</span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Owner</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>member1@example.com</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Confirmed</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>member2@example.com</span>
              <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Invited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}