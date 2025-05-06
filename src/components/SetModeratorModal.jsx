export default function SetModeratorModal({ username, onClose, onConfirm }) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-50 text-black p-4 rounded-lg max-w-xs w-full">
          <p className="mb-3">Make {username} a moderator.</p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={onClose}
              className="px-2 py-1 text-sm bg-red-500 text-gray-600"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }