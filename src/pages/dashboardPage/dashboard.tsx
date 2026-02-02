import { RootState } from "../../redux/store";
import { useSelector, useDispatch } from "react-redux";
import SearchIcon from "@mui/icons-material/Search";
import HomeIcon from "@mui/icons-material/Home";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MapsUgcIcon from "@mui/icons-material/MapsUgc";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "./dashboard.css";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { db, auth } from "../../firebase/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  getDocs,
  limit,
  startAfter,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useEffect, useState, useRef } from "react";
import { handleCurrentUser } from "../../redux/slice/authSlice";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useNavigate } from "react-router";

const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

function Dashboard() {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const dispatch = useDispatch();
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [lastUserDoc, setLastUserDoc] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const USERS_LIMIT = 15;

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [showProfileBox, setShowProfileBox] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const navigate = useNavigate();

  const usersRefDiv = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getChatId = (id1: string, id2: string) =>
    id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;

  // ⬇️ ADD THIS EFFECT — MAKE USER OFFLINE ON TAB CLOSE
  useEffect(() => {
    const markOffline = async () => {
      if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.id), {
          isOnline: false,
        });
      }
    };

    window.addEventListener("beforeunload", markOffline);
    return () => window.removeEventListener("beforeunload", markOffline);
  }, [currentUser]);
  // ⬆️ END ADD

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load initial users
  const loadInitialUsers = async () => {
    if (!currentUser) return;
    setUsersLoading(true);

    const qUsers = query(
      collection(db, "users"),
      orderBy("userName"),
      limit(USERS_LIMIT)
    );

    const snapshot = await getDocs(qUsers);
    const list: any[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.id !== currentUser.id) list.push(data);
    });

    setUsers(list);
    setLastUserDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setUsersLoading(false);
  };

  // Load more users (infinite scroll)
  const loadMoreUsers = async () => {
    if (!currentUser || !lastUserDoc || usersLoading) return;
    setUsersLoading(true);

    const qMore = query(
      collection(db, "users"),
      orderBy("userName"),
      startAfter(lastUserDoc),
      limit(USERS_LIMIT)
    );

    const snapshot = await getDocs(qMore);
    const list: any[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.id !== currentUser.id) list.push(data);
    });

    setUsers((prev) => [...prev, ...list]);
    setLastUserDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setUsersLoading(false);
  };

  useEffect(() => {
    loadInitialUsers();
  }, [currentUser]);

  // Search users
  useEffect(() => {
    if (!currentUser) return;

    if (searchInput.trim() === "") {
      loadInitialUsers();
      return;
    }

    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const all: any[] = [];
      snapshot.forEach((doc) => all.push(doc.data()));

      const filtered = all.filter((u) => u.id !== currentUser.id);
      const search = searchInput.toLowerCase();

      setUsers(
        filtered.filter((u) =>
          (u.userName || u.email)?.toLowerCase().includes(search)
        )
      );
    });

    return () => unsub();
  }, [searchInput]);

  const handleScrollUsers = () => {
    const div = usersRefDiv.current;
    if (!div) return;

    if (div.scrollTop + div.clientHeight >= div.scrollHeight - 5) {
      loadMoreUsers();
    }
  };

  const loadMessages = (receiver: any) => {
    if (!currentUser) return;
    setSelectedUser(receiver);
    setShowMobileChat(true);

    const chatId = getChatId(currentUser.id, receiver.id);
    const qMsg = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    const unsubTyping = onSnapshot(
      doc(db, "chats", chatId, "typing", receiver.id),
      (snap) => {
        if (snap.exists()) setIsTyping(snap.data().typing === true);
        else setIsTyping(false);
      }
    );

    return () => {
      unsubMsg();
      unsubTyping();
    };
  };

  const handleTyping = async () => {
    if (!currentUser || !selectedUser) return;

    const chatId = getChatId(currentUser.id, selectedUser.id);

    await updateDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
      typing: true,
    }).catch(async () => {
      await setDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
        typing: true,
      });
    });

    clearTimeout((window as any).typingTimeout);
    (window as any).typingTimeout = setTimeout(async () => {
      await updateDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
        typing: false,
      }).catch(async () => {
        await setDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
          typing: false,
        });
      });
    }, 2000);
  };

  const sendMessage = async (imageUrl?: string) => {
    if ((!inputMsg.trim() && !imageUrl) || !selectedUser || !currentUser) return;
    const chatId = getChatId(currentUser.id, selectedUser.id);

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: inputMsg,
      imageUrl: imageUrl || null,
      sender: currentUser.id,
      receiver: selectedUser.id,
      timestamp: new Date(),
    });

    await updateDoc(doc(db, "chats", chatId, "typing", currentUser.id), {
      typing: false,
    }).catch(() => {});

    setInputMsg("");
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET ?? "");
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME ?? "");
    formData.append("folder", "chat_images");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("Failed to get image URL");
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !selectedUser) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be less than 10MB");
      return;
    }

    setImageUploading(true);

    try {
      const imageUrl = await uploadToCloudinary(file);

      if (imageUrl) {
        await sendMessage(imageUrl);
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
    }

    setImageUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogout = async () => {
    if (currentUser) {
      await updateDoc(doc(db, "users", currentUser.id), { isOnline: false });
    }
    await signOut(auth);
    dispatch(handleCurrentUser(null));
    navigate("/");
  };

  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setInputMsg((prev) => prev + emojiObject.emoji);
    setShowPicker(false);
  };

  const handleBackToUsers = () => {
    setShowMobileChat(false);
    setSelectedUser(null);
  };

  if (!currentUser) return <h2 className="login-message">Please login first...</h2>;

  return (
    <div className="main-container">
      <header>
        <div className="logo">
          <h1>💬 ChatApp</h1>
        </div>

        <div className="icons">
          <SearchIcon className="header-icon" />
          <MapsUgcIcon className="header-icon" />
          <HomeIcon className="header-icon" />
          <FavoriteBorderIcon className="header-icon" />
          <img
            src={currentUser.photoUrl || "/defaultImg.jpg"}
            width="40"
            height="40"
            className="header-profile-img"
            onClick={() => setShowProfileBox(!showProfileBox)}
            alt="Profile"
          />
          {showProfileBox && (
            <div className="profile-popup">
              <button className="profile-name" onClick={() => navigate("/EditProfile")}>
                👤 Profile
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="chat-section">
        <div className={`users-section ${showMobileChat ? "mobile-hidden" : ""}`}>
          <div className="user-search">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              className="userSearchInput"
              placeholder="Search users..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div
            className="users"
            ref={usersRefDiv}
            onScroll={handleScrollUsers}
          >
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="user-row"
                        onClick={() => loadMessages(user)}
                      >
                        <TableCell>
                          <div className="user-item">
                            <div className="user-avatar-container">
                              <img
                                src={user.photoUrl || "/defaultImg.jpg"}
                                className="user-avatar"
                                alt={user.userName}
                              />
                              {user.isOnline && <span className="online-dot"></span>}
                            </div>
                            <div className="user-info">
                              <span className="user-name">{user.userName || user.email}</span>
                              {user.isOnline && (
                                <span className="online-status">Online</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="no-users">No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {usersLoading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Loading more users...</p>
              </div>
            )}
          </div>
        </div>

        <div className={`chat-page ${showMobileChat ? "mobile-visible" : ""}`}>
          {selectedUser ? (
            <>
              <div className="reciverInfo">
                <div className="receiver-left">
                  <ArrowBackIcon
                    className="back-arrow"
                    onClick={handleBackToUsers}
                  />
                  <img
                    src={selectedUser.photoUrl || "/defaultImg.jpg"}
                    className="receiver-avatar"
                    alt={selectedUser.userName}
                  />
                  <div>
                    <h3>{selectedUser.userName || selectedUser.email}</h3>
                    {selectedUser.isOnline && (
                      <span className="online-badge">Online</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === currentUser.id;
                  let formatted = "";
                  if (msg.timestamp) {
                    const d = msg.timestamp.toDate?.() || new Date(msg.timestamp);
                    formatted = d.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  }
                  return (
                    <div key={idx} className={`message-row ${isMe ? "me" : "them"}`}>
                      <div className="message-bubble">
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            className="message-image"
                            alt="Sent image"
                          />
                        )}
                        {msg.text && <span className="message-text">{msg.text}</span>}
                        <span className="message-time">{formatted}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {isTyping && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>{selectedUser.userName || selectedUser.email} is typing...</span>
                </div>
              )}

              <div className="chat-input">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                />

                <button
                  className="attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  title="Attach image"
                >
                  {imageUploading ? (
                    <div className="mini-spinner"></div>
                  ) : (
                    <AttachFileIcon />
                  )}
                </button>

                <div className="emoji-section">
                  {showPicker && (
                    <div className="emoji-popup">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>

                <button
                  className="emoji-btn"
                  onClick={() => setShowPicker(!showPicker)}
                  title="Add emoji"
                >
                  <InsertEmoticonIcon />
                </button>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputMsg}
                  onChange={(e) => {
                    setInputMsg(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="message-input"
                />

                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={!inputMsg.trim() && !imageUploading}
                  title="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <MapsUgcIcon className="no-chat-icon" />
              <h2>Start a Conversation</h2>
              <p>Select a user from the list to begin chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
