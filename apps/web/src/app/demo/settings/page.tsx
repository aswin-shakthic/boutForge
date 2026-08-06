import { MOCK_CLUB } from "@/lib/mock-data";

export default function DemoSettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-navy">Settings</h1>

      <div className="card space-y-4">
        <h2 className="font-semibold text-navy">Club</h2>
        <p className="text-sm"><span className="text-gray-500">Name:</span> {MOCK_CLUB.name}</p>
        <p className="text-sm"><span className="text-gray-500">State unit:</span> {MOCK_CLUB.state_unit}</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-navy">Invite Team Members</h2>
        <p className="text-sm text-gray-500">
          Generate an invite link for coaches or viewers to join your club.
        </p>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select className="input-field" defaultValue="coach">
            <option value="coach">Coach</option>
            <option value="viewer">Viewer</option>
            <option value="club_admin">Club Admin</option>
          </select>
        </div>
        <button className="btn-primary">Generate Invite Link</button>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Sample invite link:</p>
          <code className="text-sm break-all">
            http://localhost:3000/signup?invite=a1b2c3d4e5f6g7h8
          </code>
        </div>
      </div>
    </div>
  );
}
