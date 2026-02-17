import { Construction } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <Construction className="h-16 w-16 text-gray-400 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-800">Under Maintenance</h1>
        <p className="text-gray-500 max-w-md">
          The system is currently undergoing scheduled maintenance. Please check back later.
        </p>
      </div>
    </div>
  );
}
