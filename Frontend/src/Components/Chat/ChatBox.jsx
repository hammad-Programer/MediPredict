import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../../Context/ChatContext";

function ChatBox({ currentUserId, currentUserRole }) {
  const { messages, setMessages } = useChat();
  const chatEndRef = useRef(null);

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu({ ...contextMenu, visible: false });
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const handleEdit = (msg) => {
    setEditId(msg._id);
    setEditText(msg.text);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const confirmEdit = async () => {
    try {
      await fetch("/api/chat/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: contextMenu.message.chatId,
          messageId: editId,
          newText: editText,
        }),
      });

      setMessages((prev) =>
        prev.map((m) => (m._id === editId ? { ...m, text: editText } : m))
      );

      setEditId(null);
      setEditText("");
    } catch (err) {
      console.error("Edit failed", err);
    }
  };

  const handleDelete = async (msg) => {
    try {
      await fetch(`/api/chat/delete/${msg.chatId}/${msg._id}`, {
        method: "DELETE",
      });

      setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      setContextMenu({ ...contextMenu, visible: false });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-6 overflow-y-auto flex-grow bg-gradient-to-b from-white relative">
      {messages.map((msg) => {
        const isSender = msg.senderId?.toString() === currentUserId?.toString();
        const isOwnMessage = isSender && msg.senderModel === currentUserRole;

        return (
          <div
            key={msg._id}
            onContextMenu={(e) => {
              if (isOwnMessage) {
                e.preventDefault();
                setContextMenu({
                  visible: true,
                  x: e.pageX - 150,
                  y: e.pageY,
                  message: msg,
                });
              }
            }}
            className={`flex ${isSender ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`group relative max-w-xs md:max-w-sm p-4 rounded-2xl text-sm shadow-md transition-all ${
                isSender
                  ? "bg-white text-black rounded-br-none"
                  : "bg-gray-100 text-gray-800 border rounded-bl-none"
              }`}
            >
              {msg.type === "image" ? (
                <img src={msg.fileData} alt="sent image" className="rounded-lg max-w-full" />
              ) : msg.type === "file" ? (
                <div className="flex items-center gap-3 bg-red-50 text-gray-800 p-3 rounded-md shadow-sm">
                  <img src="/pdf-icon.png" alt="PDF" className="w-8 h-8" />
                  <div className="flex flex-col flex-grow overflow-hidden">
                    <p className="font-semibold truncate">{msg.fileName}</p>
                    <span className="text-xs text-gray-500">PDF • 300 KB</span>
                  </div>
                  <a
                    href={msg.fileData}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={msg.fileName}
                    className="text-xl text-gray-500 hover:text-gray-700"
                    title="Download"
                  >
                    ⬇️
                  </a>
                </div>
              ) : editId === msg._id ? (
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmEdit();
                    }
                  }}
                  className="text-black px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              ) : (
                <p className="break-words leading-relaxed tracking-wide whitespace-pre-line">{msg.text}</p>
              )}

              <div className="text-[10px] text-gray-400 mt-2 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.message && (
        <div
          className="absolute z-50 bg-white border rounded shadow-md text-sm w-28"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="w-full px-4 py-2 hover:bg-gray-100 text-left"
            onClick={() => handleEdit(contextMenu.message)}
          >
            Edit
          </button>
          <button
            className="w-full px-4 py-2 hover:bg-gray-100 text-left text-red-500"
            onClick={() => handleDelete(contextMenu.message)}
          >
            Delete
          </button>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}

export default ChatBox;
