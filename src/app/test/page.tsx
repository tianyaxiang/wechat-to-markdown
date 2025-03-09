export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Tailwind Test Page</h1>
      <p className="text-lg text-gray-700 mb-6">This is a test page to verify Tailwind CSS is working</p>
      <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
        <div className="bg-red-500 text-white p-4 rounded-lg shadow">Red Box</div>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow">Green Box</div>
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow">Blue Box</div>
      </div>
    </div>
  );
} 