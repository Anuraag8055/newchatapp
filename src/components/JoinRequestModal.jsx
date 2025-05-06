export default function JoinRequestModal({ requests, onDecision, onClose }) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h3 className="font-bold text-lg mb-4">Join Requests</h3>
          {requests.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            requests.map((req) => (
              <div key={req.username} className="flex justify-between items-center mb-3 rounded-md">
                <span className="text-xl text-black font-semibold mb-4">{req.username}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onDecision(req, true)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDecision(req, false)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
          <button
            onClick={onClose}
            className="mt-4 text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }