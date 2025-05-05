export default function PendingApproval() {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl text-black font-semibold mb-4">⏳ Waiting for Admin Approval</h2>
          <p className="text-xl text-black font-semibold mb-4">Your request to join has been sent to the room admin.</p>
        </div>
      </div>
    );
  }